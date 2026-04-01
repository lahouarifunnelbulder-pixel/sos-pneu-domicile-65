import { loginWithEmail, registerWithEmail, observeAuthState } from './firebase.js';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const messageNode = document.getElementById('auth-message');

const setMessage = (text, type = 'info') => {
  messageNode.textContent = text;
  messageNode.className = `pro-message ${type}`;
};

const mapAuthError = (code) => {
  const map = {
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  };

  return map[code] || 'Une erreur est survenue. Veuillez réessayer.';
};

observeAuthState((user) => {
  if (user) window.location.href = 'dashboard.html';
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    setMessage('Merci de remplir tous les champs de connexion.', 'error');
    return;
  }

  try {
    await loginWithEmail(email, password);
    setMessage('Connexion réussie. Redirection...', 'success');
    window.location.href = 'dashboard.html';
  } catch (error) {
    setMessage(mapAuthError(error?.code), 'error');
  }
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    setMessage('Merci de remplir tous les champs d’inscription.', 'error');
    return;
  }

  try {
    await registerWithEmail(email, password);
    setMessage('Compte créé avec succès. Redirection...', 'success');
    window.location.href = 'dashboard.html';
  } catch (error) {
    setMessage(mapAuthError(error?.code), 'error');
  }
});
