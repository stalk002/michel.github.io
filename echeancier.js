// echeancier.js : génération d'un échéancier à partir des paramètres (conforme PPT)

function parseDateIso(s){
  if(!s) return null;
  return new Date(s + 'T00:00:00');
}

/**
 * generateEcheancier :
 * - montantGlobal : number
 * - nbEcheances : integer
 * - dateDebut : Date object
 * - periodicite : string ('mensuelle'|'hebdomadaire'|'trimestrielle'|'annuelle')
 * - nbDifferes : integer (nombre de périodes à différer avant la 1ere échéance)
 *
 * renvoie tableau d'objets { numero, date (ISO), montant, statut, montantPaye:0, datePaiement:null }
 */
function generateEcheancier(montantGlobal, nbEcheances, dateDebut, periodicite, nbDifferes){
  const echeances = [];
  if(!dateDebut || nbEcheances <= 0) return echeances;

  // calcul montant par échéance (répartition simple, garder centimes)
  const base = Math.floor((montantGlobal / nbEcheances) * 100) / 100;
  let remainder = Math.round((montantGlobal - base * nbEcheances) * 100) / 100;

  // start date after differés
  let date = new Date(dateDebut);
  // apply differés
  for(let i=0;i<nbDifferes;i++){
    date = addPeriod(date, periodicite, 1);
  }

  for(let i=0;i<nbEcheances;i++){
    let m = base;
    // add leftover to first ones
    if(remainder > 0){
      const add = Math.min(0.01 * Math.round(remainder * 100), 0.01 * Math.round(remainder * 100));
      m = Math.round((m + add) * 100) / 100;
      remainder = Math.round((remainder - add) * 100) / 100;
    }
    echeances.push({
      numero: i + 1,
      date: date.toISOString().slice(0,10),
      montant: Number(m.toFixed(2)),
      statut: 'en attente',
      montantPaye: 0,
      datePaiement: null
    });

    // next date
    date = addPeriod(date, periodicite, 1);
  }
  return echeances;
}

function addPeriod(date, periodicite, n){
  const d = new Date(date);
  switch(periodicite){
    case 'hebdomadaire':
      d.setDate(d.getDate() + 7 * n);
      break;
    case 'trimestrielle':
      d.setMonth(d.getMonth() + 3 * n);
      break;
    case 'annuelle':
      d.setFullYear(d.getFullYear() + n);
      break;
    default:
      // mensuelle
      d.setMonth(d.getMonth() + n);
  }
  return d;
}

// utilitaire pour afficher preview dans 3/3
function previewEcheancierPreview(){
  const client = document.getElementById('nd-client').value || '';
  document.getElementById('preview-client-name').textContent = client;
  // collect data
  const montantGlobal = parseFloat(document.getElementById('nd-montant-global').value) || 0;
  const nbEcheances = parseInt(document.getElementById('nd-nb-echeances').value) || 0;
  const datePremiere = document.getElementById('nd-date-premiere').value;
  const periodicite = document.getElementById('nd-periodicite').value;
  const nbDifferes = parseInt(document.getElementById('nd-nb-differes').value) || 0;
  const montantEcheanceOpt = parseFloat(document.getElementById('nd-montant-echeance').value) || null;

  let echeances = [];
  if(montantEcheanceOpt && nbEcheances){
    // construire par montant échéance donné
    const dateStart = datePremiere ? new Date(datePremiere) : new Date();
    let date = new Date(dateStart);
    for(let i=0;i<nbEcheances;i++){
      echeances.push({
        numero: i+1,
        date: date.toISOString().slice(0,10),
        montant: Number(montantEcheanceOpt.toFixed(2)),
        statut:'en attente',
        montantPaye:0, datePaiement:null
      });
      date = addPeriod(date, periodicite, 1);
    }
  } else {
    echeances = generateEcheancier(montantGlobal, nbEcheances, datePremiere ? new Date(datePremiere) : new Date(), periodicite, nbDifferes);
  }

  const container = document.getElementById('preview-echeancier');
  container.innerHTML = '';
  if(echeances.length === 0){
    container.innerHTML = '<p>Aucune échéance générée (vérifier les champs).</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead><tr><th>N°</th><th>Date échéance</th><th>Montant</th><th>Statut</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  echeances.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.numero}</td><td>${e.date}</td><td>${formatMoney(e.montant)}</td><td>${e.statut}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function formatMoney(x){ return Number(x).toFixed(2) + ' CFA'; }
