import { Theme } from "./Theme.js";
export class Layout {
    constructor(auth) { this.auth = auth; }
    renderPublic() {
        const navbar = document.createElement("nav");
        navbar.className = "navbar";
        const initialTheme = Theme.get();
        const toggleHtml = `<button class="theme-toggle" data-theme="${initialTheme}" role="switch" aria-checked="${initialTheme === 'dark'}" aria-label="${initialTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}" id="theme-toggle" title="Alternar tema"><span class="theme-toggle__text theme-toggle__text--light">LIGHT<br>MODE</span><span class="theme-toggle__text theme-toggle__text--dark">DARK<br>MODE</span><span class="theme-toggle__thumb" aria-hidden="true"><span class="theme-toggle__icon theme-toggle__icon--sun"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.2v2M12 19.8v2M2.2 12h2M19.8 12h2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4"/></svg></span><span class="theme-toggle__icon theme-toggle__icon--moon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><circle cx="16.5" cy="8.2" r="1" fill="currentColor" stroke="none" opacity=".95"/><circle cx="14.8" cy="11.2" r=".6" fill="currentColor" stroke="none" opacity=".8"/></svg></span></span></button>`;
        navbar.innerHTML = `<div class="container"><a href="/" class="logo" aria-label="Interact Club - Início"><img src="/logo-interact.png" alt="Interact Club"></a><button class="mobile-toggle" aria-label="Abrir menu" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button><div class="nav-links"><a href="/">Início</a><a href="/sobre">Sobre</a><a href="/projetos">Projetos</a><a href="/eventos">Eventos</a><a href="/noticias">Notícias</a><a href="/contato">Contato</a></div><div class="nav-right">${toggleHtml}<a href="/login" id="login-link" class="btn-login">Entrar</a><div id="user-menu" style="display:none;align-items:center;gap:.75rem;"><a href="#" id="avatar-link" style="display:flex;align-items:center;gap:.5rem;color:var(--text);font-size:.875rem;"><div class="avatar-circle" id="avatar-letter">U</div><span id="user-name"></span></a><button id="logout-btn" style="background:none;border:none;color:var(--text-muted);font-size:.875rem;cursor:pointer;">Sair</button></div></div></div>`;
        const footer = document.createElement("footer");
        footer.innerHTML = `<div class="container" style="text-align:center;">
          <p style="margin-bottom:.375rem;">© ${new Date().getFullYear()} Interact Club. Todos os direitos reservados.</p>
          <p style="font-size:.8125rem;">Um programa juvenil do <a href="https://www.rotary.org/pt" target="_blank" rel="noopener" style="color:var(--amber);font-weight:500;">Rotary International</a> · <a href="/contato" style="color:var(--amber);font-weight:500;">Contato</a></p>
        </div>`;
        const toast = document.createElement("div");
        toast.id = "toast-container";
        toast.className = "toast-container";
        const pageContent = document.getElementById("page-content");
        if (pageContent) {
            document.body.insertBefore(navbar, pageContent);
            document.body.appendChild(footer);
            if (!document.getElementById("toast-container")) {
                document.body.appendChild(toast);
            }
        }
        // Tema: garante estado correto e liga toggle
        Theme.apply(initialTheme);
        const toggle = navbar.querySelector('#theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => Theme.toggle());
            // acessibilidade teclado (Space/Enter já funciona por ser button, mas garante switch)
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Theme.toggle(); }
            });
        }
        // Também aplica toggle se já existir outro no DOM (ex: mobile menu duplicado)
        document.addEventListener('click', (e) => {
            const t = e.target.closest('#theme-toggle');
            if (t && t !== toggle) Theme.toggle();
        });
    }
}
