import { auth, createRequest, logoutUser, observeAuthState, subscribeUserRequests } from './firebase.js';

const welcomeTitle = document.getElementById('welcome-title');
const logoutBtn = document.getElementById('logout-btn');
const requestForm = document.getElementById('request-form');
const requestMessage = document.getElementById('request-message');
const requestsList = document.getElementById('requests-list');

const setRequestMessage = (text, type = 'info') => {
  requestMessage.textContent = text;
  requestMessage.className = `pro-message ${type}`;
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const renderRequests = (snapshot) => {
  if (snapshot.empty) {
    requestsList.innerHTML = '<p class="muted">Aucune demande pour le moment.</p>';
    return;
  }

  const cards = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return `
        <article class="request-card">
          <header>
            <strong>${escapeHtml(data.companyName || 'Entreprise')}</strong>
            <span class="status">${escapeHtml(data.status || 'envoyée')}</span>
          </header>
          <p><strong>Contact :</strong> ${escapeHtml(data.contactName || '')}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(data.phone || '')}</p>
          <p><strong>Véhicule :</strong> ${escapeHtml(data.vehicleType || '')} (${escapeHtml(data.plateNumber || '')})</p>
          <p><strong>Lieu :</strong> ${escapeHtml(data.location || '')}</p>
          <p><strong>Besoin :</strong> ${escapeHtml(data.serviceType || '')}</p>
          <p><strong>Urgence :</strong> ${escapeHtml(data.urgency || '')}</p>
          <p><strong>Créneau :</strong> ${escapeHtml(data.preferredSlot || '')}</p>
          <p><strong>Note :</strong> ${escapeHtml(data.notes || '-')}</p>
        </article>
      `;
    })
    .join('');

  requestsList.innerHTML = cards;
};

let unsubscribe = null;

observeAuthState((user) => {
  if (!user) {
    window.location.href = 'acces-pro.html';
    return;
  }

  welcomeTitle.textContent = `Bienvenue ${user.email}`;

  if (!unsubscribe) {
    unsubscribe = subscribeUserRequests(user.uid, renderRequests);
  }
});

logoutBtn?.addEventListener('click', async () => {
  await logoutUser();
  window.location.href = 'acces-pro.html';
});

requestForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const currentUser = auth.currentUser;
  if (!currentUser) {
    window.location.href = 'acces-pro.html';
    return;
  }

  const formData = new FormData(requestForm);
  const payload = {
    userId: currentUser.uid,
    email: String(formData.get('email') || currentUser.email || '').trim(),
    companyName: String(formData.get('companyName') || '').trim(),
    contactName: String(formData.get('contactName') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    vehicleType: String(formData.get('vehicleType') || '').trim(),
    plateNumber: String(formData.get('plateNumber') || '').trim(),
    location: String(formData.get('location') || '').trim(),
    serviceType: String(formData.get('serviceType') || '').trim(),
    urgency: String(formData.get('urgency') || '').trim(),
    preferredSlot: String(formData.get('preferredSlot') || '').trim(),
    notes: String(formData.get('notes') || '').trim(),
  };

  const requiredFields = [
    payload.companyName,
    payload.contactName,
    payload.phone,
    payload.email,
    payload.vehicleType,
    payload.plateNumber,
    payload.location,
    payload.serviceType,
    payload.urgency,
    payload.preferredSlot,
  ];

  if (requiredFields.some((item) => !item)) {
    setRequestMessage('Merci de remplir tous les champs obligatoires.', 'error');
    return;
  }

  try {
    await createRequest(payload);
    requestForm.reset();
    setRequestMessage('Demande envoyée avec succès.', 'success');
  } catch (error) {
    setRequestMessage('Impossible d’envoyer la demande pour le moment.', 'error');
  }
});
