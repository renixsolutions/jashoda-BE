document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  async function fetchSizes() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/ring-sizes`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load ring sizes');
    return data.data || data;
  }

  async function loadSizes() {
    const loader = document.getElementById('sizesTableLoader');
    const container = document.getElementById('sizesContainer');
    const tbody = document.querySelector('#sizesTable tbody');
    if (!tbody) return;

    try {
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';

      const sizes = await fetchSizes();

      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';

      tbody.innerHTML = '';
      (sizes || []).forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${s.size}</td>
          <td>${s.diameter || '-'}</td>
          <td><span class="badge ${s.is_active ? 'badge-success' : 'badge-muted'}">${s.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${s.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${s.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load ring sizes');
    }
  }

  async function saveSize(id, payload) {
    const token = requireAuth();
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/admin/ring-sizes/${id}` : `${API_BASE}/admin/ring-sizes`;
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to save ring size');
    }
    return data.data || data;
  }

  async function deleteSize(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/ring-sizes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete ring size');
    }
    return true;
  }

  // Modal helpers
  function openSizeModal(size = null) {
    const modal = document.getElementById('sizeModal');
    if (!modal) return;
    
    document.getElementById('sizeModalTitle').textContent = size ? 'Edit Ring Size' : 'New Ring Size';
    document.getElementById('sizeId').value = size ? size.id : '';
    document.getElementById('sizeName').value = size ? size.size : '';
    document.getElementById('sizeDiameter').value = size ? (size.diameter || '') : '';
    document.getElementById('sizeStatus').value = size ? (size.is_active ? 'active' : 'inactive') : 'active';
    
    const errEl = document.getElementById('sizeFormError');
    if (errEl) errEl.textContent = '';
    modal.classList.add('active');
  }

  function closeSizeModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) modal.classList.remove('active');
  }

  // Form submit
  const form = document.getElementById('sizeForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('sizeFormError');
      errEl.textContent = '';
      
      const id = document.getElementById('sizeId').value;
      const size = document.getElementById('sizeName').value.trim();
      const diameter = document.getElementById('sizeDiameter').value.trim();
      const isActive = document.getElementById('sizeStatus').value === 'active';
      
      if (!size) {
        errEl.textContent = 'Size name is required';
        return;
      }
      
      try {
        await saveSize(id, { size, diameter, is_active: isActive });
        closeSizeModal();
        if (window.showToast) window.showToast('success', `Ring size ${id ? 'updated' : 'added'} successfully`);
        await loadSizes();
      } catch (err) {
        errEl.textContent = err.message || 'Failed to save ring size';
      }
    });
  }

  // Table actions (Edit/Delete)
  const tbody = document.querySelector('#sizesTable tbody');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      
      if (action === 'edit') {
        // Fetch specific size if needed, or just find in list
        // For simplicity, we'll fetch all and find
        const sizes = await fetchSizes();
        const size = sizes.find(s => s.id == id);
        if (size) openSizeModal(size);
      } else if (action === 'delete') {
        pendingDeleteId = id;
        const modal = document.getElementById('deleteSizeModal');
        if (modal) modal.classList.add('active');
      }
    });
  }

  let pendingDeleteId = null;

  const newSizeBtn = document.getElementById('newSizeBtn');
  if (newSizeBtn) newSizeBtn.addEventListener('click', () => openSizeModal());
  
  const closeSizeBtn = document.getElementById('closeSizeModal');
  if (closeSizeBtn) closeSizeBtn.addEventListener('click', closeSizeModal);
  
  const cancelSizeBtn = document.getElementById('cancelSizeBtn');
  if (cancelSizeBtn) cancelSizeBtn.addEventListener('click', closeSizeModal);

  const deleteSizeCancel = document.getElementById('deleteSizeCancel');
  if (deleteSizeCancel) {
    deleteSizeCancel.addEventListener('click', () => {
      document.getElementById('deleteSizeModal').classList.remove('active');
      pendingDeleteId = null;
    });
  }

  const deleteSizeConfirm = document.getElementById('deleteSizeConfirm');
  if (deleteSizeConfirm) {
    deleteSizeConfirm.addEventListener('click', async () => {
      if (!pendingDeleteId) return;
      try {
        await deleteSize(pendingDeleteId);
        document.getElementById('deleteSizeModal').classList.remove('active');
        if (window.showToast) window.showToast('success', 'Ring size deleted successfully');
        pendingDeleteId = null;
        await loadSizes();
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Failed to delete ring size');
      }
    });
  }

  requireAuth();
  loadSizes();
});
