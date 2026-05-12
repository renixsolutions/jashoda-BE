document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  function getCurrentUserIdFromToken() {
    try {
      const token = admin.getToken();
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.id || null;
    } catch {
      return null;
    }
  }

  let currentPage = 1;
  const pageLimit = 10;
  let paginationInfo = null;

  async function fetchUsers(search = '', page = 1) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', pageLimit);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load users');
    return data;
  }

  function renderUsers(result) {
    const tbody = document.querySelector('#usersTable tbody');
    const table = document.getElementById('usersTable');
    const loader = document.getElementById('usersTableLoader');
    const cardList = document.getElementById('usersCardList');
    const emptyState = document.getElementById('usersEmptyState');
    if (!tbody) return;

    const container = document.getElementById('usersContainer');
    if (loader) loader.classList.remove('active');
    if (container) container.style.display = 'block';
    if (table) table.style.display = 'table';

    const currentUserId = getCurrentUserIdFromToken();
    let users = result.data || result.users || result;
    if (currentUserId) {
      users = users.filter((u) => u.id !== currentUserId);
    }

    tbody.innerHTML = '';
    if (cardList) cardList.innerHTML = '';

    if (!users || users.length === 0) {
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      paginationInfo = result.pagination || result.meta?.pagination || null;
      const pagination = document.getElementById('usersPagination');
      if (pagination) pagination.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    users.forEach((u) => {
      const name = u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '-';
      const created = u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${name}</td>
        <td>${u.email || '-'}</td>
        <td>${u.phone || '-'}</td>
        <td><span class="badge ${u.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}">${u.status || 'unknown'}</span></td>
        <td>${created}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-action="view" data-id="${u.id}">View</button>
        </td>
      `;
      tbody.appendChild(tr);

      if (cardList) {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
          <div class="mobile-card-row">
            <div class="mobile-card-label">ID</div>
            <div class="mobile-card-value">${u.id}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Name</div>
            <div class="mobile-card-value">${name}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Email</div>
            <div class="mobile-card-value">${u.email || '-'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Phone</div>
            <div class="mobile-card-value">${u.phone || '-'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Status</div>
            <div class="mobile-card-value">${u.status || 'unknown'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Joined</div>
            <div class="mobile-card-value">${created}</div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-secondary btn-sm" data-action="view" data-id="${u.id}">View</button>
          </div>
        `;
        cardList.appendChild(card);
      }
    });

    paginationInfo = result.pagination || result.meta?.pagination || null;
    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('usersPagination');
    if (!container || !paginationInfo) return;

    const { page, totalPages, total } = paginationInfo;
    if (!totalPages || totalPages <= 1) {
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

    container.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newPage = parseInt(btn.getAttribute('data-page'), 10);
        if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
          currentPage = newPage;
          loadUsers();
        }
      });
    });
  }

  async function loadUsers() {
    try {
      const table = document.getElementById('usersTable');
      const container = document.getElementById('usersContainer');
      const loader = document.getElementById('usersTableLoader');

      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';
      if (table) table.style.display = 'none';

      const searchInput = document.getElementById('userSearch');
      const search = searchInput ? searchInput.value.trim() : '';
      const result = await fetchUsers(search, currentPage);
      renderUsers(result);
    } catch (err) {
      const loader = document.getElementById('usersTableLoader');
      const container = document.getElementById('usersContainer');
      const table = document.getElementById('usersTable');
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (table) table.style.display = 'table';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load users');
    }
  }

  async function fetchUser(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/users/${id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load user');
    return data.data || data;
  }

  async function fetchUserOrders(id) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '50');
    params.append('userId', String(id));
    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load user orders');
    return data.data || data.orders || [];
  }

  async function fetchUserCoupons(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/users/${id}/coupons`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load user coupons');
    return data.data || [];
  }

  // Reset coupon logic is handled via event delegation on userDetailsBody

  function openUserDetailsModal(user, orders, coupons = []) {
    const modal = document.getElementById('userDetailsModal');
    const titleEl = document.getElementById('userDetailsTitle');
    const bodyEl = document.getElementById('userDetailsBody');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || `User #${user.id}`;

    const totalOrders = orders.length;
    const completed = orders.filter((o) => o.status === 'delivered').length;
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;

    const summaryHtml = `
      <div class="form-section">
        <div class="form-section-title">User</div>
        <p><strong>Name:</strong> ${titleEl.textContent}</p>
        <p><strong>Email:</strong> ${user.email || '-'}</p>
        <p><strong>Phone:</strong> ${user.phone || '-'}</p>
        <p><strong>Status:</strong> ${user.status || '-'}</p>
        <p><strong>Joined:</strong> ${user.created_at ? new Date(user.created_at).toLocaleString('en-IN') : '-'}</p>
      </div>
      <div class="form-section">
        <div class="form-section-title">Orders Overview</div>
        <p><strong>Total Orders:</strong> ${totalOrders}</p>
        <p><strong>Completed:</strong> ${completed}</p>
        <p><strong>Pending / Processing:</strong> ${pending}</p>
        <p><strong>Cancelled:</strong> ${cancelled}</p>
        <div id="userOrdersStatusChart" style="margin-top:10px;"></div>
      </div>
    `;

    const ordersRows = orders
      .map(
        (o) => `
        <tr>
          <td>${o.order_number || o.id}</td>
          <td>₹${parseFloat(o.total || 0).toLocaleString('en-IN')}</td>
          <td>${o.payment_method || '-'}</td>
          <td>${o.payment_status || 'pending'}</td>
          <td>${o.status || 'pending'}</td>
          <td>${o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '-'}</td>
        </tr>
      `
      )
      .join('');

    const ordersTable = `
      <div class="form-section">
        <div class="form-section-title">Orders</div>
        ${
          orders.length
            ? `
          <table style="margin-top:8px; font-size:13px;">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Total (₹)</th>
                <th>Payment</th>
                <th>Pay Status</th>
                <th>Status</th>
                <th>Placed At</th>
              </tr>
            </thead>
            <tbody>
              ${ordersRows}
            </tbody>
          </table>
        `
            : '<p>No orders for this user yet.</p>'
        }
      </div>
    `;

    const couponsRows = coupons
      .map(
        (c) => `
        <tr>
          <td>${c.title || c.code}</td>
          <td><code>${c.code}</code></td>
          <td>${c.is_used ? '<span class="badge badge-status-inactive">Used</span>' : '<span class="badge badge-status-active">Available</span>'}</td>
          <td>${c.used_at ? new Date(c.used_at).toLocaleString('en-IN') : '-'}</td>
          <td style="text-align:right;">
            ${c.is_used ? `<button class="btn btn-sm btn-secondary reset-coupon-btn" data-user="${user.id}" data-coupon="${c.coupon_id}">Reset</button>` : ''}
          </td>
        </tr>
      `
      )
      .join('');

    const couponsTable = `
      <div class="form-section">
        <div class="form-section-title">One-Time Offers</div>
        ${
          coupons.length
            ? `
          <table style="margin-top:8px; font-size:13px;">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Code</th>
                <th>Status</th>
                <th>Used At</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${couponsRows}
            </tbody>
          </table>
        `
            : '<p>No one-time offers assigned or used yet.</p>'
        }
      </div>
    `;

    bodyEl.innerHTML = summaryHtml + ordersTable + couponsTable;

    // Simple per-user orders status bar chart
    const chartEl = document.getElementById('userOrdersStatusChart');
    if (chartEl && totalOrders > 0) {
      const max = Math.max(totalOrders, 1);
      const makeBar = (label, value, color) => {
        const pct = Math.round((value / max) * 100);
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';

        const lbl = document.createElement('div');
        lbl.style.width = '90px';
        lbl.style.fontSize = '12px';
        lbl.style.color = '#6b7280';
        lbl.textContent = label;

        const barOuter = document.createElement('div');
        barOuter.style.flex = '1';
        barOuter.style.height = '8px';
        barOuter.style.borderRadius = '999px';
        barOuter.style.background = '#e5e7eb';
        barOuter.style.overflow = 'hidden';
        barOuter.style.marginRight = '8px';

        const barInner = document.createElement('div');
        barInner.style.height = '100%';
        barInner.style.width = `${pct}%`;
        barInner.style.borderRadius = '999px';
        barInner.style.background = color;

        const val = document.createElement('div');
        val.style.width = '40px';
        val.style.fontSize = '12px';
        val.style.textAlign = 'right';
        val.style.color = '#4b5563';
        val.textContent = value.toLocaleString('en-IN');

        barOuter.appendChild(barInner);
        row.appendChild(lbl);
        row.appendChild(barOuter);
        row.appendChild(val);
        return row;
      };

      chartEl.innerHTML = '';
      chartEl.appendChild(makeBar('Completed', completed, '#16a34a'));
      chartEl.appendChild(makeBar('Pending', pending, '#f97316'));
      chartEl.appendChild(makeBar('Cancelled', cancelled, '#ef4444'));
    }

    modal.classList.add('active');
  }

  function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) modal.classList.remove('active');
  }

  // Search
  const searchInput = document.getElementById('userSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window._userSearchTimer);
      window._userSearchTimer = setTimeout(() => {
        currentPage = 1;
        loadUsers();
      }, 300);
    });
  }

  // Row & card actions
  const tbody = document.querySelector('#usersTable tbody');
  const usersCardList = document.getElementById('usersCardList');

  async function handleUsersClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (!id || action !== 'view') return;
    try {
      const [user, orders, coupons] = await Promise.all([fetchUser(id), fetchUserOrders(id), fetchUserCoupons(id)]);
      openUserDetailsModal(user, orders, coupons);
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to load user details');
    }
  }

  if (tbody) {
    tbody.addEventListener('click', handleUsersClick);
  }
  if (usersCardList) {
    usersCardList.addEventListener('click', handleUsersClick);
  }

  // Modal controls
  const closeDetailsBtn = document.getElementById('closeUserDetailsModal');
  const closeDetailsFooterBtn = document.getElementById('closeUserDetailsFooter');
  const detailsModal = document.getElementById('userDetailsModal');
  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeUserDetailsModal);
  if (closeDetailsFooterBtn) closeDetailsFooterBtn.addEventListener('click', closeUserDetailsModal);
  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) {
        closeUserDetailsModal();
      }
    });
  }

  const userDetailsBody = document.getElementById('userDetailsBody');
  if (userDetailsBody) {
    userDetailsBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.reset-coupon-btn');
      if (!btn) return;
      
      const userId = btn.getAttribute('data-user');
      const couponId = btn.getAttribute('data-coupon');
      if (!userId || !couponId) return;

      if (!confirm('Are you sure you want to reset this coupon for the user? They will be able to use it again.')) return;
      const token = requireAuth();
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/coupons/${couponId}/reset`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reset coupon');
        if (window.showToast) window.showToast('success', 'Coupon reset successfully');
        
        // Refresh modal data
        const [user, orders, coupons] = await Promise.all([fetchUser(userId), fetchUserOrders(userId), fetchUserCoupons(userId)]);
        openUserDetailsModal(user, orders, coupons);
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message);
      }
    });
  }

  // Init
  requireAuth();
  loadUsers();
});

