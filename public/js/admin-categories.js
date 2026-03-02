document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();
  const UPLOAD_BASE = `${API_BASE}/admin/uploads`;

  function requireAuth() {
    return admin.requireAuth();
  }

  let currentPage = 1;
  const pageLimit = 50;
  let paginationInfo = null;
  let expandedCategories = new Set();
  let allCategories = [];
  let allSubcategories = {};

  // Fetch all categories (both parent and subcategories)
  async function fetchAllCategories(page = 1) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', pageLimit);

    const res = await fetch(`${API_BASE}/admin/categories?${params.toString()}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load categories');
    return data;
  }

  // Fetch parent categories only
  async function fetchParentCategories() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/categories/parents`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load parent categories');
    return data.data || data;
  }

  // Fetch subcategories for a parent
  async function fetchSubcategories(parentId) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/categories/subcategories/${parentId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load subcategories');
    return data.data || data;
  }

  function toggleCategory(categoryId) {
    if (expandedCategories.has(categoryId)) {
      expandedCategories.delete(categoryId);
    } else {
      expandedCategories.add(categoryId);
      // Load subcategories if not already loaded
      if (!allSubcategories[categoryId]) {
        loadSubcategoriesForCategory(categoryId);
      }
    }
    renderCategories();
  }

  async function loadSubcategoriesForCategory(categoryId) {
    try {
      const subcategories = await fetchSubcategories(categoryId);
      allSubcategories[categoryId] = subcategories;
      renderCategories();
    } catch (err) {
      console.error('Failed to load subcategories:', err);
    }
  }

  function renderCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    const container = document.getElementById('categoriesContainer');
    const loader = document.getElementById('categoriesTableLoader');
    if (!tbody) return;
    
    if (loader) loader.classList.remove('active');
    if (container) container.style.display = 'block';
    
    tbody.innerHTML = '';
    
    // Separate parent categories and subcategories
    const parentCategories = allCategories.filter(c => !c.parent_id);
    
    parentCategories.forEach(category => {
      // Render parent category
      const tr = document.createElement('tr');
      tr.className = 'category-row';
      const hasSubcategories = allSubcategories[category.id] && allSubcategories[category.id].length > 0;
      const isExpanded = expandedCategories.has(category.id);
      
      const subCount = (allSubcategories[category.id] && allSubcategories[category.id].length) || 0;
      tr.innerHTML = `
        <td>
          ${hasSubcategories ? `<span class="expand-icon" data-category-id="${category.id}">${isExpanded ? '−' : '+'}</span>` : '<span style="width:24px; display:inline-block;"></span>'}
        </td>
        <td>
          <div class="category-name-cell">
            <span class="category-name-text">${category.name}</span>
            ${subCount ? `<span class="category-subcount">${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}</span>` : ''}
          </div>
        </td>
        <td><code style="background:#f8f9fa; padding:2px 6px; border-radius:3px; font-size:12px;">${category.slug}</code></td>
        <td><span class="category-badge">Category</span></td>
        <td><span class="badge ${category.status === 'active' ? 'badge-success' : 'badge-muted'}">${category.status.toUpperCase()}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${category.id}" data-type="category">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${category.id}">Delete</button>
        </td>
      `;
      
      // Add expand/collapse handler
      if (hasSubcategories) {
        tr.querySelector('.expand-icon').addEventListener('click', (e) => {
          e.stopPropagation();
          toggleCategory(category.id);
        });
      }
      
      tbody.appendChild(tr);
      
      // Render subcategories if expanded
      if (isExpanded && allSubcategories[category.id]) {
        allSubcategories[category.id].forEach(subcategory => {
          const subTr = document.createElement('tr');
          subTr.className = 'subcategory-row';
          subTr.innerHTML = `
            <td></td>
            <td class="subcategory-name-cell">
              <span class="subcategory-arrow">↳</span>
              <span>${subcategory.name}</span>
            </td>
            <td><code style="background:#f8f9fa; padding:2px 6px; border-radius:3px; font-size:12px;">${subcategory.slug}</code></td>
            <td><span class="subcategory-badge">Subcategory</span></td>
            <td><span class="badge ${subcategory.status === 'active' ? 'badge-success' : 'badge-muted'}">${subcategory.status.toUpperCase()}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${subcategory.id}" data-type="subcategory">Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${subcategory.id}">Delete</button>
            </td>
          `;
          tbody.appendChild(subTr);
        });
      }
    });
    
    paginationInfo = { page: currentPage, totalPages: 1, total: parentCategories.length };
    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('categoriesPagination');
    if (!container || !paginationInfo) {
      if (container) container.innerHTML = '';
      return;
    }
    
    const { page, totalPages, total } = paginationInfo;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;
    
    const maxPages = 7;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
      html += `<button data-page="1">1</button>`;
      if (startPage > 2) html += `<span class="page-info">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="${i === page ? 'page-current' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="page-info">...</span>`;
      html += `<button data-page="${totalPages}">${totalPages}</button>`;
    }
    
    html += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;
    html += `<span class="page-info">Page ${page} of ${totalPages} (${total} total)</span>`;
    
    container.innerHTML = html;
    
    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newPage = parseInt(btn.getAttribute('data-page'));
        if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
          currentPage = newPage;
          loadCategories();
        }
      });
    });
  }

  async function loadCategories() {
    try {
      const loader = document.getElementById('categoriesTableLoader');
      const container = document.getElementById('categoriesContainer');
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';
      
      const result = await fetchAllCategories(currentPage);
      allCategories = result.data || result.categories || result;
      
      // Load subcategories for all parent categories
      const parentCategories = allCategories.filter(c => !c.parent_id);
      for (const category of parentCategories) {
        if (!allSubcategories[category.id]) {
          await loadSubcategoriesForCategory(category.id);
        }
      }
      
      renderCategories();
    } catch (err) {
      const loader = document.getElementById('categoriesTableLoader');
      const container = document.getElementById('categoriesContainer');
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load categories');
    }
  }

  let categoryImageUrl = '';

  function updateCategoryImagePreview() {
    const container = document.getElementById('categoryImagePreview');
    if (!container) return;
    container.innerHTML = '';
    if (categoryImageUrl) {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.innerHTML = `<img src="${categoryImageUrl}" alt="Category" /><span>Main</span><button type="button" class="thumb-remove" style="position:absolute; top:3px; left:3px; background:rgba(220,53,69,0.9); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:11px; cursor:pointer; line-height:1; display:flex; align-items:center; justify-content:center;">×</button>`;
      container.appendChild(div);
      div.querySelector('.thumb-remove').addEventListener('click', () => {
        categoryImageUrl = '';
        updateCategoryImagePreview();
      });
    }
  }

  async function loadCategory(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load category');
    return data.data || data;
  }

  async function loadParentCategoriesForSelect() {
    try {
      const categories = await fetchParentCategories();
      const select = document.getElementById('parentCategorySelect');
      if (!select) return;
      
      select.innerHTML = '<option value="">Select Parent Category</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Failed to load parent categories:', err);
    }
  }

  function openCategoryModal(category, isSubcategory = false) {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    modal.classList.add('active');
    const isEdit = !!category;
    const title = isEdit 
      ? (isSubcategory ? 'Edit Subcategory' : 'Edit Category')
      : (isSubcategory ? 'New Subcategory' : 'New Category');
    document.getElementById('categoryModalTitle').textContent = title;

    const typeSelect = document.getElementById('categoryType');
    const parentGroup = document.getElementById('parentCategoryGroup');
    
    if (isEdit) {
      typeSelect.value = category.parent_id ? 'subcategory' : 'category';
      typeSelect.disabled = true; // Can't change type when editing
    } else {
      typeSelect.value = isSubcategory ? 'subcategory' : 'category';
      typeSelect.disabled = false;
    }
    
    // Show/hide parent category select
    if (typeSelect.value === 'subcategory') {
      parentGroup.style.display = 'block';
      loadParentCategoriesForSelect();
    } else {
      parentGroup.style.display = 'none';
    }
    
    // Type change handler
    typeSelect.onchange = function() {
      if (this.value === 'subcategory') {
        parentGroup.style.display = 'block';
        loadParentCategoriesForSelect();
      } else {
        parentGroup.style.display = 'none';
        document.getElementById('parentCategorySelect').value = '';
      }
    };

    document.getElementById('categoryId').value = category ? category.id : '';
    document.getElementById('categoryName').value = category ? category.name : '';
    document.getElementById('categorySlug').value = category ? (category.slug || '') : '';
    document.getElementById('categoryDescription').value = category ? (category.description || '') : '';
    document.getElementById('categoryStatus').value = category ? (category.status || 'active') : 'active';
    
    // Set parent_id: for new subcategory use selected, for edit use existing parent_id
    const parentIdValue = isSubcategory 
      ? (category?.parent_id || '')
      : (category?.parent_id || '');
    document.getElementById('categoryParentId').value = parentIdValue;
    
    if (parentIdValue && typeSelect.value === 'subcategory') {
      document.getElementById('parentCategorySelect').value = parentIdValue;
    }
    
    categoryImageUrl = category ? (category.image_url || '') : '';
    updateCategoryImagePreview();
    
    document.getElementById('categoryFormError').textContent = '';
  }

  function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
  }

  async function saveCategory(e) {
    e.preventDefault();
    const token = requireAuth();
    const errorEl = document.getElementById('categoryFormError');
    errorEl.textContent = '';

    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const status = document.getElementById('categoryStatus').value;
    const categoryType = document.getElementById('categoryType').value;
    let parentId = document.getElementById('categoryParentId').value;
    
    // If subcategory, get parent from select
    if (categoryType === 'subcategory') {
      parentId = document.getElementById('parentCategorySelect').value;
      if (!parentId) {
        errorEl.textContent = 'Please select a parent category for subcategory';
        return;
      }
    } else {
      parentId = '';
    }

    const payload = { name, description, status };
    if (slug) payload.slug = slug;
    if (categoryImageUrl) payload.image_url = categoryImageUrl;
    if (parentId) {
      const parentIdNum = parseInt(parentId);
      if (!isNaN(parentIdNum) && parentIdNum > 0) {
        payload.parent_id = parentIdNum;
      }
    }

    try {
      const url = id ? `${API_BASE}/admin/categories/${id}` : `${API_BASE}/admin/categories`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save category');
      closeCategoryModal();
      // Clear subcategories cache to reload
      allSubcategories = {};
      await loadCategories();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  let pendingDeleteId = null;

  function showDeleteModal(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteCategoryModal');
    if (modal) modal.classList.add('active');
  }

  function hideDeleteModal() {
    pendingDeleteId = null;
    const modal = document.getElementById('deleteCategoryModal');
    if (modal) modal.classList.remove('active');
  }

  async function deleteCategory(id) {
    const token = requireAuth();
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) {
        if (window.showToast) window.showToast('error', data.message || 'Failed to delete category');
      } else {
        hideDeleteModal();
        allSubcategories = {};
        if (window.showToast) window.showToast('success', 'Category deleted successfully');
        await loadCategories();
      }
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to delete category');
    }
  }

  // Cropper logic
  let categoryCropState = null;

  document.getElementById('categoryImageFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        categoryCropState = { img, scale: 1, x: 0, y: 0 };
        document.getElementById('categoryCropper').style.display = 'block';
        drawCategoryCrop();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('categoryCropZoom')?.addEventListener('input', function(e) {
    if (categoryCropState) {
      categoryCropState.scale = parseFloat(e.target.value);
      drawCategoryCrop();
    }
  });

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  document.getElementById('categoryCropCanvas')?.addEventListener('mousedown', function(e) {
    if (!categoryCropState) return;
    isDragging = true;
    const rect = this.getBoundingClientRect();
    dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging || !categoryCropState) return;
    const canvas = document.getElementById('categoryCropCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - dragStart.x;
    const dy = (e.clientY - rect.top) - dragStart.y;
    categoryCropState.x += dx / categoryCropState.scale;
    categoryCropState.y += dy / categoryCropState.scale;
    dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawCategoryCrop();
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  function drawCategoryCrop() {
    const canvas = document.getElementById('categoryCropCanvas');
    if (!canvas || !categoryCropState) return;
    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    const { img, scale, x, y } = categoryCropState;
    const imgSize = Math.min(img.width, img.height) * scale;
    const offsetX = (size - imgSize) / 2 + x * scale;
    const offsetY = (size - imgSize) / 2 + y * scale;
    ctx.drawImage(img, offsetX, offsetY, imgSize, imgSize);
  }

  document.getElementById('categoryCropCancel')?.addEventListener('click', function() {
    document.getElementById('categoryCropper').style.display = 'none';
    document.getElementById('categoryImageFile').value = '';
    categoryCropState = null;
  });

  document.getElementById('categoryCropUpload')?.addEventListener('click', async function() {
    if (!categoryCropState) return;
    const canvas = document.getElementById('categoryCropCanvas');
    if (!canvas) return;
    canvas.toBlob(async function(blob) {
      const formData = new FormData();
      formData.append('image', blob, 'category.jpg');
      const token = requireAuth();
      try {
        const res = await fetch(`${UPLOAD_BASE}/category-image`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        categoryImageUrl = data.data.url;
        updateCategoryImagePreview();
        document.getElementById('categoryCropper').style.display = 'none';
        document.getElementById('categoryImageFile').value = '';
        categoryCropState = null;
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Failed to upload image');
      }
    }, 'image/jpeg', 0.9);
  });

  // Init
  requireAuth();
  loadCategories();

  document.getElementById('newCategoryBtn')?.addEventListener('click', () => openCategoryModal(null, false));
  document.getElementById('newSubcategoryBtn')?.addEventListener('click', () => openCategoryModal(null, true));

  document.getElementById('cancelCategoryBtn')?.addEventListener('click', closeCategoryModal);
  document.getElementById('closeCategoryModal')?.addEventListener('click', closeCategoryModal);
  document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);

  document.getElementById('deleteCategoryCancel')?.addEventListener('click', hideDeleteModal);
  document.getElementById('deleteCategoryConfirm')?.addEventListener('click', () => {
    if (pendingDeleteId) deleteCategory(pendingDeleteId);
  });

  // Handle edit/delete buttons
  document.addEventListener('click', async function(e) {
    if (e.target.dataset.action === 'edit') {
      const id = e.target.dataset.id;
      const type = e.target.dataset.type;
      const category = await loadCategory(id);
      openCategoryModal(category, type === 'subcategory');
    } else if (e.target.dataset.action === 'delete') {
      const id = e.target.dataset.id;
      showDeleteModal(id);
    }
  });
});
