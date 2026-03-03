document.addEventListener('DOMContentLoaded', () => {
    const apiBase = document.body.dataset.apiBase;
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    // DOM Elements
    const loader = document.getElementById('promosTableLoader');
    const container = document.getElementById('promosContainer');
    const tbody = document.getElementById('promosTableBody');
    const newBtn = document.getElementById('newPromoBtn');

    const modal = document.getElementById('promoModal');
    const closePromoModal = document.getElementById('closePromoModal');
    const cancelPromoBtn = document.getElementById('cancelPromoBtn');
    const form = document.getElementById('promoForm');
    const errorEl = document.getElementById('promoFormError');
    const saveBtn = document.getElementById('savePromoBtn');

    const deleteModal = document.getElementById('deletePromoModal');
    const deleteCancelBtn = document.getElementById('deletePromoCancel');
    const deleteConfirmBtn = document.getElementById('deletePromoConfirm');

    let promos = [];
    let deleteId = null;

    async function fetchPromos() {
        loader.style.display = 'block';
        container.style.display = 'none';
        try {
            const res = await fetch(`${apiBase}/admin/promos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            promos = data.data || [];
            renderTable();
        } catch (err) {
            alert('Error fetching promos: ' + err.message);
        } finally {
            loader.style.display = 'none';
            container.style.display = 'block';
        }
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (promos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No promo videos found</td></tr>`;
            return;
        }
        promos.forEach(p => {
            const tr = document.createElement('tr');
            const videoHtml = p.video_url
                ? `<video src="${p.video_url}" style="width:150px; height:80px; object-fit:cover; border-radius:4px;" muted loop autoplay></video>`
                : 'N/A';
            const statusBadge = p.is_active
                ? `<span class="badge" style="background:#e6f4ea;color:#1e8e3e;">Active</span>`
                : `<span class="badge" style="background:#fce8e6;color:#d93025;">Inactive</span>`;

            tr.innerHTML = `
        <td>${videoHtml}</td>
        <td><strong>${p.title || 'No Title'}</strong><br><small>${p.subtitle || ''}</small></td>
        <td>${p.link_url || '-'}</td>
        <td>${statusBadge}</td>
        <td>${p.order_index}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editPromo(${p.id})" style="margin-right:5px;">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="promptDelete(${p.id})">Del</button>
        </td>
      `;
            tbody.appendChild(tr);
        });
    }

    function showModal() {
        modal.style.display = 'flex';
        errorEl.textContent = '';
    }
    function hideModal() {
        modal.style.display = 'none';
        form.reset();
        document.getElementById('promoId').value = '';
        document.getElementById('promoVideoUrl').value = '';
        document.getElementById('promoVideoPreview').innerHTML = '';
    }

    [closePromoModal, cancelPromoBtn].forEach(b => b.addEventListener('click', hideModal));
    newBtn.addEventListener('click', () => {
        document.getElementById('promoModalTitle').textContent = 'New Promo Video';
        document.getElementById('promoOrderIndex').value = '0';
        document.getElementById('promoStatus').value = 'true';
        showModal();
    });

    document.getElementById('promoVideoFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const loader = document.getElementById('videoUploadLoader');
        loader.style.display = 'block';

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch(`${apiBase}/admin/uploads/promo-video`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            document.getElementById('promoVideoUrl').value = data.data.url;
            document.getElementById('promoVideoPreview').innerHTML = `<video src="${data.data.url}" style="max-width:100%; height:150px;" controls autoplay muted></video>`;
        } catch (err) {
            alert(err.message);
        } finally {
            loader.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        saveBtn.disabled = true;

        const id = document.getElementById('promoId').value;
        const payload = {
            title: document.getElementById('promoTitle').value,
            subtitle: document.getElementById('promoSubtitle').value,
            link_url: document.getElementById('promoLinkUrl').value,
            video_url: document.getElementById('promoVideoUrl').value,
            order_index: parseInt(document.getElementById('promoOrderIndex').value) || 0,
            is_active: document.getElementById('promoStatus').value === 'true'
        };

        if (!payload.video_url) {
            errorEl.textContent = 'Please upload a video file.';
            saveBtn.disabled = false;
            return;
        }

        try {
            let res;
            if (id) {
                res = await fetch(`${apiBase}/admin/promos/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${apiBase}/admin/promos`, {
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
            fetchPromos();
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    });

    window.editPromo = (id) => {
        const p = promos.find(x => x.id === id);
        if (!p) return;
        document.getElementById('promoModalTitle').textContent = 'Edit Promo Video';
        document.getElementById('promoId').value = p.id;
        document.getElementById('promoTitle').value = p.title || '';
        document.getElementById('promoSubtitle').value = p.subtitle || '';
        document.getElementById('promoLinkUrl').value = p.link_url || '';
        document.getElementById('promoVideoUrl').value = p.video_url || '';
        document.getElementById('promoOrderIndex').value = p.order_index;
        document.getElementById('promoStatus').value = p.is_active ? 'true' : 'false';
        if (p.video_url) {
            document.getElementById('promoVideoPreview').innerHTML = `<video src="${p.video_url}" style="max-width:100%; height:150px;" controls autoplay muted></video>`;
        }
        showModal();
    };

    window.promptDelete = (id) => {
        deleteId = id;
        deleteModal.style.display = 'flex';
    };

    deleteCancelBtn.addEventListener('click', () => {
        deleteId = null;
        deleteModal.style.display = 'none';
    });

    deleteConfirmBtn.addEventListener('click', async () => {
        if (!deleteId) return;
        deleteConfirmBtn.disabled = true;
        try {
            const res = await fetch(`${apiBase}/admin/promos/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }
            deleteModal.style.display = 'none';
            fetchPromos();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            deleteConfirmBtn.disabled = false;
            deleteId = null;
        }
    });

    // Init
    fetchPromos();
});
