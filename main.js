// main.js -> navigation et initialisation
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('active');

  // actions liées à certains écrans
  if(id === 'new-dossier-3-screen') previewEcheancierPreview();
  if(id === 'home-screen') refreshDashboard();
  if(id === 'etat-dossier-screen') updateEtatAffichage();
}

// utile au chargement initial : charger données locales
document.addEventListener('DOMContentLoaded', () => {
  loadDossiersFromStorage();
  updateEtatAffichage();
});
