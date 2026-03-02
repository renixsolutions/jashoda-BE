document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  async function fetchProductStats() {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '1');

    const res = await fetch(`${API_BASE}/admin/products?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load product stats');

    const pagination = data.pagination || data.meta?.pagination || {};
    return {
      totalProducts: pagination.total || 0
    };
  }

  async function fetchCategoryStats() {
    const token = requireAuth();

    // All active categories
    const baseParams = new URLSearchParams();
    baseParams.append('page', '1');
    baseParams.append('limit', '1');
    const allRes = await fetch(`${API_BASE}/admin/categories?${baseParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const allData = await allRes.json();
    if (!allRes.ok) throw new Error(allData.message || 'Failed to load category stats');
    const allPagination = allData.pagination || allData.meta?.pagination || {};
    const totalCategories = allPagination.total || 0;

    // Parent categories only (use parentId=null to trigger parent-only filter)
    const parentParams = new URLSearchParams();
    parentParams.append('page', '1');
    parentParams.append('limit', '1');
    parentParams.append('parentId', 'null');
    const parentRes = await fetch(`${API_BASE}/admin/categories?${parentParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const parentData = await parentRes.json();
    if (!parentRes.ok) throw new Error(parentData.message || 'Failed to load parent category stats');
    const parentPagination = parentData.pagination || parentData.meta?.pagination || {};
    const parentCategories = parentPagination.total || 0;

    const subcategories = Math.max(0, totalCategories - parentCategories);

    return {
      totalCategories,
      parentCategories,
      subcategories
    };
  }

  async function fetchOrderStats() {
    const token = requireAuth();

    // All orders
    const baseParams = new URLSearchParams();
    baseParams.append('page', '1');
    baseParams.append('limit', '1');
    const allRes = await fetch(`${API_BASE}/admin/orders?${baseParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const allData = await allRes.json();
    if (!allRes.ok) throw new Error(allData.message || 'Failed to load order stats');
    const allPagination = allData.pagination || allData.meta?.pagination || {};
    const totalOrders = allPagination.total || 0;

    // Pending orders
    const pendingParams = new URLSearchParams();
    pendingParams.append('page', '1');
    pendingParams.append('limit', '1');
    pendingParams.append('status', 'pending');
    const pendingRes = await fetch(`${API_BASE}/admin/orders?${pendingParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const pendingData = await pendingRes.json();
    if (!pendingRes.ok) throw new Error(pendingData.message || 'Failed to load pending order stats');
    const pendingPagination = pendingData.pagination || pendingData.meta?.pagination || {};
    const pendingOrders = pendingPagination.total || 0;

    // Completed (delivered) orders
    const completedParams = new URLSearchParams();
    completedParams.append('page', '1');
    completedParams.append('limit', '1');
    completedParams.append('status', 'delivered');
    const completedRes = await fetch(`${API_BASE}/admin/orders?${completedParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const completedData = await completedRes.json();
    if (!completedRes.ok) throw new Error(completedData.message || 'Failed to load completed order stats');
    const completedPagination = completedData.pagination || completedData.meta?.pagination || {};
    const completedOrders = completedPagination.total || 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders
    };
  }

  async function fetchRecentOrders(limit = 5) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', String(limit));
    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load recent orders');
    const orders = data.data || data.orders || [];
    return orders;
  }

  async function fetchUserStats() {
    const token = requireAuth();

    // All users
    const baseParams = new URLSearchParams();
    baseParams.append('page', '1');
    baseParams.append('limit', '1');
    const allRes = await fetch(`${API_BASE}/users?${baseParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const allData = await allRes.json();
    if (!allRes.ok) throw new Error(allData.message || 'Failed to load user stats');
    const allPagination = allData.pagination || allData.meta?.pagination || {};
    const totalUsers = allPagination.total || 0;

    // Active users
    const activeParams = new URLSearchParams();
    activeParams.append('page', '1');
    activeParams.append('limit', '1');
    activeParams.append('status', 'active');
    const activeRes = await fetch(`${API_BASE}/users?${activeParams.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const activeData = await activeRes.json();
    if (!activeRes.ok) throw new Error(activeData.message || 'Failed to load active user stats');
    const activePagination = activeData.pagination || activeData.meta?.pagination || {};
    const activeUsers = activePagination.total || 0;

    return {
      total: totalUsers,
      active: activeUsers
    };
  }

  async function initDashboard() {
    const totalProductsEl = document.getElementById('statTotalProducts');
    const totalCategoriesEl = document.getElementById('statTotalCategories');
    const parentCategoriesEl = document.getElementById('statParentCategories');
    const subcategoriesEl = document.getElementById('statSubcategories');
    const totalOrdersEl = document.getElementById('statTotalOrders');
    const completedOrdersEl = document.getElementById('statCompletedOrders');
    const pendingOrdersEl = document.getElementById('statPendingOrders');
    const recentOrdersList = document.getElementById('recentOrdersList');
    const ordersStatusChart = document.getElementById('ordersStatusChart');
    const catalogChart = document.getElementById('catalogChart');
    const totalUsersEl = document.getElementById('statTotalUsers');
    const activeUsersEl = document.getElementById('statActiveUsers');
    if (!totalProductsEl || !totalCategoriesEl) return;

    try {
      totalProductsEl.textContent = '...';
      totalCategoriesEl.textContent = '...';
      if (parentCategoriesEl) parentCategoriesEl.textContent = '...';
      if (subcategoriesEl) subcategoriesEl.textContent = '...';
      if (totalOrdersEl) totalOrdersEl.textContent = '...';
      if (completedOrdersEl) completedOrdersEl.textContent = '...';
      if (pendingOrdersEl) pendingOrdersEl.textContent = '...';
      if (recentOrdersList) recentOrdersList.innerHTML = '<span style="font-size:13px; color:#9ca3af;">Loading...</span>';
      if (ordersStatusChart) ordersStatusChart.textContent = '';
      if (catalogChart) catalogChart.textContent = '';
      if (totalUsersEl) totalUsersEl.textContent = '...';
      if (activeUsersEl) activeUsersEl.textContent = '...';

      const [productStats, categoryStats, orderStats, recentOrders, userStats] = await Promise.all([
        fetchProductStats(),
        fetchCategoryStats(),
        fetchOrderStats(),
        fetchRecentOrders(),
        fetchUserStats()
      ]);

      totalProductsEl.textContent = productStats.totalProducts.toLocaleString('en-IN');
      totalCategoriesEl.textContent = categoryStats.totalCategories.toLocaleString('en-IN');
      if (parentCategoriesEl) parentCategoriesEl.textContent = categoryStats.parentCategories.toLocaleString('en-IN');
      if (subcategoriesEl) subcategoriesEl.textContent = categoryStats.subcategories.toLocaleString('en-IN');
      if (totalOrdersEl) totalOrdersEl.textContent = orderStats.totalOrders.toLocaleString('en-IN');
      if (completedOrdersEl) completedOrdersEl.textContent = orderStats.completedOrders.toLocaleString('en-IN');
      if (pendingOrdersEl) pendingOrdersEl.textContent = orderStats.pendingOrders.toLocaleString('en-IN');
      if (totalUsersEl) totalUsersEl.textContent = userStats.total.toLocaleString('en-IN');
      if (activeUsersEl) activeUsersEl.textContent = userStats.active.toLocaleString('en-IN');

      // Simple bar charts
      if (ordersStatusChart) {
        const { totalOrders, completedOrders, pendingOrders } = orderStats;
        const other = Math.max(0, totalOrders - completedOrders - pendingOrders);
        const max = Math.max(totalOrders || 0, 1);
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
          lbl.textContent = `${label}`;

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

        ordersStatusChart.innerHTML = '';
        ordersStatusChart.appendChild(makeBar('Completed', completedOrders, '#16a34a'));
        ordersStatusChart.appendChild(makeBar('Pending', pendingOrders, '#f97316'));
        if (other > 0) {
          ordersStatusChart.appendChild(makeBar('Other', other, '#64748b'));
        }
      }

      if (catalogChart) {
        const products = productStats.totalProducts || 0;
        const categories = categoryStats.totalCategories || 0;
        const max = Math.max(products, categories, 1);

        const makeVert = (label, value, color) => {
          const pct = Math.round((value / max) * 100);
          const col = document.createElement('div');
          col.style.display = 'flex';
          col.style.flexDirection = 'column';
          col.style.alignItems = 'center';
          col.style.flex = '1';

          const barOuter = document.createElement('div');
          barOuter.style.height = '90px';
          barOuter.style.width = '18px';
          barOuter.style.borderRadius = '999px';
          barOuter.style.background = '#e5e7eb';
          barOuter.style.overflow = 'hidden';
          barOuter.style.display = 'flex';
          barOuter.style.alignItems = 'flex-end';

          const barInner = document.createElement('div');
          barInner.style.width = '100%';
          barInner.style.height = `${pct}%`;
          barInner.style.borderRadius = '999px';
          barInner.style.background = color;

          const lbl = document.createElement('div');
          lbl.style.marginTop = '6px';
          lbl.style.fontSize = '12px';
          lbl.style.color = '#6b7280';
          lbl.textContent = label;

          const val = document.createElement('div');
          val.style.fontSize = '12px';
          val.style.color = '#4b5563';
          val.textContent = value.toLocaleString('en-IN');

          barOuter.appendChild(barInner);
          col.appendChild(barOuter);
          col.appendChild(lbl);
          col.appendChild(val);
          return col;
        };

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '20px';
        wrapper.style.justifyContent = 'space-around';
        wrapper.style.marginTop = '4px';

        wrapper.appendChild(makeVert('Products', products, '#0ea5e9'));
        wrapper.appendChild(makeVert('Categories', categories, '#6366f1'));

        catalogChart.innerHTML = '';
        catalogChart.appendChild(wrapper);
      }

      if (recentOrdersList) {
        if (!recentOrders.length) {
          recentOrdersList.innerHTML = '<span style="font-size:13px; color:#9ca3af;">No recent orders yet.</span>';
        } else {
          recentOrdersList.innerHTML = '';
          recentOrders.forEach((o) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '8px 12px';
            div.style.borderRadius = '14px';
            div.style.background = '#f9fafb';

            const left = document.createElement('div');
            left.innerHTML = `
              <div style="font-size:13px; font-weight:600; color:#111827;">${o.order_number || 'Order #' + o.id}</div>
              <div style="font-size:12px; color:#6b7280;">₹${parseFloat(o.total || 0).toLocaleString('en-IN')} • ${o.status || 'pending'}</div>
            `;

            const right = document.createElement('div');
            right.style.fontSize = '11px';
            right.style.color = '#9ca3af';
            const created = o.created_at ? new Date(o.created_at) : null;
            right.textContent = created ? created.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }) : '';

            div.appendChild(left);
            div.appendChild(right);
            recentOrdersList.appendChild(div);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }

  initDashboard();
});

