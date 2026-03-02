document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();
  const UPLOAD_BASE = `${API_BASE}/admin/uploads`;

  function requireAuth() {
    return admin.requireAuth();
  }

  let occasionImageUrl = null;

  async function fetchOccasions() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/occasions?page=1&limit=200`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load occasions');
    const list = data.data || data.occasions || data;
    return Array.isArray(list) ? list : [];
  }

  function getFullImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = window.location.origin;
    return url.startsWith('/') ? base + url : base + '/' + url;
  }

  async function loadOccasions() {
    const loader = document.getElementById('occasionsTableLoader');
    const container = document.getElementById('occasionsContainer');
    const tbody = document.querySelector('#occasionsTable tbody');
    if (!tbody) return;

    try {
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';

      const occasions = await fetchOccasions();

      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';

      tbody.innerHTML = '';
      occasions.forEach((o) => {
        const tr = document.createElement('tr');
        const imgSrc = o.image_url ? getFullImageUrl(o.image_url) : null;
        const imageCell = imgSrc
          ? `<img src="${imgSrc}" alt="" style="width:48px; height:48px; object-fit:cover; border-radius:4px;" />`
          : '<span style="font-size:12px; color:#95a5a6;">No image</span>';
        tr.innerHTML = `
          <td>${imageCell}</td>
          <td>${o.name}</td>
          <td><code style="background:#f8f9fa; padding:2px 6px; border-radius:3px; font-size:12px;">${o.slug || ''}</code></td>
          <td><span class="badge ${o.status === 'active' ? 'badge-success' : 'badge-muted'}">${(o.status || 'active').toUpperCase()}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${o.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${o.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load occasions');
    }
  }

  async function createOccasion(payload) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/occasions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to create occasion');
    }
    return data.data || data;
  }

  async function updateOccasion(id, payload) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/occasions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to update occasion');
    }
    return data.data || data;
  }

  async function deleteOccasion(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/occasions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete occasion');
    return true;
  }

  function updateOccasionImagePreview() {
    const container = document.getElementById('occasionImagePreview');
    if (!container) return;
    container.innerHTML = '';
    if (occasionImageUrl) {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.innerHTML = `<img src="${getFullImageUrl(occasionImageUrl)}" alt="Occasion" /><span>Image</span><button type="button" class="thumb-remove" style="position:absolute; top:2px; left:2px; background:rgba(198,40,40,0.9); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">×</button>`;
      div.querySelector('.thumb-remove').addEventListener('click', () => {
        occasionImageUrl = null;
        updateOccasionImagePreview();
      });
      container.appendChild(div);
    }
  }

  function openOccasionModal(occasion = null) {
    const modal = document.getElementById('occasionModal');
    if (!modal) return;
    const isEdit = !!occasion;
    document.getElementById('occasionModalTitle').textContent = isEdit ? 'Edit Occasion' : 'New Occasion';
    document.getElementById('occasionId').value = occasion ? occasion.id : '';
    document.getElementById('occasionName').value = occasion ? occasion.name : '';
    document.getElementById('occasionSlug').value = occasion ? (occasion.slug || '') : '';
    document.getElementById('occasionStatus').value = occasion ? (occasion.status || 'active') : 'active';
    occasionImageUrl = occasion && occasion.image_url ? occasion.image_url : null;
    updateOccasionImagePreview();
    document.getElementById('occasionImageFile').value = '';
    document.getElementById('occasionFormError').textContent = '';
    modal.classList.add('active');
  }

  function closeOccasionModal() {
    const modal = document.getElementById('occasionModal');
    if (modal) modal.classList.remove('active');
    occasionImageUrl = null;
  }

  const form = document.getElementById('occasionForm');
  const formError = document.getElementById('occasionFormError');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.textContent = '';
      const id = document.getElementById('occasionId').value.trim();
      const name = document.getElementById('occasionName').value.trim();
      const slug = document.getElementById('occasionSlug').value.trim();
      const status = document.getElementById('occasionStatus').value || 'active';
      if (!name) {
        formError.textContent = 'Name is required';
        return;
      }
      const payload = { name, status };
      if (slug) payload.slug = slug;
      if (occasionImageUrl) payload.image_url = occasionImageUrl;
      try {
        if (id) {
          await updateOccasion(id, payload);
          if (window.showToast) window.showToast('success', 'Occasion updated successfully');
        } else {
          await createOccasion(payload);
          if (window.showToast) window.showToast('success', 'Occasion added successfully');
        }
        closeOccasionModal();
        await loadOccasions();
      } catch (err) {
        formError.textContent = err.message || 'Failed to save occasion';
      }
    });
  }

  const occasionImageFile = document.getElementById('occasionImageFile');
  if (occasionImageFile) {
    occasionImageFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const token = requireAuth();
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`${UPLOAD_BASE}/occasion-image`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        const url = data.data && data.data.url ? data.data.url : data.url;
        if (url) {
          occasionImageUrl = url;
          updateOccasionImagePreview();
          if (window.showToast) window.showToast('success', 'Image added');
        }
        occasionImageFile.value = '';
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Upload failed');
      }
    });
  }

  let pendingDeleteId = null;
  const tbody = document.querySelector('#occasionsTable tbody');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit' && id) {
        const occasions = await fetchOccasions();
        const occasion = occasions.find((o) => String(o.id) === String(id));
        if (occasion) openOccasionModal(occasion);
      } else if (action === 'delete' && id) {
        pendingDeleteId = id;
        const modal = document.getElementById('deleteOccasionModal');
        if (modal) modal.classList.add('active');
      }
    });
  }

  document.getElementById('newOccasionBtn')?.addEventListener('click', () => openOccasionModal(null));
  document.getElementById('closeOccasionModal')?.addEventListener('click', closeOccasionModal);
  document.getElementById('cancelOccasionBtn')?.addEventListener('click', closeOccasionModal);

  const deleteModal = document.getElementById('deleteOccasionModal');
  const deleteCancel = document.getElementById('deleteOccasionCancel');
  const deleteConfirm = document.getElementById('deleteOccasionConfirm');
  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      deleteModal.classList.remove('active');
      pendingDeleteId = null;
    }
  });
  deleteCancel?.addEventListener('click', () => {
    if (deleteModal) deleteModal.classList.remove('active');
    pendingDeleteId = null;
  });
  deleteConfirm?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteOccasion(pendingDeleteId);
      if (deleteModal) deleteModal.classList.remove('active');
      if (window.showToast) window.showToast('success', 'Occasion deleted successfully');
      pendingDeleteId = null;
      await loadOccasions();
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to delete');
    }
  });

  requireAuth();
  loadOccasions();
});
