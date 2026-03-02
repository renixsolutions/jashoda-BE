// Shared admin helpers (no inline scripts to satisfy CSP)
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const apiBase = body.dataset.apiBase;

  window.JashodaAdmin = {
    getApiBase() {
      return apiBase;
    },
    getToken() {
      return localStorage.getItem('adminToken');
    },
    requireAuth() {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
      }
      return token;
    }
  };

  // Theme handling
  function applyTheme(theme) {
    const bodyEl = document.body;
    const toggle = document.getElementById('adminThemeToggle');
    const isDark = theme === 'dark';
    bodyEl.classList.toggle('dark', isDark);
    if (toggle) {
      const icon = toggle.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'ri-sun-line' : 'ri-moon-line';
      }
    }
  }

  const savedTheme = localStorage.getItem('adminTheme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
  }

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    });
  }

  // Mobile burger menu
  const menuToggle = document.getElementById('adminMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  const themeToggle = document.getElementById('adminThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('adminTheme', next);
      applyTheme(next);
    });
  }

  // Highlight active sidebar tab based on current path
  const pathname = window.location.pathname || '';
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === '/admin') {
      if (pathname === '/admin' || pathname === '/admin/') {
        link.classList.add('active');
      }
    } else if (pathname === href || pathname.startsWith(href + '/')) {
      link.classList.add('active');
    }
  });

  // Sidebar Entities dropdown
  const entitiesToggle = document.getElementById('entitiesToggle');
  const entitiesMenu = document.getElementById('entitiesMenu');
  if (entitiesToggle && entitiesMenu) {
    entitiesToggle.addEventListener('click', (e) => {
      e.preventDefault();
      entitiesMenu.classList.toggle('open');
      entitiesToggle.classList.toggle('open', entitiesMenu.classList.contains('open'));
      const caret = entitiesToggle.querySelector('.caret');
      if (caret) {
        caret.textContent = entitiesMenu.classList.contains('open') ? '▴' : '▾';
      }
    });
    // Auto-open if a child is active
    const activeChild = entitiesMenu.querySelector('a.active');
    if (activeChild) {
      entitiesMenu.classList.add('open');
      entitiesToggle.classList.add('open');
      const caret = entitiesToggle.querySelector('.caret');
      if (caret) caret.textContent = '▴';
    }
  }

  // Global loader functions
  window.showLoader = function() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.add('active');
  };

  window.hideLoader = function() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.remove('active');
  };

  // Toast helper
  window.showToast = function(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type || 'info'}`;
    toast.innerHTML = `
      <span>${message}</span>
      <span class="toast-close">&times;</span>
    `;
    container.appendChild(toast);
    // force reflow for transition
    void toast.offsetWidth;
    toast.classList.add('show');

    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 4000);
  };
});


