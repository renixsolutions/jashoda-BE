document.addEventListener('DOMContentLoaded', () => {
    const apiBase = document.body.dataset.apiBase;
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    // DOM Elements
    const loader = document.getElementById('storiesTableLoader');
    const container = document.getElementById('storiesContainer');
    const tbody = document.getElementById('storiesTableBody');
    const newBtn = document.getElementById('newStoryBtn');

    const modal = document.getElementById('storyModal');
    const closeStoryModal = document.getElementById('closeStoryModal');
    const cancelStoryBtn = document.getElementById('cancelStoryBtn');
    const form = document.getElementById('storyForm');
    const errorEl = document.getElementById('storyFormError');
    const saveBtn = document.getElementById('saveStoryBtn');

    const deleteModal = document.getElementById('deleteStoryModal');
    const deleteCancelBtn = document.getElementById('deleteStoryCancel');
    const deleteConfirmBtn = document.getElementById('deleteStoryConfirm');

    let stories = [];
    let deleteId = null;

    async function fetchStories() {
        loader.style.display = 'block';
        container.style.display = 'none';
        try {
            const res = await fetch(`${apiBase}/admin/stories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            stories = data.data || [];
            renderTable();
        } catch (err) {
            alert('Error fetching stories: ' + err.message);
        } finally {
            loader.style.display = 'none';
            container.style.display = 'block';
        }
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (stories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No story videos found</td></tr>`;
            return;
        }
        stories.forEach(p => {
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
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${p.id}" style="margin-right:5px;">Edit</button>
          <button class="btn btn-danger btn-sm del-btn" data-id="${p.id}">Del</button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Attach event listeners safely without violating CSP
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                window.editStory(id);
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                window.promptDelete(id);
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
        document.getElementById('storyId').value = '';
        document.getElementById('storyVideoUrl').value = '';
        document.getElementById('storyVideoPreview').innerHTML = '';
    }

    [closeStoryModal, cancelStoryBtn].forEach(b => b.addEventListener('click', hideModal));
    newBtn.addEventListener('click', () => {
        document.getElementById('storyModalTitle').textContent = 'New Story Video';
        document.getElementById('storyOrderIndex').value = '0';
        document.getElementById('storyStatus').value = 'true';
        showModal();
    });

    document.getElementById('storyVideoFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const loader = document.getElementById('videoUploadLoader');
        loader.style.display = 'block';

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch(`${apiBase}/admin/uploads/story-video`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            document.getElementById('storyVideoUrl').value = data.data.url;
            document.getElementById('storyVideoPreview').innerHTML = `<video src="${data.data.url}" style="max-width:100%; height:150px;" controls autoplay muted></video>`;
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

        const id = document.getElementById('storyId').value;
        const payload = {
            title: document.getElementById('storyTitle').value,
            subtitle: document.getElementById('storySubtitle').value,
            link_url: document.getElementById('storyLinkUrl').value,
            video_url: document.getElementById('storyVideoUrl').value,
            order_index: parseInt(document.getElementById('storyOrderIndex').value) || 0,
            is_active: document.getElementById('storyStatus').value === 'true'
        };

        if (!payload.video_url) {
            errorEl.textContent = 'Please upload a video file.';
            saveBtn.disabled = false;
            return;
        }

        try {
            let res;
            if (id) {
                res = await fetch(`${apiBase}/admin/stories/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${apiBase}/admin/stories`, {
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
            fetchStories();
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            saveBtn.disabled = false;
        }
    });

    window.editStory = (id) => {
        const p = stories.find(x => x.id === id);
        if (!p) return;
        document.getElementById('storyModalTitle').textContent = 'Edit Story Video';
        document.getElementById('storyId').value = p.id;
        document.getElementById('storyTitle').value = p.title || '';
        document.getElementById('storySubtitle').value = p.subtitle || '';
        document.getElementById('storyLinkUrl').value = p.link_url || '';
        document.getElementById('storyVideoUrl').value = p.video_url || '';
        document.getElementById('storyOrderIndex').value = p.order_index;
        document.getElementById('storyStatus').value = p.is_active ? 'true' : 'false';
        if (p.video_url) {
            document.getElementById('storyVideoPreview').innerHTML = `<video src="${p.video_url}" style="max-width:100%; height:150px;" controls autoplay muted></video>`;
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
            const res = await fetch(`${apiBase}/admin/stories/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }
            deleteModal.style.display = 'none';
            fetchStories();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            deleteConfirmBtn.disabled = false;
            deleteId = null;
        }
    });

    // Init
    fetchStories();
});
