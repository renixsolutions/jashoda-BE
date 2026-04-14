document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();
  const UPLOAD_BASE = `${API_BASE}/admin/uploads`;

  function requireAuth() {
    return admin.requireAuth();
  }

  let collectionImageUrl = null;

  async function fetchCollections() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/collections?sortBy=sort_order&sortOrder=asc`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load collections');
    const list = data.data || data.collections || data;
    return Array.isArray(list) ? list : [];
  }

  function getFullImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = window.location.origin;
    return url.startsWith('/') ? base + url : base + '/' + url;
  }

  async function loadCollections() {
    const loader = document.getElementById('collectionsTableLoader');
    const container = document.getElementById('collectionsContainer');
    const tbody = document.querySelector('#collectionsTable tbody');
    if (!tbody) return;

    try {
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';

      const collections = await fetchCollections();

      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';

      tbody.innerHTML = '';
      collections.forEach((c) => {
        const tr = document.createElement('tr');
        const imgSrc = c.image_url ? getFullImageUrl(c.image_url) : null;
        const imageCell = imgSrc
          ? `<img src="${imgSrc}" alt="" style="width:48px; height:48px; object-fit:cover; border-radius:4px;" />`
          : '<span style="font-size:12px; color:#95a5a6;">No image</span>';
        tr.innerHTML = `
          <td>${imageCell}</td>
          <td>${c.name}</td>
          <td><code style="background:#f8f9fa; padding:2px 6px; border-radius:3px; font-size:12px;">${c.slug || ''}</code></td>
          <td>${c.sort_order || 0}</td>
          <td><span class="badge ${c.is_active ? 'badge-success' : 'badge-muted'}">${(c.is_active ? 'active' : 'inactive').toUpperCase()}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load collections');
    }
  }

  async function createCollection(payload) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to create collection');
    }
    return data.data || data;
  }

  async function updateCollection(id, payload) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data.errors && data.errors[0]?.message) || data.message || 'Failed to update collection');
    }
    return data.data || data;
  }

  async function deleteCollection(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/collections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete collection');
    return true;
  }

  function updateCollectionImagePreview() {
    const container = document.getElementById('collectionImagePreview');
    if (!container) return;
    container.innerHTML = '';
    if (collectionImageUrl) {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.innerHTML = `<img src="${getFullImageUrl(collectionImageUrl)}" alt="Collection" /><span>Image</span><button type="button" class="thumb-remove" style="position:absolute; top:2px; left:2px; background:rgba(198,40,40,0.9); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">×</button>`;
      div.querySelector('.thumb-remove').addEventListener('click', () => {
        collectionImageUrl = null;
        updateCollectionImagePreview();
      });
      container.appendChild(div);
    }
  }

  function openCollectionModal(collection = null) {
    const modal = document.getElementById('collectionModal');
    if (!modal) return;
    const isEdit = !!collection;
    document.getElementById('collectionModalTitle').textContent = isEdit ? 'Edit Collection' : 'New Collection';
    document.getElementById('collectionId').value = collection ? collection.id : '';
    document.getElementById('collectionName').value = collection ? collection.name : '';
    document.getElementById('collectionSlug').value = collection ? (collection.slug || '') : '';
    document.getElementById('collectionDescription').value = collection ? (collection.description || '') : '';
    document.getElementById('collectionSortOrder').value = collection ? (collection.sort_order || 0) : 0;
    document.getElementById('collectionStatus').value = collection ? (collection.is_active ? 'active' : 'inactive') : 'active';
    collectionImageUrl = collection && collection.image_url ? collection.image_url : null;
    updateCollectionImagePreview();
    document.getElementById('collectionImageFile').value = '';
    document.getElementById('collectionFormError').textContent = '';
    modal.classList.add('active');
  }

  function closeCollectionModal() {
    const modal = document.getElementById('collectionModal');
    if (modal) modal.classList.remove('active');
    collectionImageUrl = null;
  }

  const form = document.getElementById('collectionForm');
  const formError = document.getElementById('collectionFormError');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.textContent = '';
      const id = document.getElementById('collectionId').value.trim();
      const name = document.getElementById('collectionName').value.trim();
      const slug = document.getElementById('collectionSlug').value.trim();
      const description = document.getElementById('collectionDescription').value.trim();
      const sort_order = parseInt(document.getElementById('collectionSortOrder').value) || 0;
      const statusValue = document.getElementById('collectionStatus').value || 'active';
      const is_active = statusValue === 'active';

      if (!name) {
        formError.textContent = 'Name is required';
        return;
      }
      const payload = { name, description, sort_order, is_active };
      if (slug) payload.slug = slug;
      if (collectionImageUrl) payload.image_url = collectionImageUrl;
      try {
        if (id) {
          await updateCollection(id, payload);
          if (window.showToast) window.showToast('success', 'Collection updated successfully');
        } else {
          await createCollection(payload);
          if (window.showToast) window.showToast('success', 'Collection added successfully');
        }
        closeCollectionModal();
        await loadCollections();
      } catch (err) {
        formError.textContent = err.message || 'Failed to save collection';
      }
    });
  }

  const collectionImageFile = document.getElementById('collectionImageFile');
  if (collectionImageFile) {
    collectionImageFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const token = requireAuth();
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`${UPLOAD_BASE}/collection-image`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        const url = data.data && data.data.url ? data.data.url : data.url;
        if (url) {
          collectionImageUrl = url;
          updateCollectionImagePreview();
          if (window.showToast) window.showToast('success', 'Image added');
        }
        collectionImageFile.value = '';
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Upload failed');
      }
    });
  }

  let pendingDeleteId = null;
  const tbody = document.querySelector('#collectionsTable tbody');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit' && id) {
        const collections = await fetchCollections();
        const collection = collections.find((c) => String(c.id) === String(id));
        if (collection) openCollectionModal(collection);
      } else if (action === 'delete' && id) {
        pendingDeleteId = id;
        const modal = document.getElementById('deleteCollectionModal');
        if (modal) modal.classList.add('active');
      }
    });
  }

  document.getElementById('newCollectionBtn')?.addEventListener('click', () => openCollectionModal(null));
  document.getElementById('closeCollectionModal')?.addEventListener('click', closeCollectionModal);
  document.getElementById('cancelCollectionBtn')?.addEventListener('click', closeCollectionModal);

  const deleteModal = document.getElementById('deleteCollectionModal');
  const deleteCancel = document.getElementById('deleteCollectionCancel');
  const deleteConfirm = document.getElementById('deleteCollectionConfirm');
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
      await deleteCollection(pendingDeleteId);
      if (deleteModal) deleteModal.classList.remove('active');
      if (window.showToast) window.showToast('success', 'Collection deleted successfully');
      pendingDeleteId = null;
      await loadCollections();
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to delete');
    }
  });

  requireAuth();
  loadCollections();
});
