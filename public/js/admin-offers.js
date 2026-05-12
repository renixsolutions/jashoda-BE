document.addEventListener('DOMContentLoaded', () => {
  const apiBaseUrl = document.body.getAttribute('data-api-base');
  const offersList = document.getElementById('offersList');
  const offersLoader = document.getElementById('offersLoader');
  const offersTable = document.getElementById('offersTable');
  const offersEmptyState = document.getElementById('offersEmptyState');
  const btnNewOffer = document.getElementById('btnNewOffer');
  const offerModal = document.getElementById('offerModal');
  const offerForm = document.getElementById('offerForm');
  const modalTitle = document.getElementById('modalTitle');

  // Fetch all offers
  const fetchOffers = async () => {
    try {
      offersLoader.classList.add('active');
      offersTable.style.display = 'none';
      offersEmptyState.style.display = 'none';

      // Assuming the admin API for offers is /admin/offers
      const response = await fetch(`${apiBaseUrl}/admin/offers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        renderOffers(result.data);
        offersTable.style.display = 'table';
      } else {
        offersEmptyState.style.display = 'block';
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      showToast('error', 'Failed to fetch offers');
    } finally {
      offersLoader.classList.remove('active');
    }
  };

  const renderOffers = (offers) => {
    offersList.innerHTML = '';
    offers.forEach(offer => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:700; color:#111827;">${offer.title}</div>
          <div style="font-size:11px; color:#6b7280;">${offer.description || ''}</div>
        </td>
        <td><code style="background:#f3f4f6; padding:2px 6px; border-radius:4px; font-weight:700;">${offer.code}</code></td>
        <td>${offer.discount_type === 'PERCENTAGE' ? offer.discount_value + '%' : '₹' + offer.discount_value}</td>
        <td>₹${offer.min_purchase || 0}</td>
        <td>${new Date(offer.expiry_date).toLocaleDateString()}</td>
          <span class="badge ${offer.is_active ? 'badge-status-active' : 'badge-status-inactive'}">
            ${offer.is_active ? 'Active' : 'Disabled'}
          </span>
          ${offer.is_one_time ? '<span class="badge" style="background:#fef3c7; color:#92400e; border:1px solid #fcd34d;">One-time</span>' : ''}
        </td>
        <td style="text-align:right;">
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary btn-edit" data-id="${offer.id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${offer.id}">Delete</button>
          </div>
        </td>
      `;
      offersList.appendChild(tr);
    });

    // Add event listeners for edit and delete
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => handleEdit(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.getAttribute('data-id')));
    });
  };

  const handleEdit = async (id) => {
    // In a real app, you'd fetch the specific offer or use the data from the list
    // For now, let's assume we find it in our current list if we had it, 
    // or fetch it.
    try {
      const response = await fetch(`${apiBaseUrl}/admin/offers/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }

      });
      const result = await response.json();
      if (result.success) {
        const offer = result.data;
        document.getElementById('offerId').value = offer.id;
        document.getElementById('offerTitle').value = offer.title;
        document.getElementById('offerCode').value = offer.code;
        document.getElementById('offerDiscountType').value = offer.discount_type;
        document.getElementById('offerDiscountValue').value = offer.discount_value;
        document.getElementById('offerMinPurchase').value = offer.min_purchase || 0;
        document.getElementById('offerExpiryDate').value = offer.expiry_date.split('T')[0];
        document.getElementById('offerDescription').value = offer.description || '';
        document.getElementById('offerIsActive').checked = !!offer.is_active;
        document.getElementById('offerIsOneTime').checked = !!offer.is_one_time;

        modalTitle.innerText = 'Edit Offer';
        offerModal.classList.add('active');
      }
    } catch (error) {
      showToast('error', 'Failed to fetch offer details');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      try {
        const response = await fetch(`${apiBaseUrl}/admin/offers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          showToast('success', 'Offer deleted successfully');
          fetchOffers();
        }
      } catch (error) {
        showToast('error', 'Failed to delete offer');
      }
    }
  };

  btnNewOffer.addEventListener('click', () => {
    offerForm.reset();
    document.getElementById('offerId').value = '';
    document.getElementById('offerIsActive').checked = true;
    document.getElementById('offerIsOneTime').checked = false;
    modalTitle.innerText = 'New Offer';
    offerModal.classList.add('active');
  });

  window.closeOfferModal = () => {
    offerModal.classList.remove('active');
  };

  offerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('offerId').value;
    const data = {
      title: document.getElementById('offerTitle').value,
      code: document.getElementById('offerCode').value.toUpperCase(),
      discount_type: document.getElementById('offerDiscountType').value,
      discount_value: parseFloat(document.getElementById('offerDiscountValue').value),
      min_purchase: parseFloat(document.getElementById('offerMinPurchase').value) || 0,
      expiry_date: document.getElementById('offerExpiryDate').value,
      description: document.getElementById('offerDescription').value,
      is_active: document.getElementById('offerIsActive').checked,
      is_one_time: document.getElementById('offerIsOneTime').checked
    };

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${apiBaseUrl}/admin/offers/${id}` : `${apiBaseUrl}/admin/offers`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (result.success) {
        showToast('success', id ? 'Offer updated' : 'Offer created');
        closeOfferModal();
        fetchOffers();
      } else {
        showToast('error', result.message || 'Failed to save offer');
      }
    } catch (error) {
      showToast('error', 'Something went wrong');
    }
  });

  fetchOffers();
});
