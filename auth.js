// auth.js : très simple (frontend). Respecte l'écran CONNEXION du PowerPoint
function login(){
  const user = document.getElementById('login-username').value.trim();
  const pass = document.getElementById('login-password').value.trim();

  if(!user || !pass){
    alert('Veuillez entrer identifiant et mot de passe.');
    return;
  }
  // Ici : validation simplifiée (demo). On ouvre l'écran CHOIX PROCESS
  showScreen('choix-process-screen');
}
