export class DashboardSidebar {
    constructor(auth, api, toast) {
        this.currentSection = "visao-geral";
        this.auth = auth;
        this.api = api;
        this.toast = toast;
    }
    esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }
    init() {
        const container = document.getElementById("dashboard-sidebar");
        if (container || !this.auth.isAuthenticated())
            return;
        const saved = sessionStorage.getItem("sd-section");
        if (saved)
            this.currentSection = saved;
        const overlay = document.createElement("div");
        overlay.className = "dashboard-overlay";
        overlay.id = "dashboard-overlay";
        overlay.addEventListener("click", () => this.close());
        const sidebar = document.createElement("aside");
        sidebar.className = "dashboard-sidebar";
        sidebar.id = "dashboard-sidebar";
        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);
        const user = this.auth.getUser();
        const links = [
            { h: "visao-geral", l: "Visão Geral" },
            { h: "perfil", l: "Meu Perfil" },
            { h: "eventos", l: "Meus Eventos" },
            { h: "avisos", l: "Avisos" },
        ];
        sidebar.innerHTML = `
      <div class="sidebar-dash-header">
        <div class="avatar">${this.esc(user.name.charAt(0).toUpperCase())}</div>
        <div class="info">
          <div class="name">${this.esc(user.name)}</div>
          <div class="role">${user.role === "ADMIN" ? "Administrador" : "Membro"}</div>
        </div>
        <button class="sidebar-dash-close">&times;</button>
      </div>
      <nav class="sidebar-dash-nav">
        ${links.map(l => `<a href="#" data-section="${l.h}" class="${this.currentSection === l.h ? "active" : ""}">${l.l}</a>`).join("")}
        ${user.role === "ADMIN" ? `<a href="#" id="sidebar-admin-link">Admin</a>` : ""}
      </nav>
      <div class="sidebar-dash-content" id="sidebar-dash-content">
        <div class="sidebar-dash-loading">Carregando...</div>
      </div>
      <div class="sidebar-dash-footer">
        <button id="sidebar-logout">Sair</button>
      </div>`;
        sidebar.querySelectorAll(".sidebar-dash-nav a[data-section]").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                const section = a.dataset.section;
                this.switchSection(section);
            });
        });
        document.getElementById("sidebar-admin-link")?.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.setItem("sd-reopen", "1");
            window.location.href = "/admin";
        });
        sidebar.querySelector(".sidebar-dash-close")?.addEventListener("click", () => this.close());
        document.getElementById("sidebar-logout")?.addEventListener("click", () => this.auth.logout());
        this.renderSection(this.currentSection);
        if (sessionStorage.getItem("sd-reopen")) {
            sessionStorage.removeItem("sd-reopen");
            setTimeout(() => this.open(), 100);
        }
    }
    toggle() {
        const sidebar = document.getElementById("dashboard-sidebar");
        const overlay = document.getElementById("dashboard-overlay");
        if (!sidebar) {
            this.init();
            setTimeout(() => this.open(), 50);
            return;
        }
        const isOpen = sidebar.classList.contains("open");
        if (isOpen)
            this.close();
        else
            this.open();
    }
    open() {
        document.getElementById("dashboard-sidebar")?.classList.add("open");
        document.getElementById("dashboard-overlay")?.classList.add("open");
        document.body.style.overflow = "hidden";
    }
    close() {
        document.getElementById("dashboard-sidebar")?.classList.remove("open");
        document.getElementById("dashboard-overlay")?.classList.remove("open");
        document.body.style.overflow = "";
    }
    switchSection(section) {
        this.currentSection = section;
        sessionStorage.setItem("sd-section", section);
        document.querySelectorAll(".sidebar-dash-nav a[data-section]").forEach(a => {
            a.classList.toggle("active", a.dataset.section === section);
        });
        this.renderSection(section);
    }
    async renderSection(section) {
        const content = document.getElementById("sidebar-dash-content");
        if (!content)
            return;
        content.innerHTML = `<div class="sidebar-dash-loading">Carregando...</div>`;
        const renderers = {
            "visao-geral": () => this.renderOverview(),
            "perfil": () => this.renderPerfil(),
            "eventos": () => this.renderEventos(),
            "avisos": () => this.renderAvisos(),
        };
        const render = renderers[section];
        if (render)
            content.innerHTML = await render();
        this.attachEvents();
    }
    attachEvents() {
        const content = document.getElementById("sidebar-dash-content");
        if (!content)
            return;
        content.querySelectorAll("[data-section]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                this.switchSection(el.dataset.section);
            });
        });
        content.querySelector("[data-cancel-id]")?.addEventListener("click", async (e) => {
            const btn = e.currentTarget;
            if (!confirm(`Cancelar inscrição em "${btn.dataset.cancelTitle}"?`))
                return;
            try {
                await this.api.post("/eventos/cancelar", { signupId: btn.dataset.cancelId });
                this.toast.show("Inscrição cancelada!");
                this.renderSection("eventos");
            }
            catch (err) {
                this.toast.show(err.message, "error");
            }
        });
        const perfilForm = document.getElementById("sd-perfil-form");
        if (perfilForm) {
            perfilForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    const data = {
                        name: document.getElementById("sd-pf-name").value,
                        position: document.getElementById("sd-pf-position").value || null,
                        bio: document.getElementById("sd-pf-bio").value || null,
                        phone: document.getElementById("sd-pf-phone").value || null,
                        emailUpdatesOptIn: document.getElementById("sd-pf-email-updates").checked,
                    };
                    await this.api.put("/auth/perfil", data);
                    this.toast.show("Perfil atualizado!");
                    this.auth.updateUser(data);
                    const user = this.auth.getUser();
                    const userName = document.getElementById("user-name");
                    if (userName)
                        userName.textContent = user.name;
                }
                catch (err) {
                    this.toast.show(err.message, "error");
                }
            });
        }
    }
    async renderOverview() {
        const user = this.auth.getUser();
        const [eventos, projetos] = await Promise.all([
            this.api.get("/eventos/user/inscricoes").catch(() => []),
            this.api.get("/projetos").catch(() => []),
        ]);
        const ativos = projetos.filter((p) => p.status === "IN_PROGRESS" && p.isPublic);
        return `
      <div class="sd-welcome">Bem-vindo, ${this.esc(user.name.split(" ")[0])}!</div>
      <div class="sd-stats">
        <div class="sd-stat">
          <span class="sd-stat-value">${eventos.length}</span>
          <span class="sd-stat-label">Eventos</span>
        </div>
        <div class="sd-stat">
          <span class="sd-stat-value">${ativos.length}</span>
          <span class="sd-stat-label">Projetos Ativos</span>
        </div>
      </div>
      <h4 class="sd-section-title">Proximos Eventos</h4>
      ${eventos.length === 0 ? `<p class="sd-empty">Nenhum evento inscrito.</p>` :
            eventos.slice(0, 3).map((i) => `
          <div class="sd-item">
            <div><div class="sd-item-title">${this.esc(i.event.title)}</div>
            <div class="sd-item-sub">${new Date(i.event.date).toLocaleDateString("pt-BR")}</div></div>
          </div>`).join("")}
      <a href="#" class="sd-link" data-section="eventos">Ver todos os eventos →</a>
    `;
    }
    async renderPerfil() {
        const me = await this.api.get("/auth/me").catch(() => null);
        const user = me || this.auth.getUser();
        return `
      <form id="sd-perfil-form">
        <div class="sd-field"><label>Nome</label><input type="text" id="sd-pf-name" value="${this.esc(user.name)}"></div>
        <div class="sd-field"><label>Email</label><input type="email" value="${this.esc(user.email)}" disabled></div>
        <div class="sd-field"><label>Cargo</label><input type="text" id="sd-pf-position" value="${this.esc(user.position || "")}" placeholder="Seu cargo"></div>
        <div class="sd-field"><label>Bio</label><textarea id="sd-pf-bio" placeholder="Fale sobre voce..." rows="3">${this.esc(user.bio || "")}</textarea></div>
        <div class="sd-field"><label>Telefone</label><input type="text" id="sd-pf-phone" value="${this.esc(user.phone || "")}" placeholder="(11) 99999-9999"></div>
        <div class="sd-field email-choice"><label class="email-choice__label" for="sd-pf-email-updates"><input type="checkbox" id="sd-pf-email-updates" ${user.emailUpdatesOptIn ? "checked" : ""}><span><strong>Receber novidades por email</strong><small>Projetos, eventos e notícias. Desmarque e salve para parar de receber.</small></span></label></div>
        <button type="submit" class="btn btn-primary btn-full">Salvar</button>
      </form>
    `;
    }
    async renderEventos() {
        try {
            const inscricoes = await this.api.get("/eventos/user/inscricoes");
            if (inscricoes.length === 0)
                return `<p class="sd-empty">Voce nao esta inscrito em nenhum evento.</p>`;
            return inscricoes.map((i) => `
        <div class="sd-item">
          <div>
            <div class="sd-item-title">${this.esc(i.event.title)}</div>
            <div class="sd-item-sub">${new Date(i.event.date).toLocaleDateString("pt-BR")}${i.event.location ? ` - ${this.esc(i.event.location)}` : ""}</div>
            <button class="btn btn-sm btn-danger" style="margin-top:.5rem;" data-cancel-id="${i.id}" data-cancel-title="${this.esc(i.event.title)}">Cancelar</button>
          </div>
        </div>`).join("");
        }
        catch {
            return `<p class="sd-empty">Erro ao carregar.</p>`;
        }
    }
    async renderAvisos() {
        try {
            const avisos = await this.api.get("/avisos");
            if (avisos.length === 0)
                return `<p class="sd-empty">Nenhum aviso.</p>`;
            return avisos.map((a) => `
        <div class="sd-item">
          <div>
            <div class="sd-item-title">${this.esc(a.title)}</div>
            <div class="sd-item-sub">${this.esc(a.author.name)} - ${new Date(a.createdAt).toLocaleDateString("pt-BR")}</div>
            <div class="sd-item-body">${this.esc(a.content)}</div>
          </div>
        </div>`).join("");
        }
        catch {
            return `<p class="sd-empty">Erro ao carregar.</p>`;
        }
    }
}
