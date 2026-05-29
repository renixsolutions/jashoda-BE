document.addEventListener('DOMContentLoaded', () => {
    const admin = window.JashodaAdmin;
    if (!admin) return;

    const API_BASE = admin.getApiBase();

    function requireAuth() {
        return admin.requireAuth();
    }

    async function fetchTestimonials() {
        const token = requireAuth();
        const res = await fetch(`${API_BASE}/admin/testimonials`, {
            headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load testimonials');
        return data;
    }

    function renderTestimonials(result) {
        const tbody = document.querySelector('#testimonialsTable tbody');
        const loader = document.getElementById('testimonialsTableLoader');
        const container = document.getElementById('testimonialsContainer');
        const emptyState = document.getElementById('testimonialsEmptyState');
        
        if (loader) loader.classList.remove('active');
        if (container) container.style.display = 'block';

        const testimonials = result.data || [];
        tbody.innerHTML = '';

        if (!testimonials || testimonials.length === 0) {
            document.getElementById('testimonialsTable').style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        document.getElementById('testimonialsTable').style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';

        testimonials.forEach((t) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.id}</td>
                <td>
                    <div style="width:50px; height:50px; background:#f0f0f0; border-radius:8px; overflow:hidden;">
                        ${t.image_url ? `<img src="${t.image_url}" style="width:100%; height:100%; object-fit:cover;">` : ''}
                    </div>
                </td>
                <td><div style="font-weight:600;">${t.name}</div></td>
                <td><div style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.content}</div></td>
                <td>
                    <div style="display:flex; align-items:center; gap:2px;">
                        <span>${t.rating}</span>
                        <i class="ri-star-fill" style="color:#f59e0b;"></i>
                    </div>
                </td>
                <td>
                    <span class="badge ${t.is_active ? 'badge-status-active' : 'badge-status-inactive'}">
                        ${t.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${t.id}">Edit</button>
                        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${t.id}">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function loadTestimonials() {
        try {
            const loader = document.getElementById('testimonialsTableLoader');
            if (loader) loader.classList.add('active');
            const result = await fetchTestimonials();
            renderTestimonials(result);
        } catch (err) {
            if (window.showToast) window.showToast('error', err.message);
        }
    }

    // Modal logic
    const modal = document.getElementById('testimonialModal');
    const form = document.getElementById('testimonialForm');
    const addBtn = document.getElementById('addTestimonialBtn');
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('testimonialId').value = '';
        document.getElementById('modalTitle').innerText = 'Add Testimonial';
        document.getElementById('image_url').value = '';
        imagePreview.innerHTML = '<span style="color:#ccc; font-size:10px;">No Image</span>';
        modal.classList.add('active');
    });

    document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
    document.getElementById('closeFooter').onclick = () => modal.classList.remove('active');

    // Image Upload with Cropper
    let cropState = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
        if (ext === '.heic' || ext === '.heif') {
            const token = requireAuth();
            const formData = new FormData();
            formData.append('image', file);
            try {
                if (window.showToast) window.showToast('info', 'Uploading HEIC image directly...');
                const res = await fetch(`${API_BASE}/admin/uploads/testimonial-image`, {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + token },
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');

                const url = data.data && data.data.url ? data.data.url : data.url;
                document.getElementById('image_url').value = url;
                imagePreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
                if (window.showToast) window.showToast('success', 'Image uploaded');
            } catch (err) {
                if (window.showToast) window.showToast('error', err.message || 'Failed to upload HEIC image');
            } finally {
                imageInput.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                cropState = { img, scale: 1, x: 0, y: 0 };
                document.getElementById('testimonialCropper').classList.add('active');
                drawCrop();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    function drawCrop() {
        const canvas = document.getElementById('testimonialCropCanvas');
        if (!canvas || !cropState) return;
        const ctx = canvas.getContext('2d');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        const { img, scale, x, y } = cropState;
        const imgScale = Math.min(size / img.width, size / img.height) * scale;
        const w = img.width * imgScale;
        const h = img.height * imgScale;
        const offsetX = (size - w) / 2 + x * scale;
        const offsetY = (size - h) / 2 + y * scale;

        ctx.drawImage(img, offsetX, offsetY, w, h);
    }

    document.getElementById('testimonialCropZoom').addEventListener('input', (e) => {
        if (cropState) {
            cropState.scale = parseFloat(e.target.value);
            drawCrop();
        }
    });

    const cropCanvas = document.getElementById('testimonialCropCanvas');
    cropCanvas.addEventListener('mousedown', (e) => {
        if (!cropState) return;
        isDragging = true;
        const rect = cropCanvas.getBoundingClientRect();
        dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        cropCanvas.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !cropState) return;
        const rect = cropCanvas.getBoundingClientRect();
        const dx = (e.clientX - rect.left) - dragStart.x;
        const dy = (e.clientY - rect.top) - dragStart.y;
        cropState.x += dx / cropState.scale;
        cropState.y += dy / cropState.scale;
        dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        drawCrop();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (cropCanvas) cropCanvas.style.cursor = 'grab';
    });

    document.getElementById('testimonialCropCancel').onclick = () => {
        document.getElementById('testimonialCropper').classList.remove('active');
        imageInput.value = '';
        cropState = null;
    };

    document.getElementById('testimonialCropUpload').onclick = async () => {
        if (!cropState) return;
        const canvas = document.getElementById('testimonialCropCanvas');
        canvas.toBlob(async (blob) => {
            const token = requireAuth();
            const formData = new FormData();
            formData.append('image', blob, 'testimonial.jpg');

            try {
                if (window.showToast) window.showToast('info', 'Uploading image...');
                const res = await fetch(`${API_BASE}/admin/uploads/testimonial-image`, {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + token },
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');

                const url = data.data.url;
                document.getElementById('image_url').value = url;
                imagePreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
                document.getElementById('testimonialCropper').classList.remove('active');
                if (window.showToast) window.showToast('success', 'Image uploaded');
            } catch (err) {
                if (window.showToast) window.showToast('error', err.message);
            }
        }, 'image/jpeg', 0.9);
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const token = requireAuth();
        const id = document.getElementById('testimonialId').value;
        const formData = {
            name: document.getElementById('name').value,
            rating: document.getElementById('rating').value,
            content: document.getElementById('content').value,
            order_index: document.getElementById('order_index').value,
            rotation: document.getElementById('rotation').value,
            image_url: document.getElementById('image_url').value,
            is_active: document.getElementById('is_active').checked
        };

        try {
            const url = id ? `${API_BASE}/admin/testimonials/${id}` : `${API_BASE}/admin/testimonials`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save');

            if (window.showToast) window.showToast('success', 'Testimonial saved');
            modal.classList.remove('active');
            loadTestimonials();
        } catch (err) {
            if (window.showToast) window.showToast('error', err.message);
        }
    };

    document.querySelector('#testimonialsTable tbody').addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');

        if (action === 'edit') {
            try {
                const token = requireAuth();
                const res = await fetch(`${API_BASE}/admin/testimonials/${id}`, {
                    headers: { Authorization: 'Bearer ' + token }
                });
                const result = await res.json();
                
                if (!res.ok) throw new Error(result.message || 'Failed to fetch testimonial');
                
                const t = result.data;
                if (!t) throw new Error('Testimonial data not found');

                document.getElementById('testimonialId').value = t.id;
                document.getElementById('name').value = t.name;
                document.getElementById('rating').value = t.rating;
                document.getElementById('content').value = t.content;
                document.getElementById('order_index').value = t.order_index || 0;
                document.getElementById('rotation').value = t.rotation || 0;
                document.getElementById('image_url').value = t.image_url || '';
                document.getElementById('is_active').checked = !!t.is_active;
                
                if (t.image_url) {
                    imagePreview.innerHTML = `<img src="${t.image_url}" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    imagePreview.innerHTML = '<span style="color:#ccc; font-size:10px;">No Image</span>';
                }

                document.getElementById('modalTitle').innerText = 'Edit Testimonial';
                modal.classList.add('active');
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast('error', err.message);
            }
        } else if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this testimonial?')) return;
            const token = requireAuth();
            const res = await fetch(`${API_BASE}/admin/testimonials/${id}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            if (res.ok) {
                if (window.showToast) window.showToast('success', 'Deleted successfully');
                loadTestimonials();
            }
        }
    });

    loadTestimonials();
});
