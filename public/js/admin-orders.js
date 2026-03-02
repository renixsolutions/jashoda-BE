document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  let currentPage = 1;
  const pageLimit = 20;
  let paginationInfo = null;
  let currentFilters = { status: '', search: '' };
  let pendingStatusOrderId = null;

  async function fetchOrders({ status = '', search = '', page = 1 } = {}) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', pageLimit);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load orders');
    return data;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderOrders(result) {
    const tbody = document.querySelector('#ordersTable tbody');
    const table = document.getElementById('ordersTable');
    const loader = document.getElementById('ordersTableLoader');
    const cardList = document.getElementById('ordersCardList');
    const emptyState = document.getElementById('ordersEmptyState');
    if (!tbody) return;

    const container = document.getElementById('ordersContainer');
    if (loader) loader.classList.remove('active');
    if (container) container.style.display = 'block';
    if (table) table.style.display = 'table';

    const orders = result.data || result.orders || result;
    tbody.innerHTML = '';
    if (cardList) cardList.innerHTML = '';

    if (!orders || orders.length === 0) {
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      paginationInfo = result.pagination || result.meta?.pagination || null;
      const pagination = document.getElementById('ordersPagination');
      if (pagination) pagination.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    orders.forEach((o) => {
      const tr = document.createElement('tr');

      const userName =
        o.user_name ||
        [o.user_first_name, o.user_last_name].filter(Boolean).join(' ') ||
        o.user_email ||
        o.user_phone ||
        (o.user_id != null ? `User #${o.user_id}` : '-');

      const paymentBadgeClass =
        o.payment_status === 'paid'
          ? 'badge-payment-paid'
          : o.payment_status === 'failed'
          ? 'badge-payment-failed'
          : o.payment_status === 'refunded'
          ? 'badge-payment-refunded'
          : 'badge-payment-pending';
      const statusBadgeClass =
        o.status === 'delivered'
          ? 'badge-status-delivered'
          : o.status === 'cancelled'
          ? 'badge-status-cancelled'
          : o.status === 'processing'
          ? 'badge-status-processing'
          : 'badge-status-pending';

      tr.innerHTML = `
        <td>${o.order_number || o.id}</td>
        <td>${userName}</td>
        <td>₹${parseFloat(o.total || 0).toLocaleString('en-IN')}</td>
        <td>${o.payment_method || '-'}</td>
        <td><span class="badge ${paymentBadgeClass}">${o.payment_status || 'pending'}</span></td>
        <td><span class="badge ${statusBadgeClass}">${o.status || 'pending'}</span></td>
        <td>${formatDateTime(o.created_at)}</td>
        <td class="table-actions">
          <button class="btn btn-secondary btn-sm" data-action="view" data-id="${o.id}">View</button>
          <button class="btn btn-primary btn-sm" data-action="status" data-id="${o.id}">Status</button>
        </td>
      `;
      tbody.appendChild(tr);

      if (cardList) {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
          <div class="mobile-card-row">
            <div class="mobile-card-label">Order #</div>
            <div class="mobile-card-value">${o.order_number || o.id}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Customer</div>
            <div class="mobile-card-value">${userName}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Total</div>
            <div class="mobile-card-value">₹${parseFloat(o.total || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Payment</div>
            <div class="mobile-card-value">${o.payment_method || '-'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Pay Status</div>
            <div class="mobile-card-value">${o.payment_status || 'pending'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Status</div>
            <div class="mobile-card-value">${o.status || 'pending'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Placed</div>
            <div class="mobile-card-value">${formatDateTime(o.created_at)}</div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-secondary btn-sm" data-action="view" data-id="${o.id}">View</button>
            <button class="btn btn-primary btn-sm" data-action="status" data-id="${o.id}">Status</button>
          </div>
        `;
        cardList.appendChild(card);
      }
    });

    paginationInfo = result.pagination || result.meta?.pagination || null;
    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('ordersPagination');
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
          loadOrders();
        }
      });
    });
  }

  async function loadOrders() {
    try {
      const table = document.getElementById('ordersTable');
      const container = document.getElementById('ordersContainer');
      const loader = document.getElementById('ordersTableLoader');

      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';
      if (table) table.style.display = 'none';

      const searchInput = document.getElementById('orderSearch');
      const statusSelect = document.getElementById('orderStatusFilter');
      currentFilters.search = searchInput ? searchInput.value.trim() : '';
      currentFilters.status = statusSelect ? statusSelect.value : '';

      const result = await fetchOrders({
        status: currentFilters.status,
        search: currentFilters.search,
        page: currentPage
      });
      renderOrders(result);
    } catch (err) {
      const loader = document.getElementById('ordersTableLoader');
      const container = document.getElementById('ordersContainer');
      const table = document.getElementById('ordersTable');
      if (loader) loader.classList.remove('active');
      if (container) container.style.display = 'block';
      if (table) table.style.display = 'table';
      if (window.showToast) window.showToast('error', err.message || 'Failed to load orders');
    }
  }

  async function fetchOrderDetails(id) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load order');
    return data.data || data;
  }

  function openOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const titleEl = document.getElementById('orderDetailsTitle');
    const bodyEl = document.getElementById('orderDetailsBody');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = `Order #${order.order_number || order.id}`;
    const user = order.user || {};

    const userName =
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.email ||
      user.phone ||
      (order.user_id != null ? `User #${order.user_id}` : '-');

    const userAddressLines = [];
    if (user.address) userAddressLines.push(user.address);
    const cityStateCountry = [user.city, user.state, user.country].filter(Boolean).join(', ');
    if (cityStateCountry) userAddressLines.push(cityStateCountry);

    const userSection = `
      <div class="form-section">
        <div class="form-section-title">Customer</div>
        <p><strong>Name:</strong> ${userName}</p>
        ${user.email ? `<p><strong>Email:</strong> ${user.email}</p>` : ''}
        ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
        ${user.title ? `<p><strong>Title:</strong> ${user.title}</p>` : ''}
        ${
          userAddressLines.length
            ? `<p><strong>Address:</strong><br/>${userAddressLines.join('<br/>')}</p>`
            : ''
        }
      </div>
    `;

    const paymentInfo = `
      <div class="form-section">
        <div class="form-section-title">Payment</div>
        <p><strong>Method:</strong> ${order.payment_method || '-'}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status || 'pending'}</p>
        ${order.razorpay_order_id ? `<p><strong>Razorpay Order ID:</strong> ${order.razorpay_order_id}</p>` : ''}
        ${order.razorpay_payment_id ? `<p><strong>Razorpay Payment ID:</strong> ${order.razorpay_payment_id}</p>` : ''}
      </div>
    `;

    const address = order.shipping_address || {};
    const addressLines = [
      address.name,
      address.phone,
      address.address,
      [address.city, address.state, address.pincode].filter(Boolean).join(', ')
    ]
      .filter(Boolean)
      .join('<br/>');

    const addressInfo = `
      <div class="form-section">
        <div class="form-section-title">Shipping</div>
        ${addressLines ? `<p>${addressLines}</p>` : '<p>No shipping address recorded.</p>'}
      </div>
    `;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsRows = items
      .map(
        (it) => `
        <tr>
          <td>${it.product_name || it.product_id}</td>
          <td>${it.sku || '-'}</td>
          <td>${it.quantity}</td>
          <td>₹${parseFloat(it.price || 0).toLocaleString('en-IN')}</td>
          <td>₹${(parseFloat(it.price || 0) * it.quantity).toLocaleString('en-IN')}</td>
        </tr>
      `
      )
      .join('');

    const itemsTable = `
      <div class="form-section">
        <div class="form-section-title">Items</div>
        ${
          items.length
            ? `
          <table style="margin-top:8px;">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        `
            : '<p>No items found for this order.</p>'
        }
      </div>
    `;

    const summary = `
      <div class="form-section">
        <div class="form-section-title">Summary</div>
        <p><strong>Subtotal:</strong> ₹${parseFloat(order.subtotal || 0).toLocaleString('en-IN')}</p>
        <p><strong>Tax:</strong> ₹${parseFloat(order.tax || 0).toLocaleString('en-IN')}</p>
        <p><strong>Shipping:</strong> ₹${parseFloat(order.shipping || 0).toLocaleString('en-IN')}</p>
        <p><strong>Discount:</strong> -₹${parseFloat(order.discount || 0).toLocaleString('en-IN')}</p>
        <p><strong>Total:</strong> ₹${parseFloat(order.total || 0).toLocaleString('en-IN')}</p>
        <p><strong>Status:</strong> ${order.status || 'pending'}</p>
        <p><strong>Created At:</strong> ${formatDateTime(order.created_at)}</p>
        ${order.updated_at ? `<p><strong>Updated At:</strong> ${formatDateTime(order.updated_at)}</p>` : ''}
      </div>
    `;

    bodyEl.innerHTML = `
      ${summary}
      ${userSection}
      ${paymentInfo}
      ${addressInfo}
      ${itemsTable}
    `;

    modal.classList.add('active');
  }

  function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.classList.remove('active');
  }

  function openStatusModal(orderId, currentStatus) {
    const modal = document.getElementById('orderStatusModal');
    const select = document.getElementById('orderStatusSelect');
    const errorEl = document.getElementById('orderStatusError');
    if (!modal || !select) return;
    pendingStatusOrderId = orderId;
    select.value = currentStatus || 'pending';
    if (errorEl) errorEl.textContent = '';
    modal.classList.add('active');
  }

  function closeStatusModal() {
    const modal = document.getElementById('orderStatusModal');
    if (modal) modal.classList.remove('active');
    pendingStatusOrderId = null;
  }

  async function saveOrderStatus() {
    if (!pendingStatusOrderId) return;
    const token = requireAuth();
    const select = document.getElementById('orderStatusSelect');
    const errorEl = document.getElementById('orderStatusError');
    if (!select) return;
    const status = select.value;

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${pendingStatusOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || 'Failed to update status';
        if (errorEl) errorEl.textContent = msg;
        if (window.showToast) window.showToast('error', msg);
        return;
      }
      if (window.showToast) window.showToast('success', 'Order status updated');
      closeStatusModal();
      loadOrders();
    } catch (err) {
      const msg = err.message || 'Failed to update status';
      if (errorEl) errorEl.textContent = msg;
      if (window.showToast) window.showToast('error', msg);
    }
  }

  // Filters
  const searchInput = document.getElementById('orderSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window._orderSearchTimer);
      window._orderSearchTimer = setTimeout(() => {
        currentPage = 1;
        loadOrders();
      }, 300);
    });
  }

  const statusSelect = document.getElementById('orderStatusFilter');
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      currentPage = 1;
      loadOrders();
    });
  }

  // Table & card actions
  const tbody = document.querySelector('#ordersTable tbody');
  const ordersCardList = document.getElementById('ordersCardList');

  async function handleOrdersClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (!id || !action) return;

    if (action === 'view') {
      try {
        const order = await fetchOrderDetails(id);
        openOrderDetailsModal(order);
      } catch (err) {
        if (window.showToast) window.showToast('error', err.message || 'Failed to load order');
      }
    } else if (action === 'status') {
      let currentStatus = 'pending';
      const row = btn.closest('tr');
      if (row) {
        const statusBadge = row.querySelector('td:nth-child(6) .badge');
        if (statusBadge) currentStatus = statusBadge.textContent.trim();
      }
      openStatusModal(id, currentStatus);
    }
  }

  if (tbody) {
    tbody.addEventListener('click', handleOrdersClick);
  }
  if (ordersCardList) {
    ordersCardList.addEventListener('click', handleOrdersClick);
  }

  // Details modal handlers
  const closeDetailsBtn = document.getElementById('closeOrderDetailsModal');
  const closeDetailsFooterBtn = document.getElementById('closeOrderDetailsFooter');
  const detailsModal = document.getElementById('orderDetailsModal');
  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeOrderDetailsModal);
  if (closeDetailsFooterBtn) closeDetailsFooterBtn.addEventListener('click', closeOrderDetailsModal);
  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) {
        closeOrderDetailsModal();
      }
    });
  }

  // Status modal handlers
  const statusCancelBtn = document.getElementById('orderStatusCancel');
  const statusSaveBtn = document.getElementById('orderStatusSave');
  const statusModal = document.getElementById('orderStatusModal');
  if (statusCancelBtn) statusCancelBtn.addEventListener('click', closeStatusModal);
  if (statusSaveBtn) statusSaveBtn.addEventListener('click', saveOrderStatus);
  if (statusModal) {
    statusModal.addEventListener('click', (e) => {
      if (e.target === statusModal) {
        closeStatusModal();
      }
    });
  }

  // Initialize
  requireAuth();
  loadOrders();
});

