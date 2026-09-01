export class Layout {
    constructor(auth) { this.auth = auth; }
    renderPublic() {
        const navbar = document.createElement("nav");
        navbar.className = "navbar";
        navbar.innerHTML = `<div class="container"><a href="/" class="logo"><span>Interact</span> Club</a><button class="mobile-toggle" aria-label="Abrir menu" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button><div class="nav-links"><a href="/">Início</a><a href="/sobre">Sobre</a><a href="/projetos">Projetos</a><a href="/eventos">Eventos</a><a href="/noticias">Notícias</a><a href="/contato">Contato</a></div><div class="nav-right"><a href="/login" id="login-link" class="btn-login">Entrar</a><div id="user-menu" style="display:none;align-items:center;gap:.75rem;"><a href="#" id="avatar-link" style="display:flex;align-items:center;gap:.5rem;color:var(--text);font-size:.875rem;"><div class="avatar-circle" id="avatar-letter">U</div><span id="user-name"></span></a><button id="logout-btn" style="background:none;border:none;color:var(--text-muted);font-size:.875rem;cursor:pointer;">Sair</button></div></div></div>`;
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
    }
}
