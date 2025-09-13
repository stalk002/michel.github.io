// etat.js : affichage des comptes d'état (retard, attente, reglees, avance)
function updateEtatAffichage(){
  loadDossiersFromStorage();
  let retard=0, attente=0, reglees=0, avance=0;
  const listDiv = document.getElementById('etat-list');
  if(listDiv) listDiv.innerHTML = '';

  dossiers.forEach((d, di) => {
    d.echeances.forEach((e, ei) => {
      const due = new Date(e.date);
      const today = new Date();
      // si payée
      if(e.montantPaye && e.montantPaye >= e.montant){
        reglees++;
      } else {
        if(due < today) retard++;
        else if(due > today) attente++;
        else attente++;
      }
      // avance simple: payé avant la date
      if(e.datePaiement && new Date(e.datePaiement) < new Date(e.date)) avance++;
    });
  });
  if(document.getElementById('etat-retard')) document.getElementById('etat-retard').textContent = retard;
  if(document.getElementById('etat-attente')) document.getElementById('etat-attente').textContent = attente;
  if(document.getElementById('etat-reglees')) document.getElementById('etat-reglees').textContent = reglees;
  if(document.getElementById('etat-avance')) document.getElementById('etat-avance').textContent = avance;
}
