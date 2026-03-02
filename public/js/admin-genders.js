document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  async function fetchGenders() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/genders`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load genders');
    return data.data || data;
  }

  async function loadGenders() {
    const loader = document.getElementById('gendersTableLoader');
    const container = document.getElementById('gendersContainer');
    const tbody = document.querySelector('#gendersTable tbody');
    if (!tbody) return;

    try {
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';

      const genders = await fetchGenders();

      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';

      tbody.innerHTML = '';
      genders.forEach((g, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${g.name}</td>
          <td><code style="background:#f8f9fa; padding:2px 6px; border-radius:3px; font-size:12px;">${g.slug}</code></td>
          <td><span class="badge ${g.status === 'active' ? 'badge-success' : 'badge-muted'}">${(g.status || 'active').toUpperCase()}</span></td>
          <td>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${g.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load genders');
    }
  }

  async function createGender(name, status) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/genders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ name, status })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to create gender');
    }
    return data.data || data;
  }

  async function deleteGender(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/genders/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete gender');
    }
    return true;
  }

  // Gender modal helpers
  function openGenderModal() {
    const modal = document.getElementById('genderModal');
    if (!modal) return;
    document.getElementById('genderName').value = '';
    document.getElementById('genderStatus').value = 'active';
    const errEl = document.getElementById('genderFormError');
    if (errEl) errEl.textContent = '';
    modal.classList.add('active');
  }

  function closeGenderModal() {
    const modal = document.getElementById('genderModal');
    if (modal) modal.classList.remove('active');
  }

  // Form submit for adding gender
  const form = document.getElementById('genderForm');
  const nameInput = document.getElementById('genderName');
  const statusSelect = document.getElementById('genderStatus');
  const formError = document.getElementById('genderFormError');
  if (form && nameInput && statusSelect) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.textContent = '';
      const name = nameInput.value.trim();
      const status = statusSelect.value || 'active';
      if (!name) {
        formError.textContent = 'Name is required';
        return;
      }
      try {
        await createGender(name, status);
        closeGenderModal();
        if (window.showToast) window.showToast('success', 'Gender added successfully');
        await loadGenders();
      } catch (err) {
        formError.textContent = err.message || 'Failed to create gender';
      }
    });
  }

  // Delete handler
  let pendingDeleteId = null;

  const tbody = document.querySelector('#gendersTable tbody');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action=\"delete\"]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      pendingDeleteId = id;
      const modal = document.getElementById('deleteGenderModal');
      if (modal) modal.classList.add('active');
    });
  }

  const newGenderBtn = document.getElementById('newGenderBtn');
  if (newGenderBtn) newGenderBtn.addEventListener('click', openGenderModal);
  const closeGenderBtn = document.getElementById('closeGenderModal');
  if (closeGenderBtn) closeGenderBtn.addEventListener('click', closeGenderModal);
  const cancelGenderBtn = document.getElementById('cancelGenderBtn');
  if (cancelGenderBtn) cancelGenderBtn.addEventListener('click', closeGenderModal);

  const deleteGenderModal = document.getElementById('deleteGenderModal');
  const deleteGenderCancel = document.getElementById('deleteGenderCancel');
  const deleteGenderConfirm = document.getElementById('deleteGenderConfirm');
  if (deleteGenderModal) {
    deleteGenderModal.addEventListener('click', (e) => {
      if (e.target === deleteGenderModal) {
        deleteGenderModal.classList.remove('active');
        pendingDeleteId = null;
      }
    });
  }
  if (deleteGenderCancel) {
    deleteGenderCancel.addEventListener('click', () => {
      const modal = document.getElementById('deleteGenderModal');
      if (modal) modal.classList.remove('active');
      pendingDeleteId = null;
    });
  }
  if (deleteGenderConfirm) {
    deleteGenderConfirm.addEventListener('click', async () => {
      if (!pendingDeleteId) return;
      try {
        await deleteGender(pendingDeleteId);
        const modal = document.getElementById('deleteGenderModal');
        if (modal) modal.classList.remove('active');
        if (window.showToast) window.showToast('success', 'Gender deleted successfully');
        pendingDeleteId = null;
        await loadGenders();
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Failed to delete gender');
      }
    });
  }

  requireAuth();
  loadGenders();
});

