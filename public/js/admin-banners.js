document.addEventListener('DOMContentLoaded', () => {
    const apiBase = document.body.dataset.apiBase;
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    // DOM Elements
    const loader = document.getElementById('bannersTableLoader');
    const container = document.getElementById('bannersContainer');
    const emptyState = document.getElementById('bannersEmpty');
    const tbody = document.getElementById('bannersTableBody');
    const newBtn = document.getElementById('newBannerBtn');

    const modal = document.getElementById('bannerModal');
    const closeBannerModal = document.getElementById('closeBannerModal');
    const cancelBannerBtn = document.getElementById('cancelBannerBtn');
    const form = document.getElementById('bannerForm');
    const errorEl = document.getElementById('bannerFormError');
    const saveBtn = document.getElementById('saveBannerBtn');

    const deleteModal = document.getElementById('deleteBannerModal');
    const deleteCancelBtn = document.getElementById('deleteBannerCancel');
    const deleteConfirmBtn = document.getElementById('deleteBannerConfirm');

    let banners = [];
    let deleteId = null;
    let categories = [];
    let genders = [];
    let occasions = [];

    async function fetchData() {
        loader.style.display = 'block';
        container.style.display = 'none';
        emptyState.style.display = 'none';
        try {
            // Fetch everything in parallel
            const [bRes, cRes, gRes, oRes] = await Promise.all([
                fetch(`${apiBase}/admin/banners`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${apiBase}/categories`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${apiBase}/genders`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${apiBase}/occasions`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const bData = await bRes.json();
            const cData = await cRes.json();
            const gData = await gRes.json();
            const oData = await oRes.json();

            banners = bData.data || [];
            categories = cData.data || [];
            genders = gData.data || [];
            occasions = oData.data || [];

            populateDropdowns();
            renderTable();
        } catch (err) {
            console.error(err);
            alert('Error fetching data: ' + err.message);
        } finally {
            loader.style.display = 'none';
            if (banners.length > 0) {
                container.style.display = 'block';
            } else {
                emptyState.style.display = 'block';
            }
        }
    }

    function populateDropdowns() {
        // Gender
        const genderSelect = document.getElementById('bannerGenderId');
        genderSelect.innerHTML = '<option value="">None</option>';
        genders.forEach(g => {
            genderSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
        });

        // Occasion
        const occasionSelect = document.getElementById('bannerOccasionId');
        occasionSelect.innerHTML = '<option value="">None</option>';
        occasions.forEach(o => {
            occasionSelect.innerHTML += `<option value="${o.id}">${o.name}</option>`;
        });

        // Category
        const categorySelect = document.getElementById('bannerCategoryId');
        categorySelect.innerHTML = '<option value="">None</option>';
        
        const parentCategories = categories.filter(c => !c.parent_id);
        const subCategoriesMap = categories.filter(c => c.parent_id);
        
        parentCategories.forEach(c => {
            categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        // Subcategory depends on Category
        categorySelect.addEventListener('change', () => {
            const parentId = categorySelect.value;
            const subSelect = document.getElementById('bannerSubcategoryId');
            subSelect.innerHTML = '<option value="">None</option>';
            if (parentId) {
                const subs = subCategoriesMap.filter(s => s.parent_id == parentId);
                subs.forEach(s => {
                    subSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                });
            }
        });
    }

    function renderTable() {
        tbody.innerHTML = '';
        banners.forEach(b => {
            const tr = document.createElement('tr');
            const imgHtml = b.image_url
                ? `<img src="${b.image_url}" style="width:80px; height:60px; object-fit:cover; border-radius:4px;" />`
                : 'N/A';
            const statusBadge = b.is_active
                ? `<span class="badge" style="background:#e6f4ea;color:#1e8e3e;">Active</span>`
                : `<span class="badge" style="background:#fce8e6;color:#d93025;">Inactive</span>`;

            // Filter summary
            let filters = [];
            if (b.gender_id) {
                const g = genders.find(x => x.id == b.gender_id);
                if (g) filters.push(`Gender: ${g.name}`);
            }
            if (b.occasion_id) {
                const o = occasions.find(x => x.id == b.occasion_id);
                if (o) filters.push(`Occasion: ${o.name}`);
            }
            if (b.category_id) {
                const c = categories.find(x => x.id == b.category_id);
                if (c) filters.push(`Category: ${c.name}`);
            }
            if (b.subcategory_id) {
                const s = categories.find(x => x.id == b.subcategory_id);
                if (s) filters.push(`Subcategory: ${s.name}`);
            }

            const sectionLabel = b.banner_type === 'MAIN_HERO' ? 'Main Hero' : 'Carousel';

            tr.innerHTML = `
        <td>${imgHtml}</td>
        <td><strong>${b.title || 'No Title'}</strong><br><small>${b.brand_text || ''}</small></td>
        <td><span class="badge" style="background:#f3f4f6; color:#4b5563;">${sectionLabel}</span></td>
        <td style="font-size:12px;">${filters.length > 0 ? filters.join(', ') : 'All Products'}</td>
        <td>${statusBadge}</td>
        <td>${b.order_index}</td>
        <td>
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${b.id}" style="margin-right:5px;">Edit</button>
          <button class="btn btn-danger btn-sm del-btn" data-id="${b.id}">Del</button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                editBanner(id);
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                promptDelete(id);
            });
        });
    }

    function showModal() {
        modal.style.display = 'flex';
        errorEl.textContent = '';
    }
    function hideModal() {
        modal.style.display = 'none';
        form.reset();
        document.getElementById('bannerId').value = '';
        document.getElementById('bannerImageUrl').value = '';
        document.getElementById('bannerSecondaryImageUrl').value = '';
        document.getElementById('bannerImagePreview').innerHTML = '';
        document.getElementById('bannerSecondaryImagePreview').innerHTML = '';
        document.getElementById('bannerSubcategoryId').innerHTML = '<option value="">None</option>';
    }

    [closeBannerModal, cancelBannerBtn].forEach(b => b.addEventListener('click', hideModal));
    newBtn.addEventListener('click', () => {
        document.getElementById('bannerModalTitle').textContent = 'New Hero Banner';
        document.getElementById('bannerOrderIndex').value = '0';
        document.getElementById('bannerStatus').value = 'true';
        showModal();
    });

    document.getElementById('bannerImageFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadLoader = document.getElementById('imageUploadLoader');
        uploadLoader.style.display = 'block';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${apiBase}/admin/uploads/banner-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            document.getElementById('bannerImageUrl').value = data.data.url;
            document.getElementById('bannerImagePreview').innerHTML = `<img src="${data.data.url}" style="max-width:100%; height:120px; border-radius:4px; border:1px solid #ddd;" />`;
        } catch (err) {
            alert(err.message);
        } finally {
            uploadLoader.style.display = 'none';
        }
    });

    document.getElementById('bannerSecondaryImageFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadLoader = document.getElementById('secondaryImageUploadLoader');
        uploadLoader.style.display = 'block';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${apiBase}/admin/uploads/banner-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            document.getElementById('bannerSecondaryImageUrl').value = data.data.url;
            document.getElementById('bannerSecondaryImagePreview').innerHTML = `<img src="${data.data.url}" style="max-width:100%; height:120px; border-radius:4px; border:1px solid #ddd;" />`;
        } catch (err) {
            alert(err.message);
        } finally {
            uploadLoader.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        saveBtn.disabled = true;

        const id = document.getElementById('bannerId').value;
        const payload = {
            title: document.getElementById('bannerTitle').value,
            subtitle: document.getElementById('bannerSubtitle').value,
            brand_text: document.getElementById('bannerBrandText').value,
            description: document.getElementById('bannerDescription').value,
            cta_text: document.getElementById('bannerCtaText').value,
            bg_color: document.getElementById('bannerBgColor').value,
            accent_color: document.getElementById('bannerAccentColor').value,
            image_url: document.getElementById('bannerImageUrl').value,
            secondary_image_url: document.getElementById('bannerSecondaryImageUrl').value,
            banner_type: document.getElementById('bannerType').value,
            gender_id: document.getElementById('bannerGenderId').value || null,
            occasion_id: document.getElementById('bannerOccasionId').value || null,
            category_id: document.getElementById('bannerCategoryId').value || null,
            subcategory_id: document.getElementById('bannerSubcategoryId').value || null,
            order_index: parseInt(document.getElementById('bannerOrderIndex').value) || 0,
            is_active: document.getElementById('bannerStatus').value === 'true'
        };

        if (!payload.image_url) {
            errorEl.textContent = 'Please upload a banner image.';
            saveBtn.disabled = false;
            return;
        }

        try {
            let res;
            if (id) {
                res = await fetch(`${apiBase}/admin/banners/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${apiBase}/admin/banners`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            hideModal();
            fetchData();
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    });

    function editBanner(id) {
        const b = banners.find(x => x.id === id);
        if (!b) return;
        document.getElementById('bannerModalTitle').textContent = 'Edit Hero Banner';
        document.getElementById('bannerId').value = b.id;
        document.getElementById('bannerTitle').value = b.title || '';
        document.getElementById('bannerSubtitle').value = b.subtitle || '';
        document.getElementById('bannerBrandText').value = b.brand_text || '';
        document.getElementById('bannerDescription').value = b.description || '';
        document.getElementById('bannerCtaText').value = b.cta_text || '';
        document.getElementById('bannerBgColor').value = b.bg_color || '';
        document.getElementById('bannerAccentColor').value = b.accent_color || '';
        document.getElementById('bannerType').value = b.banner_type || 'PROMO_CAROUSEL';
        document.getElementById('bannerImageUrl').value = b.image_url || '';
        document.getElementById('bannerSecondaryImageUrl').value = b.secondary_image_url || '';
        document.getElementById('bannerGenderId').value = b.gender_id || '';
        document.getElementById('bannerOccasionId').value = b.occasion_id || '';
        document.getElementById('bannerCategoryId').value = b.category_id || '';
        document.getElementById('bannerOrderIndex').value = b.order_index;
        document.getElementById('bannerStatus').value = b.is_active ? 'true' : 'false';

        // Trigger subcategory population
        if (b.category_id) {
            const subSelect = document.getElementById('bannerSubcategoryId');
            const subCategoriesMap = categories.filter(c => c.parent_id == b.category_id);
            subSelect.innerHTML = '<option value="">None</option>';
            subCategoriesMap.forEach(s => {
                subSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
            subSelect.value = b.subcategory_id || '';
        }

        if (b.image_url) {
            document.getElementById('bannerImagePreview').innerHTML = `<img src="${b.image_url}" style="max-width:100%; height:120px; border-radius:4px; border:1px solid #ddd;" />`;
        }
        if (b.secondary_image_url) {
            document.getElementById('bannerSecondaryImagePreview').innerHTML = `<img src="${b.secondary_image_url}" style="max-width:100%; height:120px; border-radius:4px; border:1px solid #ddd;" />`;
        }
        showModal();
    }

    function promptDelete(id) {
        deleteId = id;
        deleteModal.style.display = 'flex';
    }

    deleteCancelBtn.addEventListener('click', () => {
        deleteId = null;
        deleteModal.style.display = 'none';
    });

    deleteConfirmBtn.addEventListener('click', async () => {
        if (!deleteId) return;
        deleteConfirmBtn.disabled = true;
        try {
            const res = await fetch(`${apiBase}/admin/banners/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }
            deleteModal.style.display = 'none';
            fetchData();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            deleteConfirmBtn.disabled = false;
            deleteId = null;
        }
    });

    // Init
    fetchData();
});
