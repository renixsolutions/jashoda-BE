document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();
  const UPLOAD_BASE = `${API_BASE}/admin/uploads`;

  function requireAuth() {
    return admin.requireAuth();
  }

  let currentPage = 1;
  const pageLimit = 10;
  let paginationInfo = null;
  let categoryNameById = {};

  async function fetchProducts(search = '', page = 1) {
    const token = requireAuth();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', pageLimit);

    const res = await fetch(`${API_BASE}/admin/products?${params.toString()}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load products');
    return data;
  }

  function generateDefaultSKU() {
    const prefix = 'JSH';
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomNums = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomChars}-${randomNums}`;
  }

  function renderProducts(result) {
    const tbody = document.querySelector('#productsTable tbody');
    const table = document.getElementById('productsTable');
    const loader = document.getElementById('productsTableLoader');
    const cardList = document.getElementById('productsCardList');
    const emptyState = document.getElementById('productsEmptyState');
    if (!tbody) return;
    
    // Hide loader, show containers
    const container = document.getElementById('productsContainer');
    if (loader) loader.classList.remove('active');
    if (container) container.style.display = 'block';
    if (table) table.style.display = 'table';
    
    const products = result.data || result.products || result;
    tbody.innerHTML = '';
    if (cardList) cardList.innerHTML = '';

    if (!products || products.length === 0) {
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      paginationInfo = result.pagination || result.meta?.pagination || null;
      const pagination = document.getElementById('productsPagination');
      if (pagination) pagination.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    products.forEach(p => {
      const primaryImage = Array.isArray(p.images) && p.images.length
        ? (p.images[0].url || p.images[0])
        : (p.image_url || null);
      const imageCell = primaryImage
        ? `<img src="${primaryImage}" alt="Product image" class="product-thumb" data-full-url="${primaryImage}" />`
        : `<span style="font-size:12px; color:#95a5a6;">No image</span>`;
      const categoryLabel = getCategoryLabel(p);

      // Table row (desktop)
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${imageCell}</td>
        <td>${p.sku || '-'}</td>
        <td>${p.name}</td>
        <td>${categoryLabel || ''}</td>
        <td>₹${parseFloat(p.price).toLocaleString('en-IN')}</td>
        <td><span class="badge ${
          p.stock_status === 'in_stock'
            ? 'badge-stock-ok'
            : p.stock_status === 'low_stock'
            ? 'badge-stock-low'
            : 'badge-stock-out'
        }">${p.stock_quantity || 0}</span></td>
        <td><span class="badge ${
          p.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'
        }">${p.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);

      // Mobile card
      if (cardList) {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
          <div class="mobile-card-row">
            <div class="mobile-card-label">Product</div>
            <div class="mobile-card-value">${p.name}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">SKU</div>
            <div class="mobile-card-value">${p.sku || '-'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Category</div>
            <div class="mobile-card-value">${categoryLabel || '-'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Price</div>
            <div class="mobile-card-value">₹${parseFloat(p.price).toLocaleString('en-IN')}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Stock</div>
            <div class="mobile-card-value">${p.stock_quantity || 0} (${p.stock_status || 'in_stock'})</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Status</div>
            <div class="mobile-card-value">${p.status}</div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${p.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}">Delete</button>
          </div>
        `;
        cardList.appendChild(card);
      }
    });
    
    // Store pagination info
    paginationInfo = result.pagination || result.meta?.pagination || null;
    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('productsPagination');
    if (!container || !paginationInfo) return;
    
    const { page, totalPages, total } = paginationInfo;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    
    // Previous button
    html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;
    
    // Page numbers
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
    
    // Next button
    html += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;
    
    // Page info
    html += `<span class="page-info">Page ${page} of ${totalPages} (${total} total)</span>`;
    
    container.innerHTML = html;
    
    // Add click handlers
    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newPage = parseInt(btn.getAttribute('data-page'));
        if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
          currentPage = newPage;
          loadProducts();
        }
      });
    });
  }

  let productImages = [];

  function updateImagesPreview() {
    const container = document.getElementById('productImagesPreview');
    if (!container) return;
    container.innerHTML = '';
    productImages.forEach((url, index) => {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.innerHTML = `<img src="${url}" alt="Image ${index + 1}" /><span>${index === 0 ? 'Main' : index + 1}</span><button type="button" class="thumb-remove" data-index="${index}" style="position:absolute; top:2px; left:2px; background:rgba(198,40,40,0.9); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer; line-height:1;">×</button>`;
      container.appendChild(div);
    });
    // Add remove handlers
    container.querySelectorAll('.thumb-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.getAttribute('data-index'));
        productImages.splice(index, 1);
        updateImagesPreview();
      });
    });
  }

  async function loadProducts() {
    try {
      const table = document.getElementById('productsTable');
      const container = document.getElementById('productsContainer');
      const loader = document.getElementById('productsTableLoader');
      
      // Show loader, hide table
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';
      if (table) table.style.display = 'none';
      
      const searchInput = document.getElementById('search');
      const search = searchInput ? searchInput.value.trim() : '';
      // Reset to page 1 when searching
      if (search) currentPage = 1;
      const result = await fetchProducts(search, currentPage);
      renderProducts(result);
    } catch (err) {
      const loader = document.getElementById('productsTableLoader');
      const container = document.getElementById('productsContainer');
      const table = document.getElementById('productsTable');
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (table) table.style.display = 'table';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load products');
    }
  }

  async function loadProduct(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load product');
    return data.data || data;
  }

  async function loadParentCategories() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/categories/parents`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load categories');
    return data.data || data;
  }

  async function loadSubcategories(parentId) {
    if (!parentId) return [];
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/categories/subcategories/${parentId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load subcategories');
    return data.data || data;
  }

  async function loadOccasions() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/occasions/all`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load occasions');
    return data.data || data;
  }

  async function populateOccasions(selectedOccasionIds = []) {
    const container = document.getElementById('productOccasionsList');
    if (!container) return;
    try {
      const occasions = await loadOccasions();
      container.innerHTML = '';
      (occasions || []).forEach(occ => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        const isChecked = selectedOccasionIds.some(id => parseInt(id) === parseInt(occ.id));
        div.innerHTML = `
          <input type="checkbox" id="occ_${occ.id}" value="${occ.id}" ${isChecked ? 'checked' : ''} name="productOccasions">
          <label for="occ_${occ.id}">${occ.name}</label>
        `;
        container.appendChild(div);
      });
    } catch (err) {
      console.error('Failed to load occasions:', err);
    }
  }

  async function populateCategoryDropdown() {
    try {
      const categories = await loadParentCategories();
      const select = document.getElementById('productCategory');
      if (!select) return;
      
      select.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  async function loadGenders() {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/genders`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load genders');
    return data.data || data;
  }

  async function populateGenderDropdown(selectedGender = null) {
    const select = document.getElementById('productGender');
    if (!select) return;
    try {
      const genders = await loadGenders();
      const previous = select.value;
      select.innerHTML = '<option value=\"\">All / Any</option>';
      genders.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.name;
        opt.textContent = g.name;
        if (selectedGender && selectedGender === g.name) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      if (!selectedGender && previous) {
        select.value = previous;
      }
    } catch (err) {
      console.error('Failed to load genders:', err);
    }
  }

  async function populateSubcategoryDropdown(parentId, selectedSubcategoryId = null) {
    const select = document.getElementById('productSubcategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Subcategory</option>';
    
    if (!parentId) {
      select.disabled = true;
      return;
    }
    
    select.disabled = false;
    
    try {
      const subcategories = await loadSubcategories(parentId);
      subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.id;
        option.textContent = sub.name;
        if (selectedSubcategoryId && sub.id == selectedSubcategoryId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Failed to load subcategories:', err);
    }
  }

  async function buildCategoryMap() {
    const token = requireAuth();
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await fetch(`${API_BASE}/admin/categories?${params.toString()}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load category map');
      const categories = data.data || data.categories || data;
      categoryNameById = {};
      categories.forEach(c => {
        if (c.id != null && c.name) {
          categoryNameById[String(c.id)] = c.name;
        }
      });
    } catch (err) {
      console.error('Failed to build category map:', err);
    }
  }

  function getCategoryLabel(product) {
    const map = categoryNameById || {};
    const resolve = (val) => {
      if (val === null || val === undefined || val === '') return '';
      const key = String(val);
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return map[key];
      }
      return val;
    };

    if (product.subcategory) {
      return resolve(product.subcategory);
    }
    return resolve(product.category);
  }

  async function openProductModal(product) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.add('active');
    const isEdit = !!product;
    document.getElementById('productModalTitle').textContent = isEdit ? 'Edit Product' : 'New Product';

    // Basic Info
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('productName').value = product ? product.name : '';
    document.getElementById('productSku').value = product ? (product.sku || '') : generateDefaultSKU();
    
    // Load categories, occasions and genders first, then set selected values
    await populateCategoryDropdown();
    const occasionIds = product && product.occasions ? product.occasions.map(o => o.id) : (product && product.occasion_id ? [product.occasion_id] : []);
    await populateOccasions(occasionIds);
    if (product && product.category) {
      const categorySelect = document.getElementById('productCategory');
      if (categorySelect) {
        // Try to match by name first
        let matchedCategoryId = null;
        for (let option of categorySelect.options) {
          if (option.textContent === product.category) {
            matchedCategoryId = option.value;
            break;
          }
        }
        if (matchedCategoryId) {
          categorySelect.value = matchedCategoryId;
          // Load subcategories for this category
          await populateSubcategoryDropdown(matchedCategoryId, product.subcategory);
        } else {
          // If no match, try to match subcategory name
          const categories = await loadParentCategories();
          for (let cat of categories) {
            const subs = await loadSubcategories(cat.id);
            for (let sub of subs) {
              if (sub.name === product.category) {
                // This is actually a subcategory
                categorySelect.value = cat.id;
                await populateSubcategoryDropdown(cat.id, sub.id);
                break;
              }
            }
          }
        }
      }
    } else {
      // Clear subcategories if no category selected
      const subcategorySelect = document.getElementById('productSubcategory');
      if (subcategorySelect) {
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
        subcategorySelect.disabled = true;
      }
    }
    await populateGenderDropdown(product ? (product.gender || '') : null);
    document.getElementById('productGender').value = product ? (product.gender || '') : '';
    document.getElementById('productBrand').value = product ? (product.brand || '') : '';
    document.getElementById('productShortDescription').value = product ? (product.short_description || '') : '';
    document.getElementById('productDescription').value = product ? (product.description || '') : '';
    document.getElementById('productStatus').value = product ? (product.status || 'active') : 'active';

    // Pricing
    document.getElementById('productPrice').value = product ? product.price : '';
    document.getElementById('productDiscountPrice').value = product ? (product.discount_price || '') : '';
    document.getElementById('productMakingCharges').value = product ? (product.making_charges || '') : '';
    document.getElementById('productGst').value = product ? (product.gst_percentage || '') : '';
    document.getElementById('productPriceLabel').value = product ? (product.price_label || '') : '';
    document.getElementById('productCurrency').value = product ? (product.currency || 'INR') : 'INR';
    document.getElementById('productOfferStart').value = product && product.offer_start_date ? new Date(product.offer_start_date).toISOString().slice(0, 16) : '';
    document.getElementById('productOfferEnd').value = product && product.offer_end_date ? new Date(product.offer_end_date).toISOString().slice(0, 16) : '';

    // Material & Specs
    document.getElementById('productMetalType').value = product ? (product.metal_type || '') : '';
    document.getElementById('productPurity').value = product ? (product.purity || '') : '';
    document.getElementById('productMetalWeight').value = product ? (product.metal_weight || '') : '';
    document.getElementById('productStoneType').value = product ? (product.stone_type || '') : '';
    document.getElementById('productStoneWeight').value = product ? (product.stone_weight || '') : '';
    document.getElementById('productStoneCount').value = product ? (product.stone_count || '') : '';
    document.getElementById('productCertification').value = product ? (product.certification || '') : '';
    document.getElementById('productRingSize').value = product ? (product.ring_size || '') : '';
    document.getElementById('productLength').value = product ? (product.length || '') : '';
    document.getElementById('productWidth').value = product ? (product.width || '') : '';

    // Inventory
    document.getElementById('productStockQuantity').value = product ? (product.stock_quantity || 0) : 0;
    document.getElementById('productLowStockThreshold').value = product ? (product.low_stock_threshold || 5) : 5;
    document.getElementById('productStockStatus').value = product ? (product.stock_status || 'in_stock') : 'in_stock';

    // SEO
    document.getElementById('productMetaTitle').value = product ? (product.meta_title || '') : '';
    document.getElementById('productMetaDescription').value = product ? (product.meta_description || '') : '';
    document.getElementById('productTags').value = product ? (product.tags || '') : '';

    // Shipping
    document.getElementById('productWeight').value = product ? (product.weight || '') : '';
    document.getElementById('productShippingClass').value = product ? (product.shipping_class || '') : '';
    document.getElementById('productReturnable').value = product ? (String(product.returnable) || 'true') : 'true';
    document.getElementById('productWarranty').value = product ? (product.warranty || '') : '';
    
    // Set images array from product data
    productImages = product && product.images ? product.images.map(i => i.url || i) : [];
    updateImagesPreview();

    // Set video
    const videoUrl = product ? (product.video_url || '') : '';
    document.getElementById('productVideoUrl').value = videoUrl;
    const videoPreview = document.getElementById('productVideoPreview');
    const videoPlayer = document.getElementById('productVideoPlayer');
    const videoStatus = document.getElementById('productVideoUploadStatus');
    if (videoUrl) {
      videoPlayer.src = videoUrl;
      videoPreview.style.display = 'block';
    } else {
      videoPreview.style.display = 'none';
      videoPlayer.src = '';
    }
    videoStatus.textContent = '';
    document.getElementById('productVideoFile').value = '';
    
    clearProductFormValidation();
    document.getElementById('productFormError').textContent = '';
  }

  function clearProductFormValidation() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.classList.remove('field-invalid');
    });
    form.querySelectorAll('.field-error').forEach(el => el.remove());
  }

  /** @returns {{ id: string, message: string }[]} */
  function validateProductForm() {
    const errors = [];
    const name = document.getElementById('productName')?.value?.trim();
    const category = document.getElementById('productCategory')?.value?.trim();
    const status = document.getElementById('productStatus')?.value;
    const priceVal = document.getElementById('productPrice')?.value;

    if (!name) errors.push({ id: 'productName', message: 'Product name is required' });
    if (!category) errors.push({ id: 'productCategory', message: 'Category is required' });
    const subcategory = document.getElementById('productSubcategory')?.value?.trim();
    if (!subcategory) errors.push({ id: 'productSubcategory', message: 'Subcategory is required' });
    
    const selectedOccasions = Array.from(document.querySelectorAll('input[name="productOccasions"]:checked')).map(el => el.value);
    if (selectedOccasions.length === 0) errors.push({ id: 'productOccasionsList', message: 'At least one occasion is required' });
    
    if (!status) errors.push({ id: 'productStatus', message: 'Status is required' });
    const price = priceVal !== '' && priceVal !== undefined ? parseFloat(priceVal) : NaN;
    if (isNaN(price) || price < 0) errors.push({ id: 'productPrice', message: 'Base price is required and must be 0 or greater' });
    if (productImages.length > 5) errors.push({ id: 'productImageFile', message: 'Maximum 5 images allowed' });

    return errors;
  }

  function showValidationErrors(errors) {
    if (!errors.length) return;
    clearProductFormValidation();
    const errorEl = document.getElementById('productFormError');
    const modalBody = document.querySelector('#productModal .large-modal-body');
    errorEl.textContent = errors.length === 1 ? errors[0].message : 'Please fix the following: ' + errors.map(e => e.message).join('. ');
    errors.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('field-invalid');
    });
    const first = document.getElementById(errors[0].id);
    if (first && modalBody) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
  }

  async function saveProduct(e) {
    e.preventDefault();
    const token = requireAuth();
    const errorEl = document.getElementById('productFormError');
    errorEl.textContent = '';

    const validationErrors = validateProductForm();
    if (validationErrors.length) {
      showValidationErrors(validationErrors);
      return;
    }

    const id = document.getElementById('productId').value;
    
    // Basic Info
    const name = document.getElementById('productName').value.trim();
    const sku = document.getElementById('productSku').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const subcategory = document.getElementById('productSubcategory').value.trim();
    const selectedOccasions = Array.from(document.querySelectorAll('input[name="productOccasions"]:checked')).map(el => parseInt(el.value));
    const gender = document.getElementById('productGender').value || null;
    const brand = document.getElementById('productBrand').value.trim();
    const shortDescription = document.getElementById('productShortDescription').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const status = document.getElementById('productStatus').value;

    // Pricing
    const price = parseFloat(document.getElementById('productPrice').value);
    const discountPrice = document.getElementById('productDiscountPrice').value ? parseFloat(document.getElementById('productDiscountPrice').value) : null;
    const makingCharges = document.getElementById('productMakingCharges').value ? parseFloat(document.getElementById('productMakingCharges').value) : null;
    const gstPercentage = document.getElementById('productGst').value ? parseFloat(document.getElementById('productGst').value) : null;
    const priceLabel = document.getElementById('productPriceLabel').value.trim();
    const currency = document.getElementById('productCurrency').value;
    const offerStartDate = document.getElementById('productOfferStart').value || null;
    const offerEndDate = document.getElementById('productOfferEnd').value || null;

    // Material & Specs
    const metalType = document.getElementById('productMetalType').value || null;
    const purity = document.getElementById('productPurity').value.trim() || null;
    const metalWeight = document.getElementById('productMetalWeight').value ? parseFloat(document.getElementById('productMetalWeight').value) : null;
    const stoneType = document.getElementById('productStoneType').value || null;
    const stoneWeight = document.getElementById('productStoneWeight').value ? parseFloat(document.getElementById('productStoneWeight').value) : null;
    const stoneCount = document.getElementById('productStoneCount').value ? parseInt(document.getElementById('productStoneCount').value) : null;
    const certification = document.getElementById('productCertification').value || null;
    const ringSize = document.getElementById('productRingSize').value.trim() || null;
    const length = document.getElementById('productLength').value ? parseFloat(document.getElementById('productLength').value) : null;
    const width = document.getElementById('productWidth').value ? parseFloat(document.getElementById('productWidth').value) : null;

    // Inventory
    const stockQuantity = parseInt(document.getElementById('productStockQuantity').value) || 0;
    const lowStockThreshold = parseInt(document.getElementById('productLowStockThreshold').value) || 5;
    const stockStatus = document.getElementById('productStockStatus').value;

    // SEO
    const metaTitle = document.getElementById('productMetaTitle').value.trim() || null;
    const metaDescription = document.getElementById('productMetaDescription').value.trim() || null;
    const tags = document.getElementById('productTags').value.trim() || null;

    // Shipping
    const weight = document.getElementById('productWeight').value ? parseFloat(document.getElementById('productWeight').value) : null;
    const shippingClass = document.getElementById('productShippingClass').value || null;
    const returnable = document.getElementById('productReturnable').value === 'true';
    const warranty = document.getElementById('productWarranty').value.trim() || null;

    // Build payload; use undefined for empty optionals so we don't send null (backend rejects null)
    const payload = {
      name, category, subcategory, price, description, status,
      occasion_ids: selectedOccasions,
      gender: gender || undefined,
      sku: sku || undefined,
      subcategory: subcategory || undefined,
      brand: brand || undefined,
      short_description: shortDescription || undefined,
      discount_price: discountPrice ?? undefined,
      making_charges: makingCharges ?? undefined,
      gst_percentage: gstPercentage ?? undefined,
      price_label: priceLabel || undefined,
      currency,
      offer_start_date: offerStartDate || undefined,
      offer_end_date: offerEndDate || undefined,
      metal_type: metalType || undefined,
      purity: purity || undefined,
      metal_weight: metalWeight ?? undefined,
      stone_type: stoneType || undefined,
      stone_weight: stoneWeight ?? undefined,
      stone_count: stoneCount ?? undefined,
      certification: certification || undefined,
      ring_size: ringSize || undefined,
      length: length ?? undefined,
      width: width ?? undefined,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
      stock_status: stockStatus,
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      tags: tags || undefined,
      weight: weight ?? undefined,
      shipping_class: shippingClass || undefined,
      returnable,
      warranty: warranty || undefined
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) delete payload[key];
    });
    if (productImages.length) payload.images = productImages;
    if (document.getElementById('productVideoUrl').value) payload.video_url = document.getElementById('productVideoUrl').value;

    try {
      const url = id ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/admin/products`;
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
      if (!res.ok) {
        const apiErrors = data.errors || [];
        const firstMessage = apiErrors[0]?.message || data.message || 'Could not save product';
        const fieldToId = {
          name: 'productName', category: 'productCategory', price: 'productPrice', description: 'productDescription',
          status: 'productStatus', sku: 'productSku', subcategory: 'productSubcategory', brand: 'productBrand',
          gender: 'productGender',
          short_description: 'productShortDescription', discount_price: 'productDiscountPrice', making_charges: 'productMakingCharges',
          gst_percentage: 'productGst', price_label: 'productPriceLabel', currency: 'productCurrency',
          offer_start_date: 'productOfferStart', offer_end_date: 'productOfferEnd', metal_type: 'productMetalType',
          purity: 'productPurity', metal_weight: 'productMetalWeight', stone_type: 'productStoneType',
          stone_weight: 'productStoneWeight', stone_count: 'productStoneCount', certification: 'productCertification',
          length: 'productLength', width: 'productWidth', ring_size: 'productRingSize', stock_quantity: 'productStockQuantity',
          low_stock_threshold: 'productLowStockThreshold', stock_status: 'productStockStatus', meta_title: 'productMetaTitle',
          meta_description: 'productMetaDescription', tags: 'productTags', weight: 'productWeight',
          shipping_class: 'productShippingClass', returnable: 'productReturnable', warranty: 'productWarranty', images: 'productImageFile'
        };
        const errors = apiErrors.map(e => ({ id: fieldToId[e.field] || e.field, message: e.message }));
        if (errors.length) {
          showValidationErrors(errors);
        } else {
          errorEl.textContent = (firstMessage === 'Validation failed' ? 'Please check the highlighted fields and try again.' : firstMessage);
        }
        return;
      }
      closeProductModal();
      await loadProducts();
    } catch (err) {
      const msg = err.message || 'Could not save product';
      if (msg.toLowerCase() !== 'validation failed') errorEl.textContent = msg;
    }
  }

  let pendingDeleteId = null;

  function showDeleteModal(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteProductModal');
    if (modal) modal.classList.add('active');
  }

  function hideDeleteModal() {
    pendingDeleteId = null;
    const modal = document.getElementById('deleteProductModal');
    if (modal) modal.classList.remove('active');
  }

  async function deleteProduct(id) {
    const token = requireAuth();
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) {
        if (window.showToast) window.showToast('error', data.message || 'Failed to delete product');
      } else {
        hideDeleteModal();
        if (window.showToast) window.showToast('success', 'Product deleted successfully');
        loadProducts();
      }
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to delete product');
    }
  }

  // Category change handler
  document.getElementById('productCategory')?.addEventListener('change', async function(e) {
    const categoryId = e.target.value;
    await populateSubcategoryDropdown(categoryId);
  });

  // Init bindings
  buildCategoryMap();
  loadProducts();
  populateCategoryDropdown();
  populateOccasions();
  populateGenderDropdown();

  updateImagesPreview();

  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window._searchTimer);
      window._searchTimer = setTimeout(() => {
        currentPage = 1; // Reset to first page on search
        loadProducts();
      }, 300);
    });
  }

  const newBtn = document.getElementById('newProductBtn');
  if (newBtn) newBtn.addEventListener('click', () => openProductModal(null));

  const skuGenBtn = document.getElementById('generateSkuBtn');
  if (skuGenBtn) {
    skuGenBtn.addEventListener('click', () => {
      const skuInput = document.getElementById('productSku');
      if (skuInput) skuInput.value = generateDefaultSKU();
    });
  }

  const cancelBtn = document.getElementById('cancelProductBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);

  const closeModalBtn = document.getElementById('closeProductModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);

  const form = document.getElementById('productForm');
  if (form) {
    form.addEventListener('submit', saveProduct);
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el && (el.matches('input, select, textarea'))) el.classList.remove('field-invalid');
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el && (el.matches('input, select, textarea'))) el.classList.remove('field-invalid');
    });
  }

  const tbody = document.querySelector('#productsTable tbody');
  const productsCardList = document.getElementById('productsCardList');

  async function handleProductsClick(e) {
    const img = e.target.closest('.product-thumb');
    if (img) {
      const url = img.getAttribute('data-full-url') || img.getAttribute('src');
      const modal = document.getElementById('productImageModal');
      const modalImg = document.getElementById('productImageModalImg');
      if (modal && modalImg && url) {
        modalImg.src = url;
        modal.classList.add('active');
      }
      return;
    }

    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'edit') {
      const product = await loadProduct(id);
      openProductModal(product);
    } else if (action === 'delete') {
      showDeleteModal(id);
    }
  }

  if (tbody) {
    tbody.addEventListener('click', handleProductsClick);
  }
  if (productsCardList) {
    productsCardList.addEventListener('click', handleProductsClick);
  }

  // Product image preview modal handlers
  const productImageModal = document.getElementById('productImageModal');
  const productImageModalClose = document.getElementById('closeProductImageModal');
  if (productImageModal) {
    productImageModal.addEventListener('click', (e) => {
      if (e.target === productImageModal) {
        productImageModal.classList.remove('active');
      }
    });
  }
  if (productImageModalClose) {
    productImageModalClose.addEventListener('click', () => {
      const modal = document.getElementById('productImageModal');
      if (modal) modal.classList.remove('active');
    });
  }


  // Delete modal handlers
  const deleteCancelBtn = document.getElementById('deleteProductCancel');
  const deleteConfirmBtn = document.getElementById('deleteProductConfirm');
  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener('click', hideDeleteModal);
  }
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener('click', () => {
      if (pendingDeleteId) {
        deleteProduct(pendingDeleteId);
      }
    });
  }
  // Close modal on overlay click
  const deleteModal = document.getElementById('deleteProductModal');
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        hideDeleteModal();
      }
    });
  }

  // Simple square cropper for product images
  const fileInput = document.getElementById('productImageFile');
  const cropperEl = document.getElementById('productCropper');
  const canvas = document.getElementById('productCropCanvas');
  const zoomInput = document.getElementById('productCropZoom');
  const infoEl = document.getElementById('productCropInfo');
  const cropCancelBtn = document.getElementById('productCropCancel');
  const cropUploadBtn = document.getElementById('productCropUpload');

  let sourceImage = null;
  let imgScale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;

  const drawCrop = () => {
    if (!canvas || !sourceImage) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    const baseScale = Math.max(size / sourceImage.width, size / sourceImage.height);
    const scale = baseScale * imgScale;

    const drawWidth = sourceImage.width * scale;
    const drawHeight = sourceImage.height * scale;

    // Constrain panning so the canvas stays covered
    const maxOffsetX = Math.max(0, (drawWidth - size) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - size) / 2);
    const clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
    const clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));

    const dx = (size - drawWidth) / 2 + clampedOffsetX;
    const dy = (size - drawHeight) / 2 + clampedOffsetY;

    ctx.drawImage(sourceImage, dx, dy, drawWidth, drawHeight);

    if (infoEl) {
      infoEl.textContent = `Scale: ${imgScale.toFixed(2)}x`;
    }
  };

  if (zoomInput) {
    zoomInput.addEventListener('input', () => {
      imgScale = parseFloat(zoomInput.value) || 1;
      drawCrop();
    });
  }

  if (fileInput && cropperEl) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          sourceImage = img;
          imgScale = 1;
          offsetX = 0;
          offsetY = 0;
          if (zoomInput) zoomInput.value = '1';
          cropperEl.style.display = 'block';
          drawCrop();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (cropCancelBtn && cropperEl && fileInput) {
    cropCancelBtn.addEventListener('click', () => {
      cropperEl.style.display = 'none';
      sourceImage = null;
      offsetX = 0;
      offsetY = 0;
      fileInput.value = '';
      if (infoEl) infoEl.textContent = '';
    });
  }

  if (cropUploadBtn && canvas) {
    cropUploadBtn.addEventListener('click', () => {
      if (!sourceImage) return;
      const token = requireAuth();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const formData = new FormData();
          formData.append('image', blob, 'product-cropped.png');
          const res = await fetch(`${UPLOAD_BASE}/product-image`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token
            },
            body: formData
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to upload image');

          const url = data.data && data.data.url ? data.data.url : data.url;
          if (url) {
            if (productImages.length >= 5) {
              if (window.showToast) window.showToast('error', 'Maximum 5 images allowed');
            } else {
              productImages.push(url);
              updateImagesPreview();
              if (window.showToast) window.showToast('success', 'Image added');
            }
          }

          cropperEl.style.display = 'none';
          sourceImage = null;
          offsetX = 0;
          offsetY = 0;
          fileInput.value = '';
          if (infoEl) infoEl.textContent = '';
        } catch (err) {
          if (window.showToast) window.showToast('error', err.message || 'Failed to upload image');
        }
      }, 'image/png');
    });
  }

  // Mouse drag to pan image inside cropper
  if (canvas) {
    canvas.addEventListener('mousedown', (e) => {
      if (!sourceImage) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartOffsetX = offsetX;
      dragStartOffsetY = offsetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !sourceImage) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      offsetX = dragStartOffsetX + dx;
      offsetY = dragStartOffsetY + dy;
      drawCrop();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });
  }

  // Video Upload
  document.getElementById('productVideoFile')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('productVideoUploadStatus');
    const urlInput = document.getElementById('productVideoUrl');
    const preview = document.getElementById('productVideoPreview');
    const player = document.getElementById('productVideoPlayer');

    if (!file.type.startsWith('video/')) {
      if (window.showToast) window.showToast('error', 'Please select a valid video file');
      return;
    }

    status.textContent = 'Uploading video...';
    status.style.color = '#832729';

    try {
      const formData = new FormData();
      formData.append('video', file);

      const token = requireAuth();
      const res = await fetch(`${UPLOAD_BASE}/promo-video`, { 
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      const url = data.data && data.data.url ? data.data.url : data.url;
      urlInput.value = url;
      player.src = url;
      preview.style.display = 'block';
      status.textContent = 'Video uploaded successfully';
      status.style.color = '#16a34a';
      if (window.showToast) window.showToast('success', 'Video uploaded');
    } catch (err) {
      status.textContent = 'Upload failed: ' + err.message;
      status.style.color = '#c62828';
      if (window.showToast) window.showToast('error', err.message);
    }
  });

  document.getElementById('removeProductVideo')?.addEventListener('click', () => {
    document.getElementById('productVideoUrl').value = '';
    document.getElementById('productVideoFile').value = '';
    document.getElementById('productVideoPreview').style.display = 'none';
    document.getElementById('productVideoPlayer').src = '';
    document.getElementById('productVideoUploadStatus').textContent = '';
  });
});


