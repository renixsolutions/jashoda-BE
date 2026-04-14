document.addEventListener('DOMContentLoaded', function() {
    const apiBaseUrl = '/api/v1';
    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
        window.location.href = '/admin/login';
        return;
    }

    // Elements
    const marqueeTableBody = document.getElementById('marqueeTableBody');
    const marqueeContainer = document.getElementById('marqueeContainer');
    const marqueeEmpty = document.getElementById('marqueeEmpty');
    const marqueeTableLoader = document.getElementById('marqueeTableLoader');
    
    const marqueeSettingsForm = document.getElementById('marqueeSettingsForm');
    const marqueeSpeed = document.getElementById('marqueeSpeed');
    const marqueeBgColor = document.getElementById('marqueeBgColor');
    const marqueeTextColor = document.getElementById('marqueeTextColor');
    const marqueeActive = document.getElementById('marqueeActive');
    const bgColorValue = document.getElementById('bgColorValue');
    const textColorValue = document.getElementById('textColorValue');
    const settingsMsg = document.getElementById('settingsMsg');

    const messageModal = document.getElementById('messageModal');
    const messageForm = document.getElementById('messageForm');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageId = document.getElementById('messageId');
    const messageText = document.getElementById('messageText');
    const messageOrder = document.getElementById('messageOrder');
    const messageStatus = document.getElementById('messageStatus');
    const messageFormError = document.getElementById('messageFormError');

    const deleteMessageModal = document.getElementById('deleteMessageModal');
    const deleteMessageConfirm = document.getElementById('deleteMessageConfirm');
    const deleteMessageCancel = document.getElementById('deleteMessageCancel');

    let itemToDelete = null;

    // Initialize
    fetchMarqueeData();

    // Color input preview
    marqueeBgColor.addEventListener('input', (e) => bgColorValue.textContent = e.target.value);
    marqueeTextColor.addEventListener('input', (e) => textColorValue.textContent = e.target.value);

    // Fetch All Data
    async function fetchMarqueeData() {
        try {
            const response = await fetch(`${apiBaseUrl}/admin/marquee`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const result = await response.json();

            if (result.success) {
                renderMessages(result.data.messages);
                populateSettings(result.data.settings);
            }
        } catch (error) {
            console.error('Error fetching marquee data:', error);
        } finally {
            marqueeTableLoader.style.display = 'none';
        }
    }

    function renderMessages(messages) {
        if (!messages || messages.length === 0) {
            marqueeContainer.style.display = 'none';
            marqueeEmpty.style.display = 'block';
            return;
        }

        marqueeEmpty.style.display = 'none';
        marqueeContainer.style.display = 'block';
        marqueeTableBody.innerHTML = '';

        messages.forEach(msg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${msg.text}</strong></td>
                <td>${msg.display_order}</td>
                <td>
                    <span class="status-badge ${msg.is_active ? 'status-active' : 'status-inactive'}">
                        ${msg.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${msg.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${msg.id}">Delete</button>
                </td>
            `;
            marqueeTableBody.appendChild(tr);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id, messages));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
        });
    }

    function populateSettings(settings) {
        if (!settings) return;
        marqueeSpeed.value = settings.speed;
        marqueeBgColor.value = settings.bg_color;
        marqueeTextColor.value = settings.text_color;
        marqueeActive.checked = !!settings.is_active;
        bgColorValue.textContent = settings.bg_color;
        textColorValue.textContent = settings.text_color;
    }

    // Settings Submit
    marqueeSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        settingsMsg.innerHTML = '<span style="color: blue;">Saving...</span>';

        try {
            const response = await fetch(`${apiBaseUrl}/admin/marquee/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    speed: parseInt(marqueeSpeed.value),
                    bg_color: marqueeBgColor.value,
                    text_color: marqueeTextColor.value,
                    is_active: marqueeActive.checked
                })
            });

            const result = await response.json();
            if (result.success) {
                settingsMsg.innerHTML = '<span style="color: green;">Settings saved successfully!</span>';
                setTimeout(() => settingsMsg.innerHTML = '', 3000);
            } else {
                settingsMsg.innerHTML = `<span class="error">${result.message}</span>`;
            }
        } catch (error) {
            settingsMsg.innerHTML = '<span class="error">Failed to save settings</span>';
        }
    });

    // Message Modal Functions
    document.getElementById('newMessageBtn').addEventListener('click', () => {
        messageModalTitle.textContent = 'Add Marquee Message';
        messageForm.reset();
        messageId.value = '';
        messageModal.style.display = 'flex';
    });

    function openEditModal(id, messages) {
        const msg = messages.find(m => m.id == id);
        if (!msg) return;

        messageModalTitle.textContent = 'Edit Marquee Message';
        messageId.value = msg.id;
        messageText.value = msg.text;
        messageOrder.value = msg.display_order;
        messageStatus.value = msg.is_active.toString();
        
        messageModal.style.display = 'flex';
    }

    document.getElementById('closeMessageModal').addEventListener('click', closeMessageModal);
    document.getElementById('cancelMessageBtn').addEventListener('click', closeMessageModal);
    
    function closeMessageModal() {
        messageModal.style.display = 'none';
        messageFormError.textContent = '';
    }

    // Message Form Submit
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = messageId.value;
        const isEdit = !!id;
        const url = isEdit ? `${apiBaseUrl}/admin/marquee/messages/${id}` : `${apiBaseUrl}/admin/marquee/messages`;
        const method = isEdit ? 'PUT' : 'POST';

        const data = {
            text: messageText.value,
            display_order: parseInt(messageOrder.value),
            is_active: messageStatus.value === 'true'
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                closeMessageModal();
                fetchMarqueeData();
            } else {
                messageFormError.textContent = result.message;
            }
        } catch (error) {
            messageFormError.textContent = 'An error occurred';
        }
    });

    // Delete Functions
    function openDeleteModal(id) {
        itemToDelete = id;
        deleteMessageModal.style.display = 'flex';
    }

    deleteMessageCancel.addEventListener('click', () => {
        deleteMessageModal.style.display = 'none';
        itemToDelete = null;
    });

    deleteMessageConfirm.addEventListener('click', async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`${apiBaseUrl}/admin/marquee/messages/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            const result = await response.json();
            if (result.success) {
                deleteMessageModal.style.display = 'none';
                fetchMarqueeData();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    });
});
