document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const apiBase = body.dataset.apiBase;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function showStep(id) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ─── State ─────────────────────────────────────────────────────────────────

  let challengeToken = null;

  // ─── Step 1: Login Form ────────────────────────────────────────────────────

  const loginForm = document.getElementById('loginForm');
  const loginBtn  = document.getElementById('loginBtn');
  const loginErr  = document.getElementById('loginError');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginErr.textContent = '';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in…';

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res  = await fetch(`${apiBase}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Login failed');

        const payload = data.data || data;

        // ── Admin 2FA flow ──
        if (payload.requires2FA && payload.challengeToken) {
          challengeToken = payload.challengeToken;

          // Update subtitle with masked email hint
          const subtitle = document.getElementById('otpSubtitle');
          if (subtitle) {
            const parts    = email.split('@');
            const masked   = parts[0].slice(0, 2) + '***@' + parts[1];
            subtitle.textContent = `A 6-digit code was sent to ${masked}.`;
          }

          showStep('step-2fa');
          document.getElementById('otpInput')?.focus();
          startOtpTimer(10 * 60); // 10 min
          return;
        }

        // ── Direct login (customer or if 2FA somehow skipped) ──
        const token = payload.token;
        if (!token) throw new Error('No token returned from API');
        localStorage.setItem('adminToken', token);
        window.location.href = '/admin';

      } catch (err) {
        loginErr.textContent = err.message;
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign in';
      }
    });
  }

  // ─── Step 2: 2FA Verification ──────────────────────────────────────────────

  const twoFaForm  = document.getElementById('twoFaForm');
  const verifyBtn  = document.getElementById('verifyBtn');
  const twoFaErr   = document.getElementById('twoFaError');

  if (twoFaForm) {
    twoFaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      twoFaErr.textContent = '';
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying…';

      const otp = document.getElementById('otpInput').value.trim();

      try {
        const res  = await fetch(`${apiBase}/admin/auth/verify-2fa`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ challengeToken, otp })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Verification failed');

        const token = (data.data && data.data.token) || data.token;
        if (!token) throw new Error('No token returned');

        localStorage.setItem('adminToken', token);
        window.location.href = '/admin';

      } catch (err) {
        twoFaErr.textContent = err.message;
        // If challenge expired or locked, go back to login
        if (err.message.includes('log in again') || err.message.includes('expired')) {
          setTimeout(() => {
            challengeToken = null;
            showStep('step-login');
            twoFaErr.textContent = '';
          }, 2500);
        }
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify & Sign in';
      }
    });
  }

  // OTP input — only digits, auto-submit at 6 chars
  const otpInput = document.getElementById('otpInput');
  if (otpInput) {
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
      if (otpInput.value.length === 6 && twoFaForm) {
        twoFaForm.requestSubmit?.() || twoFaForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });
  }

  // ─── Back button ───────────────────────────────────────────────────────────
  const backBtn = document.getElementById('backToLogin');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      challengeToken = null;
      clearInterval(timerInterval);
      showStep('step-login');
    });
  }

  // ─── Forgot password link ──────────────────────────────────────────────────
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', () => {
      window.location.href = '/admin/forgot-password';
    });
  }

  // ─── OTP Countdown Timer ───────────────────────────────────────────────────
  let timerInterval = null;

  function startOtpTimer(seconds) {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('otpTimer');
    if (!timerEl) return;
    let remaining = seconds;

    function tick() {
      const m = Math.floor(remaining / 60).toString().padStart(2, '0');
      const s = (remaining % 60).toString().padStart(2, '0');
      timerEl.textContent = `Code expires in ${m}:${s}`;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerEl.textContent = 'Code expired. Please log in again.';
        timerEl.style.color = '#dc2626';
        if (twoFaErr) twoFaErr.textContent = 'Your verification code has expired. Please log in again.';
        if (verifyBtn) verifyBtn.disabled = true;
      }
      remaining--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }
});
