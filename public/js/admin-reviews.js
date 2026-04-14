document.addEventListener('DOMContentLoaded', () => {
  const admin = window.JashodaAdmin;
  if (!admin) return;

  const API_BASE = admin.getApiBase();

  function requireAuth() {
    return admin.requireAuth();
  }

  let currentPage = 1;
  const pageLimit = 10;
  let paginationInfo = null;

  async function fetchReviews(search = '', status = '', page = 1) {
    const token = requireAuth();
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', pageLimit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/admin/products/reviews?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load reviews');
    return data;
  }

  function renderReviews(result) {
    const tbody = document.querySelector('#reviewsTable tbody');
    const table = document.getElementById('reviewsTable');
    const loader = document.getElementById('reviewsTableLoader');
    const cardList = document.getElementById('reviewsCardList');
    const emptyState = document.getElementById('reviewsEmptyState');
    if (!tbody) return;

    const container = document.getElementById('reviewsContainer');
    if (loader) loader.classList.remove('active');
    if (container) container.style.display = 'block';
    if (table) table.style.display = 'table';

    const reviews = result.data || [];
    tbody.innerHTML = '';
    if (cardList) cardList.innerHTML = '';

    if (!reviews || reviews.length === 0) {
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      paginationInfo = result.pagination || result.meta?.pagination || null;
      const pagination = document.getElementById('reviewsPagination');
      if (pagination) pagination.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    reviews.forEach((r) => {
      const created = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : '-';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.review_id}</td>
        <td>
          <div style="font-weight:600; color:#111827;">${r.user_name || 'Guest'}</div>
          <div style="font-size:11px; color:#6b7280;">${r.user_email || ''}</div>
        </td>
        <td>
          <div style="max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.review_description}">
            ${r.review_description || '-'}
          </div>
          <div style="font-size:11px; color:#832729; margin-top:2px; display:flex; align-items:center; gap:8px;">
            <span>Product ID: ${r.product_id}</span>
            ${r.media && r.media.length > 0 ? `<span style="color:#16a34a; font-weight:600;"><i class="ri-attachment-line"></i> ${r.media.length} Attachment(s)</span>` : ''}
          </div>
        </td>
        <td>
           <div style="display:flex; align-items:center; gap:2px;">
             <span style="font-weight:700;">${r.rating}</span>
             <i class="ri-star-fill" style="color:#f59e0b; font-size:14px;"></i>
           </div>
        </td>
        <td>
          <span class="badge ${getStatusBadgeClass(r.status)}">${r.status || 'pending'}</span>
        </td>
        <td>${created}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" data-action="view" data-id="${r.review_id}">Detail</button>
            ${r.status !== 'approved' ? `<button class="btn btn-primary btn-sm" data-action="approve" data-id="${r.review_id}" style="background: #16a34a; border:none;">Approve</button>` : ''}
            ${r.status !== 'rejected' ? `<button class="btn btn-danger btn-sm" data-action="reject" data-id="${r.review_id}">Reject</button>` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      if (cardList) {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
          <div class="mobile-card-row">
            <div class="mobile-card-label">User</div>
            <div class="mobile-card-value">${r.user_name || 'Guest'}</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Rating</div>
            <div class="mobile-card-value">${r.rating} ★</div>
          </div>
          <div class="mobile-card-row">
            <div class="mobile-card-label">Status</div>
            <div class="mobile-card-value"><span class="badge ${getStatusBadgeClass(r.status)}">${r.status}</span></div>
          </div>
          <div class="mobile-card-row">
             <div class="mobile-card-label">Review</div>
             <div class="mobile-card-value" style="text-align:left; italic; font-size:12px;">"${r.review_description}"</div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-secondary btn-sm" data-action="view" data-id="${r.review_id}">Detail</button>
            ${r.status !== 'approved' ? `<button class="btn btn-primary btn-sm" data-action="approve" data-id="${r.review_id}" style="background: #16a34a;">Approve</button>` : ''}
            ${r.status !== 'rejected' ? `<button class="btn btn-danger btn-sm" data-action="reject" data-id="${r.review_id}">Reject</button>` : ''}
          </div>
        `;
        cardList.appendChild(card);
      }
    });

    paginationInfo = result.pagination || result.meta?.pagination || null;
    renderPagination();
  }

  function getStatusBadgeClass(status) {
    if (status === 'approved') return 'badge-status-active';
    if (status === 'rejected') return 'badge-status-cancelled';
    return 'badge-status-pending';
  }

  function renderPagination() {
    const container = document.getElementById('reviewsPagination');
    if (!container || !paginationInfo) return;

    const { page, totalPages, total } = paginationInfo;
    if (!totalPages || totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === page) {
            html += `<button class="page-current" data-page="${i}">${i}</button>`;
        } else {
            html += `<button data-page="${i}">${i}</button>`;
        }
    }

    html += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;
    html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newPage = parseInt(btn.getAttribute('data-page'), 10);
        if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
          currentPage = newPage;
          loadReviews();
        }
      });
    });
  }

  async function loadReviews() {
    try {
      const loader = document.getElementById('reviewsTableLoader');
      const container = document.getElementById('reviewsContainer');
      if (loader) loader.classList.add('active');
      if (container) container.style.display = 'none';

      const searchInput = document.getElementById('reviewSearch');
      const statusFilter = document.getElementById('statusFilter');
      const search = searchInput ? searchInput.value.trim() : '';
      const status = statusFilter ? statusFilter.value : '';
      
      const result = await fetchReviews(search, status, currentPage);
      renderReviews(result);
    } catch (err) {
      if (window.showToast) window.showToast('error', err.message || 'Failed to load reviews');
    }
  }

  async function updateReviewStatus(id, status) {
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/products/reviews/${id}`, {
      method: 'PUT',
      headers: { 
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update review');
    if (window.showToast) window.showToast('success', `Review ${status} successfully`);
    loadReviews();
  }

  async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const token = requireAuth();
    const res = await fetch(`${API_BASE}/admin/products/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete review');
    if (window.showToast) window.showToast('success', 'Review deleted successfully');
    loadReviews();
  }

  // Event Listeners
  const searchInput = document.getElementById('reviewSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window._reviewSearchTimer);
      window._reviewSearchTimer = setTimeout(() => {
        currentPage = 1;
        loadReviews();
      }, 300);
    });
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      loadReviews();
    });
  }

  const tbody = document.querySelector('#reviewsTable tbody');
  const cardList = document.getElementById('reviewsCardList');

  async function handleAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (!id) return;

    if (action === 'approve') {
       updateReviewStatus(id, 'approved');
    } else if (action === 'reject') {
       updateReviewStatus(id, 'rejected');
    } else if (action === 'delete') {
       deleteReview(id);
    } else if (action === 'view') {
       const rev = result.data.find(r => r.review_id == id);
       if (rev) openReviewModal(rev);
    }
  }

  if (tbody) tbody.addEventListener('click', handleAction);
  if (cardList) cardList.addEventListener('click', handleAction);

  function openReviewModal(r) {
      const modal = document.getElementById('reviewDetailsModal');
      const body = document.getElementById('reviewDetailsBody');
      if (!modal || !body) return;
      
      body.innerHTML = `
        <div class="form-section">
            <div class="form-section-title">Review Details</div>
            <p><strong>User:</strong> ${r.user_name || 'Guest'} (${r.user_email || 'No email'})</p>
            <p><strong>Product ID:</strong> ${r.product_id}</p>
            <p><strong>Rating:</strong> ${r.rating} / 5</p>
            <p><strong>Status:</strong> ${r.status}</p>
            <p><strong>Date:</strong> ${new Date(r.created_at).toLocaleString()}</p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
            <p><strong>Review Description:</strong></p>
            <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; font-style: italic;">"${r.review_description}"</p>
            
            ${r.media && r.media.length > 0 ? `
              <div style="margin-top:20px;">
                <p><strong>Customer Uploads:</strong></p>
                <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
                  ${r.media.map(m => `
                    <div style="width:120px; height:120px; border:1px solid #eee; border-radius:8px; overflow:hidden; background:#000;">
                      ${m.type === 'video' ? `
                        <video src="${m.url}" style="width:100%; height:100%; object-cover" controls></video>
                      ` : `
                        <img src="${m.url}" style="width:100%; height:100%; object-fit:cover" />
                      `}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
             ${r.status !== 'approved' ? `<button class="btn btn-primary" onclick="window.updateReviewFromModal(${r.review_id}, 'approved')" style="background:#16a34a; border:none;">Approve Now</button>` : ''}
             ${r.status !== 'rejected' ? `<button class="btn btn-danger" onclick="window.updateReviewFromModal(${r.review_id}, 'rejected')">Reject Now</button>` : ''}
              <button class="btn btn-danger" onclick="window.deleteReviewFromModal(${r.review_id})" style="background:#dc2626; margin-left:auto;">Delete Permanently</button>
        </div>
      `;
      modal.classList.add('active');
  }

  window.updateReviewFromModal = (id, status) => {
      updateReviewStatus(id, status);
      document.getElementById('reviewDetailsModal').classList.remove('active');
  };
  
  window.deleteReviewFromModal = (id) => {
      deleteReview(id);
      document.getElementById('reviewDetailsModal').classList.remove('active');
  };

  const closeReviewModal = () => {
    document.getElementById('reviewDetailsModal').classList.remove('active');
  };

  document.getElementById('closeReviewModal')?.addEventListener('click', closeReviewModal);
  document.getElementById('closeReviewFooter')?.addEventListener('click', closeReviewModal);

  // Init
  requireAuth();
  loadReviews();
});
