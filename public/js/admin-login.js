document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const apiBase = body.dataset.apiBase;

  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error');
    const btn = document.getElementById('submitBtn');

    errorEl.textContent = '';
    btn.disabled = true;

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const token = (data.data && data.data.token) || data.token;
      if (!token) {
        throw new Error('No token returned from API');
      }

      localStorage.setItem('adminToken', token);
      window.location.href = '/admin';
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
});


