import {
  getUserProfile,
  logoutUser,
  observeAuthState,
  subscribeAllRequests,
  updateRequestStatus,
} from './firebase.js';

const welcomeNode = document.getElementById('admin-welcome');
const messageNode = document.getElementById('admin-message');
const listNode = document.getElementById('admin-requests-list');
const logoutBtn = document.getElementById('admin-logout-btn');

const setMessage = (text, type = 'info') => {
  messageNode.textContent = text;
  messageNode.className = `pro-message ${type}`;
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return '—';
  return timestamp.toDate().toLocaleString('fr-FR');
};

const renderAdminRequests = (snapshot) => {
  if (snapshot.empty) {
    listNode.innerHTML = '<p class="muted">Aucune demande enregistrée.</p>';
    setMessage('Aucune demande à afficher.', 'info');
    return;
  }

  const cards = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const currentStatus = data.status || 'envoyée';

      return `
        <article class="request-card admin-request-card" data-id="${doc.id}">
          <header>
            <strong>${escapeHtml(data.companyName || 'Entreprise')}</strong>
            <span class="status">${escapeHtml(currentStatus)}</span>
          </header>
          <p><strong>Contact :</strong> ${escapeHtml(data.contactName || '')}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(data.phone || '')}</p>
          <p><strong>Email :</strong> ${escapeHtml(data.email || '')}</p>
          <p><strong>Véhicule :</strong> ${escapeHtml(data.vehicleType || '')}</p>
          <p><strong>Immatriculation :</strong> ${escapeHtml(data.plateNumber || '')}</p>
          <p><strong>Localisation :</strong> ${escapeHtml(data.location || '')}</p>
          <p><strong>Besoin :</strong> ${escapeHtml(data.serviceType || '')}</p>
          <p><strong>Urgence :</strong> ${escapeHtml(data.urgency || '')}</p>
          <p><strong>Créneau :</strong> ${escapeHtml(data.preferredSlot || '')}</p>
          <p><strong>Commentaire :</strong> ${escapeHtml(data.notes || '-')}</p>
          <p><strong>Date :</strong> ${escapeHtml(formatDate(data.createdAt))}</p>
          <label class="admin-status-row">
            Statut
            <select class="status-select" data-request-id="${doc.id}">
              <option value="envoyée" ${currentStatus === 'envoyée' ? 'selected' : ''}>envoyée</option>
              <option value="confirmée" ${currentStatus === 'confirmée' ? 'selected' : ''}>confirmée</option>
              <option value="terminée" ${currentStatus === 'terminée' ? 'selected' : ''}>terminée</option>
            </select>
          </label>
        </article>
      `;
    })
    .join('');

  listNode.innerHTML = cards;
  setMessage(`Demandes chargées : ${snapshot.size}`, 'success');
};

let unsubscribe = null;

observeAuthState(async (user) => {
  if (!user) {
    window.location.href = 'acces-pro.html';
    return;
  }

  const profile = await getUserProfile(user.uid);
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  welcomeNode.textContent = `Admin: ${user.email}`;

  if (!unsubscribe) {
    unsubscribe = subscribeAllRequests(renderAdminRequests);
  }
});

listNode?.addEventListener('change', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || !target.classList.contains('status-select')) {
    return;
  }

  const requestId = target.dataset.requestId;
  const nextStatus = target.value;
  if (!requestId || !nextStatus) return;

  try {
    await updateRequestStatus(requestId, nextStatus);
    setMessage('Statut mis à jour.', 'success');
  } catch (error) {
    setMessage('Impossible de mettre à jour le statut.', 'error');
  }
});

logoutBtn?.addEventListener('click', async () => {
  await logoutUser();
  window.location.href = 'acces-pro.html';
});
