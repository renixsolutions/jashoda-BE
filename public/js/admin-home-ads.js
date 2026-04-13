document.addEventListener('DOMContentLoaded', () => {
    const apiBase = document.body.dataset.apiBase;
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    // DOM Elements
    const loader = document.getElementById('adsTableLoader');
    const container = document.getElementById('adsContainer');
    const tbody = document.getElementById('adsTableBody');
    const newBtn = document.getElementById('newAdBtn');

    const modal = document.getElementById('adModal');
    const closeAdModal = document.getElementById('closeAdModal');
    const cancelAdBtn = document.getElementById('cancelAdBtn');
    const form = document.getElementById('adForm');
    const errorEl = document.getElementById('adFormError');
    const saveBtn = document.getElementById('saveAdBtn');

    const catSelect = document.getElementById('adCategory');
    const genderSelect = document.getElementById('adGender');
    const occasionSelect = document.getElementById('adOccasion');

    const deleteModal = document.getElementById('deleteAdModal');
    const deleteCancelBtn = document.getElementById('deleteAdCancel');
    const deleteConfirmBtn = document.getElementById('deleteAdConfirm');

    let ads = [];
    let deleteId = null;

    async function fetchData() {
        loader.style.display = 'block';
        container.style.display = 'none';
        try {
            // Parallel fetch of ads and filter entities
            const [adsRes, catsRes, gendersRes, occasionsRes] = await Promise.all([
                fetch(`${apiBase}/admin/home-ads`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${apiBase}/categories?limit=100`),
                fetch(`${apiBase}/genders`),
                fetch(`${apiBase}/occasions`)
            ]);

            const adsData = await adsRes.json();
            const catsData = await catsRes.json();
            const gendersData = await gendersRes.json();
            const occasionsData = await occasionsRes.json();

            if (!adsRes.ok) throw new Error(adsData.message);

            ads = adsData.data || [];
            
            // Populate Dropdowns
            populateSelect(catSelect, catsData.data || []);
            populateSelect(genderSelect, gendersData.data || []);
            populateSelect(occasionSelect, occasionsData.data || []);

            renderTable();
        } catch (err) {
            alert('Error fetching data: ' + err.message);
        } finally {
            loader.style.display = 'none';
            container.style.display = 'block';
        }
    }

    function populateSelect(select, items) {
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name;
            select.appendChild(opt);
        });
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (ads.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No home ad cards found</td></tr>`;
            return;
        }
        ads.forEach(ad => {
            const tr = document.createElement('tr');
            const videoHtml = ad.video_url
                ? `<video src="${ad.video_url}" style="width:180px; height:100px; object-fit:cover; border-radius:8px;" muted loop autoplay></video>`
                : 'N/A';
            const statusBadge = ad.is_active
                ? `<span class="badge" style="background:#e6f4ea;color:#1e8e3e;">Active</span>`
                : `<span class="badge" style="background:#fce8e6;color:#d93025;">Inactive</span>`;

            // Filter info
            let filterInfo = [];
            if (ad.category_name) filterInfo.push(`Cat: ${ad.category_name}`);
            if (ad.gender_name) filterInfo.push(`Gen: ${ad.gender_name}`);
            if (ad.occasion_name) filterInfo.push(`Occ: ${ad.occasion_name}`);
            
            const routingDisplay = filterInfo.length > 0 
                ? `<div style="font-size:11px; color:#666;">Apply: ${filterInfo.join(', ')}</div>` 
                : '<div style="font-size:11px; color:#999;">No Filters</div>';

            tr.innerHTML = `
                <td>${videoHtml}</td>
                <td>
                    <strong>${ad.title || 'No Title'}</strong>
                    <div style="font-size:12px; color:#666; margin-top:2px;">${ad.subtitle || ''}</div>
                </td>
                <td>
                    ${routingDisplay}
                    <div style="font-size:11px; color:#888; margin-top:4px;">Link: ${ad.link_url || 'Auto-generated'}</div>
                </td>
                <td>${statusBadge}</td>
                <td>${ad.order_index}</td>
                <td class="table-actions">
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${ad.id}">Edit</button>
                    <button class="btn btn-danger btn-sm del-btn" data-id="${ad.id}">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event listeners
        tbody.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => window.editAd(parseInt(btn.dataset.id)));
        tbody.querySelectorAll('.del-btn').forEach(btn => btn.onclick = () => window.promptDelete(parseInt(btn.dataset.id)));
    }

    function showModal() {
        modal.style.display = 'flex';
        errorEl.textContent = '';
    }
    function hideModal() {
        modal.style.display = 'none';
        form.reset();
        document.getElementById('adId').value = '';
        document.getElementById('adVideoUrl').value = '';
        document.getElementById('adVideoPreview').innerHTML = '';
    }

    [closeAdModal, cancelAdBtn].forEach(b => b.onclick = hideModal);
    newBtn.onclick = () => {
        document.getElementById('adModalTitle').textContent = 'New Home Ad Card';
        document.getElementById('adOrderIndex').value = ads.length;
        document.getElementById('adStatus').value = 'true';
        showModal();
    };

    document.getElementById('adVideoFile').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadLoader = document.getElementById('videoUploadLoader');
        uploadLoader.style.display = 'block';

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch(`${apiBase}/admin/uploads/home-ad-video`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            document.getElementById('adVideoUrl').value = data.data.url;
            document.getElementById('adVideoPreview').innerHTML = `<video src="${data.data.url}" style="max-width:100%; height:150px; border-radius:8px;" controls autoplay muted></video>`;
        } catch (err) {
            alert(err.message);
        } finally {
            uploadLoader.style.display = 'none';
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        saveBtn.disabled = true;

        const id = document.getElementById('adId').value;
        const payload = {
            title: document.getElementById('adTitle').value,
            subtitle: document.getElementById('adSubtitle').value,
            link_text: document.getElementById('adLinkText').value,
            link_url: document.getElementById('adLinkUrl').value,
            category_id: document.getElementById('adCategory').value || null,
            gender_id: document.getElementById('adGender').value || null,
            occasion_id: document.getElementById('adOccasion').value || null,
            video_url: document.getElementById('adVideoUrl').value,
            order_index: parseInt(document.getElementById('adOrderIndex').value) || 0,
            is_active: document.getElementById('adStatus').value === 'true'
        };

        if (!payload.video_url) {
            errorEl.textContent = 'Please upload a video file.';
            saveBtn.disabled = false;
            return;
        }

        try {
            const url = id ? `${apiBase}/admin/home-ads/${id}` : `${apiBase}/admin/home-ads`;
            const res = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            hideModal();
            fetchData();
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    };

    window.editAd = (id) => {
        const ad = ads.find(x => x.id === id);
        if (!ad) return;
        document.getElementById('adModalTitle').textContent = 'Edit Ad Card';
        document.getElementById('adId').value = ad.id;
        document.getElementById('adTitle').value = ad.title || '';
        document.getElementById('adSubtitle').value = ad.subtitle || '';
        document.getElementById('adLinkText').value = ad.link_text || 'Explore Collection';
        document.getElementById('adLinkUrl').value = ad.link_url || '';
        document.getElementById('adCategory').value = ad.category_id || '';
        document.getElementById('adGender').value = ad.gender_id || '';
        document.getElementById('adOccasion').value = ad.occasion_id || '';
        document.getElementById('adVideoUrl').value = ad.video_url || '';
        document.getElementById('adOrderIndex').value = ad.order_index;
        document.getElementById('adStatus').value = ad.is_active ? 'true' : 'false';
        
        if (ad.video_url) {
            document.getElementById('adVideoPreview').innerHTML = `<video src="${ad.video_url}" style="max-width:100%; height:150px; border-radius:8px;" controls autoplay muted></video>`;
        }
        showModal();
    };

    window.promptDelete = (id) => {
        deleteId = id;
        deleteModal.style.display = 'flex';
    };

    deleteCancelBtn.onclick = () => {
        deleteId = null;
        deleteModal.style.display = 'none';
    };

    deleteConfirmBtn.onclick = async () => {
        if (!deleteId) return;
        deleteConfirmBtn.disabled = true;
        try {
            const res = await fetch(`${apiBase}/admin/home-ads/${deleteId}`, {
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
    };

    fetchData();
});
