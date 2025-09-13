// search.js : recherche multi-critères (conforme PPT)
function resetSearch(){
  document.getElementById('search-code').value = '';
  document.getElementById('search-client').value = '';
  document.getElementById('search-montant-paye-min').value = '';
  document.getElementById('search-montant-paye-max').value = '';
  document.getElementById('search-montant-due-min').value = '';
  document.getElementById('search-montant-due-max').value = '';
  document.getElementById('search-date-min').value = '';
  document.getElementById('search-date-max').value = '';
  document.getElementById('search-results-list').innerHTML = '';
}

function searchDossiers(){
  loadDossiersFromStorage();
  const code = (document.getElementById('search-code').value || '').trim().toLowerCase();
  const client = (document.getElementById('search-client').value || '').trim().toLowerCase();
  const payMin = parseFloat(document.getElementById('search-montant-paye-min').value) || null;
  const payMax = parseFloat(document.getElementById('search-montant-paye-max').value) || null;
  const dueMin = parseFloat(document.getElementById('search-montant-due-min').value) || null;
  const dueMax = parseFloat(document.getElementById('search-montant-due-max').value) || null;
  const dateMin = document.getElementById('search-date-min').value || null;
  const dateMax = document.getElementById('search-date-max').value || null;

  const resultsHolder = document.getElementById('search-results-list');
  resultsHolder.innerHTML = '';

  // parcourir tous les dossiers + leurs échéances et filtrer
  dossiers.forEach((d, di) => {
    if(code && !d.code.toLowerCase().includes(code)) return;
    if(client && !d.client.toLowerCase().includes(client)) return;

    // si critères sur montants / dates : vérifier au niveau échéances
    let matched = false;
    d.echeances.forEach((e, ei) => {
      // montant payé entre
      if(payMin !== null && (e.montantPaye || 0) < payMin) return;
      if(payMax !== null && (e.montantPaye || 0) > payMax) return;
      // montant dû entre
      if(dueMin !== null && e.montant < dueMin) return;
      if(dueMax !== null && e.montant > dueMax) return;
      // date
      if(dateMin && e.date < dateMin) return;
      if(dateMax && e.date > dateMax) return;

      // si arrive ici, cette échéance satisfait les filtres -> dossier match
      matched = true;
    });

    // si pas de filtre sur échéances et dossier passé les filtres code/client -> matched true
    if(!payMin && !payMax && !dueMin && !dueMax && !dateMin && !dateMax){
      matched = true;
    }

    if(matched){
      const node = document.createElement('div');
      node.className = 'result-item';
      node.innerHTML = `<div><strong>${d.code}</strong> — ${d.client} — ${d.montantGlobal.toFixed(2)} CFA</div>
        <div class="meta">Périodicité: ${d.periodicite} · Nb échéances: ${d.nbEcheances}</div>
        <div style="margin-top:8px">
          <button onclick="showDossier(${di})">Voir échéances</button>
        </div>`;
      resultsHolder.appendChild(node);
    }
  });

  if(resultsHolder.children.length === 0){
    resultsHolder.innerHTML = '<p>Aucun résultat.</p>';
  }
}
