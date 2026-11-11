export const Theme = {
  get() {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  apply(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('theme', theme); } catch {}
    document.querySelectorAll('.theme-toggle').forEach(el => {
      el.setAttribute('data-theme', theme);
      el.setAttribute('aria-checked', String(isDark));
      el.setAttribute('aria-label', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
    });
  },
  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark';
    this.apply(next);
  },
  init() {
    this.apply(this.get());
    // Reage a mudança do sistema se usuário nunca escolheu manualmente? opcional
    try {
      if (!localStorage.getItem('theme') && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          this.apply(e.matches ? 'dark' : 'light');
        });
      }
    } catch {}
  }
};

// Auto-init o mais cedo possível (se este arquivo for carregado como módulo no head)
Theme.init();

// Fallback: para páginas sem navbar (login, cadastro, admin) injeta um toggle flutuante discreto
function ensureFloatingToggle() {
  if (document.querySelector('.theme-toggle')) return;
  // Só cria em páginas sem .navbar (login/cadastro) ou admin
  const needsFloating = !document.querySelector('.navbar') || document.body.classList.contains('admin-page');
  if (!needsFloating && !document.getElementById('page-content')) return;
  // Evita duplicar em páginas públicas que ainda não renderizaram o Layout
  // Aguarda um tick: se Layout ainda vai criar o toggle, não cria o flutuante
  setTimeout(() => {
    if (document.querySelector('.theme-toggle')) return;
    const theme = Theme.get();
    const btn = document.createElement('button');
    btn.className = 'theme-toggle theme-toggle--floating';
    btn.id = 'theme-toggle-floating';
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(theme === 'dark'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro');
    btn.setAttribute('data-theme', theme);
    btn.title = 'Alternar tema';
    btn.innerHTML = `<span class="theme-toggle__text theme-toggle__text--light">LIGHT<br>MODE</span><span class="theme-toggle__text theme-toggle__text--dark">DARK<br>MODE</span><span class="theme-toggle__thumb" aria-hidden="true"><span class="theme-toggle__icon theme-toggle__icon--sun"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.2v2M12 19.8v2M2.2 12h2M19.8 12h2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4"/></svg></span><span class="theme-toggle__icon theme-toggle__icon--moon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><circle cx="16.5" cy="8.2" r="1" fill="currentColor" stroke="none" opacity=".95"/><circle cx="14.8" cy="11.2" r=".6" fill="currentColor" stroke="none" opacity=".8"/></svg></span></span>`;
    btn.addEventListener('click', () => Theme.toggle());
    btn.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;';
    document.body.appendChild(btn);
  }, 400);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureFloatingToggle);
} else {
  ensureFloatingToggle();
}
