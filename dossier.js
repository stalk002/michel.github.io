// dossier.js : gestion des dossiers (création multi-étapes, stockage local, détail)
let dossiers = []; // liste en mémoire
let tempDossier = {}; // stockage temporaire quand on navigue entre étapes

// charger depuis localStorage
function loadDossiersFromStorage(){
  const raw = localStorage.getItem('echeancier_dossiers');
  dossiers = raw ? JSON.parse(raw) : [];
}

// sauvegarde dans storage
function saveDossiersToStorage(){
  localStorage.setItem('echeancier_dossiers', JSON.stringify(dossiers));
  updateEtatAffichage();
}

// Étapes navigation (respect du PPT)
function toStep1(){
  showScreen('new-dossier-1-screen');
}
function toStep2(){
  // récupérer les valeurs du step1 et valider
  const code = document.getElementById('nd-code').value.trim();
  const client = document.getElementById('nd-client').value.trim();
  const montantGlobal = parseFloat(document.getElementById('nd-montant-global').value);
  const periodicite = document.getElementById('nd-periodicite').value;
  const contacts = document.getElementById('nd-contacts').value.trim();

  if(!code || !client || isNaN(montantGlobal)){
    alert('Veuillez remplir Code dossier, Libellé/Client et Montant global dû.');
    return;
  }
  tempDossier.code = code;
  tempDossier.client = client;
  tempDossier.montantGlobal = Number(montantGlobal);
  tempDossier.periodicite = periodicite;
  tempDossier.contacts = contacts;

  showScreen('new-dossier-2-screen');
}

function toStep3(){
  // step2 -> récupérer nb differés, nb échéances, montant échéance, date 1ère
  const nbDifferes = parseInt(document.getElementById('nd-nb-differes').value) || 0;
  const nbEcheances = parseInt(document.getElementById('nd-nb-echeances').value) || 0;
  const montantEcheance = parseFloat(document.getElementById('nd-montant-echeance').value) || null;
  const datePremiere = document.getElementById('nd-date-premiere').value;

  if(isNaN(nbEcheances) || nbEcheances <= 0 || !datePremiere){
    alert('Veuillez renseigner Nb échéances et Date 1ère échéance.');
    return;
  }

  tempDossier.nbDifferes = nbDifferes;
  tempDossier.nbEcheances = nbEcheances;
  tempDossier.montantEcheance = montantEcheance;
  tempDossier.datePremiere = datePremiere;

  // générer preview - la fonction previewEcheancierPreview utilise tempDOM fields donc on affiche juste step3
  showScreen('new-dossier-3-screen');
  // la preview est déclenchée automatiquement par main.js si écran actif
}

// Enregistrer final (bouton ENREGISTRER, NOUVEAU DOSSIER 3/3)
function saveDossier(){
  // construire objet définitif
  const dd = {
    code: tempDossier.code,
    client: tempDossier.client,
    montantGlobal: tempDossier.montantGlobal,
    periodicite: tempDossier.periodicite,
    contacts: tempDossier.contacts,
    nbDifferes: tempDossier.nbDifferes || 0,
    nbEcheances: tempDossier.nbEcheances,
    montantEcheance: tempDossier.montantEcheance || null,
    datePremiere: tempDossier.datePremiere,
    echeances: []
  };

  // générer échéances en respectant le choix
  if(dd.montantEcheance){
    // construire à partir du montant par échéance
    const dstart = new Date(dd.datePremiere);
    let date = new Date(dstart);
    for(let i=0;i<dd.nbEcheances;i++){
      dd.echeances.push({
        numero: i+1,
        date: date.toISOString().slice(0,10),
        montant: Number(dd.montantEcheance.toFixed(2)),
        statut: 'en attente',
        montantPaye: 0,
        datePaiement: null
      });
      date = addPeriod(date, dd.periodicite, 1);
    }
  } else {
    dd.echeances = generateEcheancier(dd.montantGlobal, dd.nbEcheances, new Date(dd.datePremiere), dd.periodicite, dd.nbDifferes);
  }

  // push en mémoire et stockage local
  loadDossiersFromStorage();
  dossiers.push(dd);
  saveDossiersToStorage();

  // reset temp
  tempDossier = {};
  // vider inputs
  document.querySelectorAll('#new-dossier-1-screen input, #new-dossier-2-screen input').forEach(i => i.value = '');
  alert('Dossier créé avec succès.');
  showScreen('choix-process-screen');
}

// afficher détail dossier + possibilité de consulter échéances
function renderDossierList(containerId = 'search-results-list'){
  loadDossiersFromStorage();
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if(dossiers.length === 0){
    container.innerHTML = '<p>Aucun dossier enregistré.</p>';
    return;
  }
  dossiers.forEach((d, idx) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <div><strong>${d.code}</strong> - ${d.client} - ${d.montantGlobal.toFixed(2)} CFA</div>
      <div class="meta">Nb échéances: ${d.nbEcheances} · Périodicité: ${d.periodicite}</div>
      <div style="margin-top:8px">
        <button onclick="showDossier(${idx})">Voir</button>
        <button onclick="deleteDossier(${idx})" class="secondary">Supprimer</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function showDossier(index){
  loadDossiersFromStorage();
  const d = dossiers[index];
  if(!d) return alert('Dossier introuvable');
  // afficher liste d'échéances dans écran détail générique (on réutilise detail-echeance-screen)
  // pour permettre consultation, on montre un tableau puis clic sur ligne -> open detail individuel
  const html = document.createElement('div');
  html.innerHTML = `<h4>Dossier: ${d.code} - ${d.client}</h4>`;
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>N°</th><th>Date</th><th>Montant</th><th>Montant payé</th><th>Statut</th><th>Action</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  d.echeances.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.numero}</td><td>${e.date}</td><td>${e.montant.toFixed(2)}</td><td>${(e.montantPaye||0).toFixed(2)}</td><td>${e.statut}</td>
      <td><button onclick="openDetailEcheance(${index}, ${i})">Détail</button></td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  html.appendChild(table);
  // injecter dans card results du search screen
  const container = document.getElementById('search-results-list');
  container.innerHTML = '';
  container.appendChild(html);

  // aller à l'écran recherche / résultat
  showScreen('search-screen');
}

// supprimer dossier
function deleteDossier(index){
  if(!confirm('Supprimer ce dossier ?')) return;
  loadDossiersFromStorage();
  dossiers.splice(index,1);
  saveDossiersToStorage();
  renderDossierList('search-results-list');
  updateEtatAffichage();
}

// ouvre l'écran DETAIL ECHEANCE pour une échéance précise
let currentDetail = { dossierIndex:null, echeanceIndex:null };
function openDetailEcheance(dIndex, eIndex){
  loadDossiersFromStorage();
  const d = dossiers[dIndex];
  const e = d.echeances[eIndex];
  currentDetail = { dossierIndex: dIndex, echeanceIndex: eIndex };
  document.getElementById('detail-date').textContent = e.date;
  document.getElementById('detail-client').textContent = d.client;
  document.getElementById('detail-montant-due').textContent = e.montant.toFixed(2) + ' CFA';
  document.getElementById('detail-montant-paye').textContent = (e.montantPaye||0).toFixed(2) + ' CFA';
  document.getElementById('detail-statut').textContent = e.statut;
  document.getElementById('pay-amount').value = e.montantPaye || '';
  document.getElementById('pay-date').value = e.datePaiement || '';
  showScreen('detail-echeance-screen');
}

// enregistrer paiement à partir du detail
function enregistrerPaiement(){
  const amt = parseFloat(document.getElementById('pay-amount').value);
  const datePai = document.getElementById('pay-date').value;
  if(isNaN(amt) || !datePai){
    alert('Veuillez renseigner montant payé et date de paiement.');
    return;
  }
  loadDossiersFromStorage();
  const d = dossiers[currentDetail.dossierIndex];
  const e = d.echeances[currentDetail.echeanceIndex];
  e.montantPaye = Number(amt.toFixed(2));
  e.datePaiement = datePai;
  // mise à jour statut simple:
  if(e.montantPaye >= e.montant) e.statut = 'réglée';
  else if(new Date(e.date) > new Date(datePai)) e.statut = 'en avance';
  else e.statut = 'en retard';
  saveDossiersToStorage();
  alert('Paiement enregistré.');
  showScreen('home-screen');
}

// rafraîchir dashboard (BIENVENUE)
function refreshDashboard(){
  loadDossiersFromStorage();
  // compte états
  let retard=0, attente=0, reglees=0, avance=0;
  const upcomingContainer = document.getElementById('upcoming-payments-list');
  upcomingContainer.innerHTML='';
  const today = new Date();
  const next7 = new Date(); next7.setDate(today.getDate()+7);

  dossiers.forEach(d => {
    d.echeances.forEach(e => {
      // update statut automatique si pas payé
      if(!e.montantPaye || e.montantPaye == 0){
        const due = new Date(e.date);
        if(due < today) e.statut = 'en retard';
        else e.statut = 'en attente';
      } else {
        if(e.montantPaye >= e.montant) e.statut = 'réglée';
        else e.statut = 'partiellement payée';
      }
      // compte
      if(e.statut === 'en retard') retard++;
      else if(e.statut === 'en attente') attente++;
      else if(e.statut === 'réglée') reglees++;
      else if(e.statut === 'en avance') avance++;
      // upcoming 7 jours
      const due = new Date(e.date);
      if(due >= today && due <= next7){
        const el = document.createElement('div');
        el.textContent = `${d.client} - ${e.date} - ${e.montant.toFixed(2)} CFA (${e.statut})`;
        upcomingContainer.appendChild(el);
      }
    });
  });

  document.getElementById('stat-retard').textContent = retard;
  document.getElementById('stat-attente').textContent = attente;
  document.getElementById('stat-reglees').textContent = reglees;
  document.getElementById('stat-avance').textContent = avance;

  // update etat global
  updateEtatAffichage();
  
}
