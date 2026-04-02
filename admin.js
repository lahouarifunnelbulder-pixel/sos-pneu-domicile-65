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

const kpiTotal = document.getElementById('kpi-total');
const kpiSent = document.getElementById('kpi-sent');
const kpiConfirmed = document.getElementById('kpi-confirmed');
const kpiDone = document.getElementById('kpi-done');

const filterStatus = document.getElementById('filter-status');
const filterUrgency = document.getElementById('filter-urgency');
const filterSearch = document.getElementById('filter-search');

let allRequests = [];
let unsubscribe = null;

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

const normalize = (value = '') => String(value).trim().toLowerCase();

const getStatusClass = (status) => {
  const value = normalize(status);
  if (value === 'confirmée') return 'is-confirmed';
  if (value === 'terminée') return 'is-done';
  return 'is-sent';
};

const getUrgencyClass = (urgency) => {
  const value = normalize(urgency);
  if (value === 'urgence immédiate' || value === 'élevée') return 'u-high';
  if (value === 'moyenne') return 'u-medium';
  return 'u-low';
};

const updateKpi = (items) => {
  const sent = items.filter((item) => normalize(item.status) === 'envoyée').length;
  const confirmed = items.filter((item) => normalize(item.status) === 'confirmée').length;
  const done = items.filter((item) => normalize(item.status) === 'terminée').length;

  kpiTotal.textContent = String(items.length);
  kpiSent.textContent = String(sent);
  kpiConfirmed.textContent = String(confirmed);
  kpiDone.textContent = String(done);
};

const getFilteredRequests = () => {
  const status = normalize(filterStatus?.value || '');
  const urgency = normalize(filterUrgency?.value || '');
  const search = normalize(filterSearch?.value || '');

  return allRequests.filter((item) => {
    if (normalize(item.status) === 'test') return false;
    if (status && normalize(item.status) !== status) return false;
    if (urgency && normalize(item.urgency) !== urgency) return false;

    if (search) {
      const haystack = [item.companyName, item.contactName, item.plateNumber]
        .map((value) => normalize(value))
        .join(' ');
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
};

const renderRequests = () => {
  const filtered = getFilteredRequests();
  updateKpi(filtered);

  if (!filtered.length) {
    listNode.innerHTML = '<div class="empty-state">Aucune demande professionnelle pour le moment.</div>';
    setMessage('Aucun résultat avec ces filtres.', 'info');
    return;
  }

  const cards = filtered
    .map((item) => {
      const status = item.status || 'envoyée';
      const urgency = item.urgency || 'faible';

      return `
        <article class="request-card admin-request-card" data-id="${item.id}">
          <header>
            <strong>${escapeHtml(item.companyName || 'Entreprise')}</strong>
            <span class="status ${getStatusClass(status)}">${escapeHtml(status)}</span>
          </header>
          <p><strong>Contact :</strong> ${escapeHtml(item.contactName || '')}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(item.phone || '')}</p>
          <p><strong>Email :</strong> ${escapeHtml(item.email || '')}</p>
          <p><strong>Véhicule :</strong> ${escapeHtml(item.vehicleType || '')}</p>
          <p><strong>Immatriculation :</strong> ${escapeHtml(item.plateNumber || '')}</p>
          <p><strong>Localisation :</strong> ${escapeHtml(item.location || '')}</p>
          <p><strong>Besoin :</strong> ${escapeHtml(item.serviceType || '')}</p>
          <p><strong>Urgence :</strong> <span class="urgency-badge ${getUrgencyClass(urgency)}">${escapeHtml(urgency)}</span></p>
          <p><strong>Créneau :</strong> ${escapeHtml(item.preferredSlot || '')}</p>
          <p><strong>Commentaire :</strong> ${escapeHtml(item.notes || '-')}</p>
          <p><strong>Date :</strong> ${escapeHtml(formatDate(item.createdAt))}</p>
          <label class="admin-status-row">
            Changer le statut
            <select class="status-select" data-request-id="${item.id}">
              <option value="envoyée" ${normalize(status) === 'envoyée' ? 'selected' : ''}>envoyée</option>
              <option value="confirmée" ${normalize(status) === 'confirmée' ? 'selected' : ''}>confirmée</option>
              <option value="terminée" ${normalize(status) === 'terminée' ? 'selected' : ''}>terminée</option>
            </select>
          </label>
        </article>
      `;
    })
    .join('');

  listNode.innerHTML = cards;
  setMessage(`Demandes affichées : ${filtered.length}`, 'success');
};

const bindFilterEvents = () => {
  [filterStatus, filterUrgency, filterSearch].forEach((node) => {
    node?.addEventListener('input', renderRequests);
    node?.addEventListener('change', renderRequests);
  });
};

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

  welcomeNode.textContent = `Tableau de bord administrateur — ${user.email}`;

  if (!unsubscribe) {
    unsubscribe = subscribeAllRequests((snapshot) => {
      allRequests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderRequests();
    });
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
    const request = allRequests.find((item) => item.id === requestId);
    if (request) request.status = nextStatus;
    renderRequests();
    setMessage('Statut mis à jour.', 'success');
  } catch (error) {
    setMessage('Impossible de mettre à jour le statut.', 'error');
  }
});

logoutBtn?.addEventListener('click', async () => {
  await logoutUser();
  window.location.href = 'acces-pro.html';
});

bindFilterEvents();
