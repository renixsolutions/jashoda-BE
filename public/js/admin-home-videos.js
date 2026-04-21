document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = document.body.dataset.apiBase || '/api/v1';
    const tableBody = document.querySelector('#videoTable tbody');
    const loader = document.getElementById('videoTableLoader');
    const container = document.getElementById('videoContainer');
    const emptyState = document.getElementById('videoEmptyState');
    
    const modal = document.getElementById('videoModal');
    const form = document.getElementById('videoForm');
    const addBtn = document.getElementById('addVideoBtn');
    const closeBtn = document.getElementById('closeModal');
    const closeFooterBtn = document.getElementById('closeFooter');

    const loadData = async () => {
        loader.style.display = 'block';
        container.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            const token = localStorage.getItem('adminToken');
            if(!token) {
               window.location.href = '/admin/login';
               return;
            }
            const res = await fetch(apiBaseUrl + '/home-videos', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await res.json();
            
            if(result.success && result.data && result.data.length > 0) {
                tableBody.innerHTML = '';
                result.data.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.id}</td>
                        <td>
                            <video src="${apiBaseUrl.replace('/api/v1', '')}${item.video_url}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" muted></video>
                        </td>
                        <td>
                            <div style="font-size:12px;color:#888;">Top: ${item.top_text || '-'}</div>
                            <div style="font-weight:bold;">${item.title || '-'} <span style="color:#C8A165;">${item.subtitle || '-'}</span></div>
                            <div style="font-size:11px;color:#666;margin-top:4px;">${item.bottom_text ? item.bottom_text.substring(0, 50) + '...' : '-'}</div>
                        </td>
                        <td>
                            ${item.is_active 
                                ? '<span class="badge badge-status-active">Active</span>' 
                                : '<span class="badge badge-status-inactive">Inactive</span>'}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-secondary edit-btn" data-id="${item.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
                
                container.style.display = 'block';
                
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => editItem(result.data.find(x => x.id == btn.dataset.id)));
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
                });
            } else {
                emptyState.style.display = 'block';
            }
        } catch(e) {
            console.error(e);
            alert("Error loading data");
        } finally {
            loader.style.display = 'none';
        }
    };
    
    const openModal = () => {
        modal.classList.add('active');
    };
    
    const closeModalFn = () => {
        modal.classList.remove('active');
        form.reset();
        document.getElementById('videoId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Home Video';
        document.getElementById('videoPreviewContainer').style.display = 'none';
        document.getElementById('videoPreview').src = '';
        document.querySelector('#videoFile').required = true;
    };
    
    addBtn.addEventListener('click', () => {
        closeModalFn();
        openModal();
    });
    closeBtn.addEventListener('click', closeModalFn);
    closeFooterBtn.addEventListener('click', closeModalFn);
    
    const editItem = (item) => {
        document.getElementById('modalTitle').textContent = 'Edit Home Video';
        document.getElementById('videoId').value = item.id;
        document.getElementById('top_text').value = item.top_text || '';
        document.getElementById('title').value = item.title || '';
        document.getElementById('subtitle').value = item.subtitle || '';
        document.getElementById('bottom_text').value = item.bottom_text || '';
        document.getElementById('is_active').checked = !!item.is_active;
        
        document.querySelector('#videoFile').required = false;

        if (item.video_url) {
            document.getElementById('videoPreviewContainer').style.display = 'block';
            document.getElementById('videoPreview').src = apiBaseUrl.replace('/api/v1', '') + item.video_url;
        }
        
        openModal();
    };
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        
        const id = document.getElementById('videoId').value;
        const formData = new FormData();
        formData.append('top_text', document.getElementById('top_text').value);
        formData.append('title', document.getElementById('title').value);
        formData.append('subtitle', document.getElementById('subtitle').value);
        formData.append('bottom_text', document.getElementById('bottom_text').value);
        formData.append('is_active', document.getElementById('is_active').checked);
        
        const fileInput = document.getElementById('videoFile');
        if(fileInput.files.length > 0) {
            formData.append('video', fileInput.files[0]);
        }
        
        try {
            const token = localStorage.getItem('adminToken');
            const url = id ? `${apiBaseUrl}/home-videos/${id}` : `${apiBaseUrl}/home-videos`;
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            
            const result = await res.json();
            if(result.success) {
                closeModalFn();
                loadData();
            } else {
                alert(result.message || 'Error saving video');
            }
        } catch(err) {
            console.error(err);
            alert('Server error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Video';
        }
    });
    
    const deleteItem = async (id) => {
        if(!confirm('Are you sure you want to delete this video?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${apiBaseUrl}/home-videos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await res.json();
            if(result.success) {
                loadData();
            } else {
                alert(result.message || 'Error deleting');
            }
        } catch(e) {
            console.error(e);
            alert("Error deleting");
        }
    };
    
    loadData();
});
