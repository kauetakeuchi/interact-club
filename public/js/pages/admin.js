import { api, auth, toast } from "../lib/index.js";
const _user = auth.getUser();
if (!_user || _user.role !== "ADMIN") {
    window.location.href = "/login";
    throw "not auth";
}
const user = _user;
const section = location.search.slice(1) || "painel";
const app = document.getElementById("app");
function esc(s) { return s.replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
const icons = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    painel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    membros: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    eventos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    projetos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    noticias: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>`,
    avisos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
    trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    filter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
};
const secIcons = {
    painel: icons.painel, membros: icons.membros, eventos: icons.eventos,
    projetos: icons.projetos, noticias: icons.noticias, avisos: icons.avisos,
};
const secDesc = {
    painel: "Visão geral do clube",
    membros: "Gerencie os membros do clube",
    eventos: "Crie e gerencie eventos",
    projetos: "Acompanhe os projetos do clube",
    noticias: "Publique notícias e atualizações",
    avisos: "Envie avisos aos membros",
};
function layout(title) {
    const links = [
        { h: "painel", l: "Painel" }, { h: "membros", l: "Membros" },
        { h: "eventos", l: "Eventos" }, { h: "projetos", l: "Projetos" },
        { h: "noticias", l: "Notícias" }, { h: "avisos", l: "Avisos" },
    ];
    return `<div class="layout-sidebar">
    <aside class="sidebar sidebar-admin">
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          Admin
        </div>
      </div>
      <nav class="sidebar-nav">
        ${links.map(l => `<a href="/admin?${l.h}" class="${section === l.h ? "active" : ""}">${secIcons[l.h]}<span>${l.l}</span></a>`).join("")}
        <div class="sidebar-divider"></div>
        <a href="/" class="sidebar-home-link">${icons.home}<span>Ver Site</span></a>
        <div class="sidebar-nav-spacer"></div>
        <div class="sidebar-user-inline">
          <div class="sidebar-user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">Administrador</div>
          </div>
          <button class="sidebar-user-logout" onclick="localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'" title="Sair">${icons.logout}</button>
        </div>
      </nav>
    </aside>
    <main class="main-content">
      <div class="content-header">
        <div>
          <div class="content-header-icon">${secIcons[section] || icons.painel}</div>
          <div>
            <h1>${title}</h1>
            <p>${secDesc[section] || ""}</p>
          </div>
        </div>
      </div>
      <div id="section-content"></div>
    </main>
  </div>`;
}
document.addEventListener("DOMContentLoaded", async () => {
    const titles = { painel: "Painel", membros: "Membros", eventos: "Eventos", projetos: "Projetos", noticias: "Notícias", avisos: "Avisos" };
    app.innerHTML = layout(titles[section] || "Admin");
    const c = document.getElementById("section-content");
    c.innerHTML = await (sections[section]?.() || sections["painel"]());
});
const sections = {
    painel: async () => {
        const s = await api.get("/admin/stats");
        const cards = [
            { l: "Membros", v: s.membros, cor: "#1D4ED8", icon: icons.membros },
            { l: "Eventos", v: s.eventos, cor: "#F59E0B", icon: icons.eventos },
            { l: "Projetos", v: s.projetos, cor: "#1D4ED8", icon: icons.projetos },
            { l: "Notícias", v: s.noticias, cor: "#FBBF24", icon: icons.noticias },
            { l: "Avisos", v: s.avisos, cor: "#D97706", icon: icons.avisos },
        ];
        const quickActions = [
            { label: "Novo Evento", cor: "#F59E0B", onClick: "mostrarFormEvento()" },
            { label: "Novo Projeto", cor: "#1D4ED8", onClick: "mostrarFormProjeto()" },
            { label: "Nova Notícia", cor: "#FBBF24", onClick: "mostrarFormNoticia()" },
            { label: "Novo Aviso", cor: "#D97706", onClick: "mostrarFormAviso()" },
        ];
        let extraHtml = "";
        try {
            const [eventos, noticias] = await Promise.all([
                api.get("/admin/eventos"),
                api.get("/admin/noticias"),
            ]);
            const proxEventos = eventos
                .filter((e) => new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3);
            const recents = [
                ...eventos.slice(0, 3).map((e) => ({ tipo: "evento", titulo: e.title, data: e.date, url: `/eventos?id=${e.id}` })),
                ...noticias.slice(0, 3).map((n) => ({ tipo: "noticia", titulo: n.title, data: n.createdAt, url: `/noticias?slug=${n.slug}` })),
            ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
            extraHtml = `
      ${recents.length ? `<div class="dashboard-section">
        <div class="dashboard-section-title">Atividades Recentes</div>
        <div class="recent-list">
          ${recents.map(r => `<a href="${r.url}" target="_blank" class="recent-item">
            <div class="recent-item-icon ${r.tipo}">${r.tipo === "evento" ? icons.eventos : icons.noticias}</div>
            <div class="recent-item-content">
              <div class="recent-item-title">${r.titulo}</div>
              <div class="recent-item-date">${new Date(r.data).toLocaleDateString("pt-BR")} &middot; ${r.tipo === "evento" ? "Evento" : "Notícia"}</div>
            </div>
            ${icons.eye}
          </a>`).join("")}
        </div>
      </div>` : ""}

      ${proxEventos.length ? `<div class="dashboard-section" style="animation:fadeUp .4s ease .8s both;">
          <div class="dashboard-section-title">Próximos Eventos</div>
          <div class="recent-list">
            ${proxEventos.map((e) => `<a href="/eventos?id=${e.id}" target="_blank" class="recent-item">
              <div class="recent-item-icon evento">${icons.eventos}</div>
              <div class="recent-item-content">
                <div class="recent-item-title">${e.title}</div>
                <div class="recent-item-date">${new Date(e.date).toLocaleDateString("pt-BR")} &middot; ${new Date(e.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              ${icons.eye}
            </a>`).join("")}
          </div>
        </div>` : ""}`;
        }
        catch { }
        return `<div class="stats-grid">
      ${cards.map((x, i) => `<div class="stat-card" style="animation:fadeUp .4s ease ${i * .1}s both;--stat-cor:${x.cor};">
        <div class="stat-card-icon">${x.icon}</div>
        <div>
          <div class="stat-value">${x.v}</div>
          <div class="stat-label">${x.l}</div>
        </div>
      </div>`).join("")}
    </div>
    <div class="dashboard-section" style="animation:fadeUp .4s ease .6s both;">
      <div class="dashboard-section-title">Ações Rápidas</div>
      <div class="quick-actions">
        ${quickActions.map(a => `<button class="quick-action-btn" style="--accent:${a.cor};" onclick="${a.onClick}">${icons.plus}<span>${a.label}</span></button>`).join("")}
      </div>
    </div>
    ${extraHtml}`;
    },
    membros: async () => {
        const m = await api.get("/membros");
        const active = m.filter(u => u.status === "ACTIVE").length;
        const admins = m.filter(u => u.role === "ADMIN").length;
        const roleLabel = { MEMBER: "Membro", DIRECTOR: "Diretor", ADMIN: "Admin" };
        const statusLabel = { ACTIVE: "Ativo", PENDING: "Pendente", INACTIVE: "Inativo" };
        return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${m.length} total</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${active} ativos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${admins} admins</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar membros..." onkeyup="filtrarTabela(this)">${icons.search}</div>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-membros"><thead><tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Função</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${m.map(u => `<tr>
        <td><div class="cell-name"><div class="cell-avatar">${u.name.charAt(0).toUpperCase()}</div>${u.name}</div></td>
        <td><span class="cell-email">${u.email}</span></td>
        <td>${u.position || '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge badge-${u.role === "ADMIN" ? "red" : u.role === "DIRECTOR" ? "blue" : "gray"}">${roleLabel[u.role] || u.role}</span></td>
        <td><span class="status-dot status-${u.status === "ACTIVE" ? "green" : u.status === "PENDING" ? "amber" : "gray"}"></span><span class="status-label">${statusLabel[u.status] || u.status}</span></td>
        <td class="td-actions">
          <button class="btn-icon" onclick="editarMembro('${u.id}','${esc(u.name)}','${esc(u.email)}','${esc(u.position || "")}','${u.role}','${u.status}')" title="Editar">${icons.edit}</button>
          ${u.role !== "ADMIN" ? `<button class="btn-icon btn-icon-danger" onclick="excluirMembro('${u.id}')" title="Excluir">${icons.trash}</button>` : ""}
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
    },
    eventos: async () => {
        const e = await api.get("/admin/eventos");
        const totalInscritos = e.reduce((sum, x) => sum + (x.signupCount || 0), 0);
        return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${e.length} eventos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${totalInscritos} inscrições</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar eventos..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormEvento()">${icons.plus} Novo Evento</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-eventos"><thead><tr><th>Título</th><th>Data</th><th>Local</th><th>Inscritos</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${e.map((x) => `<tr>
        <td>${x.title}</td>
        <td><div class="cell-date">${new Date(x.date).toLocaleDateString("pt-BR")}</div><div class="cell-time">${new Date(x.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div></td>
        <td>${x.location || '<span class="cell-empty">—</span>'}</td>
        <td><div class="signup-cell">${x.maxParticipants ? `<div class="signup-bar"><div class="signup-fill" style="width:${Math.min(100, (x.signupCount / x.maxParticipants) * 100)}%"></div></div><span class="signup-text">${x.signupCount}/${x.maxParticipants}</span>` : `<span class="signup-text">${x.signupCount} inscritos</span>`}</div></td>
        <td><span class="badge ${x.isPublic ? "badge-green" : "badge-gray"}">${x.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/eventos?id=${x.id}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarEvento('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirEvento('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
    },
    projetos: async () => {
        const p = await api.get("/admin/projetos");
        const statusLabel = { PLANNING: "Planejamento", IN_PROGRESS: "Em Andamento", COMPLETED: "Concluído" };
        const statusClass = { PLANNING: "amber", IN_PROGRESS: "blue", COMPLETED: "green" };
        const emAndamento = p.filter((x) => x.status === "IN_PROGRESS").length;
        return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${p.length} projetos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${emAndamento} em andamento</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar projetos..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormProjeto()">${icons.plus} Novo Projeto</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-projetos"><thead><tr><th>Título</th><th>Status</th><th>Início</th><th>Término</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${p.map((x) => `<tr>
        <td>${x.title}</td>
        <td><span class="status-dot status-${statusClass[x.status]}"></span><span class="status-label">${statusLabel[x.status] || x.status}</span></td>
        <td>${x.startDate ? `<div class="cell-date">${new Date(x.startDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td>${x.endDate ? `<div class="cell-date">${new Date(x.endDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge ${x.isPublic ? "badge-green" : "badge-gray"}">${x.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/projetos?id=${x.id}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarProjeto('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirProjeto('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
    },
    noticias: async () => {
        const n = await api.get("/admin/noticias");
        const pub = n.filter((x) => x.published).length;
        const cats = { Projetos: "#1D4ED8", Eventos: "#F59E0B", Clube: "#1D4ED8", Campanhas: "#D97706", Parcerias: "#60A5FA" };
        return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${n.length} notícias</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${pub} publicadas</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar notícias..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormNoticia()">${icons.plus} Nova Notícia</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-noticias"><thead><tr><th>Título</th><th>Categoria</th><th>Autor</th><th>Data</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${n.map((x) => `<tr>
        <td>${x.title}</td>
        <td>${x.category ? `<span class="cat-badge" style="--cat-cor:${cats[x.category] || "#666"}">${x.category}</span>` : '<span class="cell-empty">—</span>'}</td>
        <td>${x.author?.name || "—"}</td>
        <td><div class="cell-date">${new Date(x.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td><span class="pub-indicator ${x.published ? "pub-yes" : "pub-no"}"></span><span>${x.published ? "Publicado" : "Rascunho"}</span></td>
        <td class="td-actions">
          <a href="/noticias?slug=${x.slug}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarNoticia('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirNoticia('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
    },
    avisos: async () => {
        const a = await api.get("/admin/avisos");
        return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${a.length} avisos</span>
      </div>
      <div class="section-bar-actions">
        <button class="btn btn-secondary" onclick="mostrarFormAviso()">${icons.plus} Novo Aviso</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-avisos"><thead><tr><th>Título</th><th>Conteúdo</th><th>Autor</th><th>Data</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${a.map((x) => `<tr>
        <td>${x.title}</td>
        <td><div class="cell-preview">${x.content}</div></td>
        <td>${x.author?.name || "—"}</td>
        <td><div class="cell-date">${new Date(x.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td class="td-actions">
          <button class="btn-icon btn-icon-edit" onclick="editarAviso('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirAviso('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
    },
};
// --- Table filter ---
window.filtrarTabela = (input) => {
    const q = input.value.toLowerCase();
    const table = input.closest(".section-bar")?.nextElementSibling?.querySelector("table");
    if (!table)
        return;
    table.querySelectorAll("tbody tr").forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
};
// --- CRUD Helpers ---
window.editarMembro = async (id, name, email, position, role, status) => {
    document.getElementById("modal")?.remove();
    modalForm("Editar Membro", `
    <div class="form-row"><div class="form-group"><label>Nome</label><input type="text" id="f-mem-name" class="form-control" value="${esc(name)}"></div>
    <div class="form-group"><label>Email</label><input type="email" id="f-mem-email" class="form-control" value="${esc(email)}"></div></div>
    <div class="form-group"><label>Cargo</label><input type="text" id="f-mem-pos" class="form-control" value="${esc(position)}" placeholder="Ex: Presidente, Tesoureiro..."></div>
    <div class="form-row">
      <div class="form-group"><label>Função</label><select id="f-mem-role" class="form-control"><option value="MEMBER" ${role === "MEMBER" ? "selected" : ""}>Membro</option><option value="DIRECTOR" ${role === "DIRECTOR" ? "selected" : ""}>Diretor</option><option value="ADMIN" ${role === "ADMIN" ? "selected" : ""}>Admin</option></select></div>
      <div class="form-group"><label>Status</label><select id="f-mem-status" class="form-control"><option value="ACTIVE" ${status === "ACTIVE" ? "selected" : ""}>Ativo</option><option value="PENDING" ${status === "PENDING" ? "selected" : ""}>Pendente</option><option value="INACTIVE" ${status === "INACTIVE" ? "selected" : ""}>Inativo</option></select></div>
    </div>
    <button type="submit" class="btn btn-primary btn-full">Salvar</button>`, "return salvarEdicaoMembro(event, '" + id + "')");
};
window.salvarEdicaoMembro = async (e, id) => {
    e.preventDefault();
    const data = {};
    const name = document.getElementById("f-mem-name").value;
    const email = document.getElementById("f-mem-email").value;
    const position = document.getElementById("f-mem-pos").value;
    const role = document.getElementById("f-mem-role").value;
    const status = document.getElementById("f-mem-status").value;
    if (name)
        data.name = name;
    if (email)
        data.email = email;
    if (position)
        data.position = position;
    data.role = role;
    data.status = status;
    try {
        await api.put(`/membros/${id}`, data);
        toast.show("Membro atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.excluirMembro = async (id) => {
    if (!confirm("Excluir membro?"))
        return;
    try {
        await api.del(`/membros/${id}`);
        toast.show("Membro excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.excluirEvento = async (id) => {
    if (!confirm("Excluir evento?"))
        return;
    try {
        await api.del(`/admin/eventos/${id}`);
        toast.show("Evento excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.excluirProjeto = async (id) => {
    if (!confirm("Excluir projeto?"))
        return;
    try {
        await api.del(`/admin/projetos/${id}`);
        toast.show("Projeto excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.excluirNoticia = async (id) => {
    if (!confirm("Excluir notícia?"))
        return;
    try {
        await api.del(`/admin/noticias/${id}`);
        toast.show("Notícia excluída!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.excluirAviso = async (id) => {
    if (!confirm("Excluir aviso?"))
        return;
    try {
        await api.del(`/admin/avisos/${id}`);
        toast.show("Aviso excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.handleImageUpload = async (e, inputId, areaId) => {
    const file = e.target.files?.[0];
    if (!file)
        return;
    const fd = new FormData();
    fd.append("file", file);
    try {
        const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("token") }, body: fd });
        const data = await res.json();
        if (data.url) {
            document.getElementById(inputId).value = data.url;
            const area = document.getElementById(areaId);
            if (area)
                area.innerHTML = `<img src="${data.url}" style="max-height:12rem;margin:0 auto;">`;
        }
    }
    catch {
        toast.show("Erro ao fazer upload", "error");
    }
};
window.editarEvento = async (id) => {
    try {
        const e = await api.get(`/admin/eventos/${id}`);
        document.getElementById("modal")?.remove();
        modalForm("Editar Evento", `
      <div class="form-group"><label>Título</label><input type="text" id="f-ev-title" class="form-control" value="${esc(e.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Data</label><input type="datetime-local" id="f-ev-date" class="form-control" value="${new Date(e.date).toISOString().slice(0, 16)}" required></div>
        <div class="form-group"><label>Local</label><input type="text" id="f-ev-location" class="form-control" value="${esc(e.location || "")}" placeholder="Local"></div>
      </div>
      <div class="form-group"><label>Vagas máximas</label><input type="number" id="f-ev-max" class="form-control" value="${e.maxParticipants || ""}" min="0" placeholder="0 = ilimitado"></div>
      <div class="form-group"><label>Descrição</label><textarea id="f-ev-desc" class="form-control" required rows="4">${esc(e.description)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="ev-edit-img-area" onclick="document.getElementById('f-ev-edit-img-file').click()">${e.imageUrl ? `<img src="${e.imageUrl}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-ev-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-ev-edit-img','ev-edit-img-area')"><input type="hidden" id="f-ev-edit-img" value="${esc(e.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-ev-public" ${e.isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoEvento(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.salvarEdicaoEvento = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-ev-title").value,
        date: document.getElementById("f-ev-date").value,
        location: document.getElementById("f-ev-location").value,
        maxParticipants: parseInt(document.getElementById("f-ev-max").value) || null,
        isPublic: document.getElementById("f-ev-public").checked,
        description: document.getElementById("f-ev-desc").value,
        imageUrl: document.getElementById("f-ev-edit-img").value || null,
    };
    try {
        await api.put(`/admin/eventos/${id}`, data);
        toast.show("Evento atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.editarProjeto = async (id) => {
    try {
        const p = await api.get(`/admin/projetos/${id}`);
        document.getElementById("modal")?.remove();
        modalForm("Editar Projeto", `
      <div class="form-group"><label>Título</label><input type="text" id="f-pr-title" class="form-control" value="${esc(p.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Início</label><input type="date" id="f-pr-start" class="form-control" value="${p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : ""}"></div>
        <div class="form-group"><label>Término</label><input type="date" id="f-pr-end" class="form-control" value="${p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ""}"></div>
      </div>
      <div class="form-group"><label>Status</label><select id="f-pr-status" class="form-control"><option value="PLANNING" ${p.status === "PLANNING" ? "selected" : ""}>Planejamento</option><option value="IN_PROGRESS" ${p.status === "IN_PROGRESS" ? "selected" : ""}>Em Andamento</option><option value="COMPLETED" ${p.status === "COMPLETED" ? "selected" : ""}>Concluído</option></select></div>
      <div class="form-group"><label>Descrição</label><textarea id="f-pr-desc" class="form-control" required rows="4">${esc(p.description)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="pr-edit-img-area" onclick="document.getElementById('f-pr-edit-img-file').click()">${p.imageUrl ? `<img src="${p.imageUrl}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-pr-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-pr-edit-img','pr-edit-img-area')"><input type="hidden" id="f-pr-edit-img" value="${esc(p.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-pr-public" ${p.isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoProjeto(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.salvarEdicaoProjeto = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-pr-title").value,
        startDate: document.getElementById("f-pr-start").value || null,
        endDate: document.getElementById("f-pr-end").value || null,
        status: document.getElementById("f-pr-status").value,
        isPublic: document.getElementById("f-pr-public").checked,
        description: document.getElementById("f-pr-desc").value,
        imageUrl: document.getElementById("f-pr-edit-img").value || null,
    };
    try {
        await api.put(`/admin/projetos/${id}`, data);
        toast.show("Projeto atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.editarNoticia = async (id) => {
    try {
        const n = await api.get(`/admin/noticias/${id}`);
        document.getElementById("modal")?.remove();
        modalForm("Editar Notícia", `
      <div class="form-group"><label>Título</label><input type="text" id="f-no-title" class="form-control" value="${esc(n.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Slug</label><input type="text" id="f-no-slug" class="form-control" value="${esc(n.slug)}" required placeholder="meu-slug"></div>
        <div class="form-group"><label>Categoria</label><select id="f-no-cat" class="form-control"><option value="">Geral</option><option ${n.category === "Projetos" ? "selected" : ""}>Projetos</option><option ${n.category === "Eventos" ? "selected" : ""}>Eventos</option><option ${n.category === "Clube" ? "selected" : ""}>Clube</option><option ${n.category === "Campanhas" ? "selected" : ""}>Campanhas</option><option ${n.category === "Parcerias" ? "selected" : ""}>Parcerias</option></select></div>
      </div>
      <div class="form-group"><label>Resumo</label><textarea id="f-no-excerpt" class="form-control" rows="2">${esc(n.excerpt || "")}</textarea></div>
      <div class="form-group"><label>Conteúdo</label><textarea id="f-no-content" class="form-control" required rows="6">${esc(n.content)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="no-edit-img-area" onclick="document.getElementById('f-no-edit-img-file').click()">${n.imageUrl ? `<img src="${n.imageUrl}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-no-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-no-img','no-edit-img-area')"><input type="hidden" id="f-no-img" value="${esc(n.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-no-pub" ${n.published ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Publicar</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoNoticia(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.salvarEdicaoNoticia = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-no-title").value,
        slug: document.getElementById("f-no-slug").value,
        category: document.getElementById("f-no-cat").value || null,
        excerpt: document.getElementById("f-no-excerpt").value || null,
        content: document.getElementById("f-no-content").value,
        imageUrl: document.getElementById("f-no-img").value || null,
        published: document.getElementById("f-no-pub").checked,
    };
    try {
        await api.put(`/admin/noticias/${id}`, data);
        toast.show("Notícia atualizada!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.editarAviso = async (id) => {
    try {
        const a = await api.get(`/admin/avisos/${id}`);
        document.getElementById("modal")?.remove();
        modalForm("Editar Aviso", `
      <div class="form-group"><label>Título</label><input type="text" id="f-av-title" class="form-control" value="${esc(a.title)}" required></div>
      <div class="form-group"><label>Conteúdo</label><textarea id="f-av-content" class="form-control" required rows="6">${esc(a.content)}</textarea></div>
      <button type="submit" class="btn btn-primary btn-full">Salvar</button>`, "return salvarEdicaoAviso(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.salvarEdicaoAviso = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-av-title").value,
        content: document.getElementById("f-av-content").value,
    };
    try {
        await api.put(`/admin/avisos/${id}`, data);
        toast.show("Aviso atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
// --- Modal ---
function modalForm(title, html, onSubmit) {
    const m = document.createElement("div");
    m.className = "modal-overlay";
    m.id = "modal";
    m.innerHTML = `<div class="modal"><button class="close" onclick="this.closest('.modal-overlay').remove()">✕</button><h2>${title}</h2><form id="modal-form" onsubmit="${onSubmit}">${html}</form></div>`;
    document.body.appendChild(m);
    // focus first input
    setTimeout(() => m.querySelector("input,textarea,select")?.focus(), 100);
}
// --- Form creators ---
window.mostrarFormEvento = () => {
    modalForm("Novo Evento", `
    <div class="form-group"><label>Título</label><input type="text" id="f-ev-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input type="datetime-local" id="f-ev-date" class="form-control" required></div>
      <div class="form-group"><label>Local</label><input type="text" id="f-ev-location" class="form-control" placeholder="Local"></div>
    </div>
    <div class="form-group"><label>Vagas máximas</label><input type="number" id="f-ev-max" class="form-control" min="0" placeholder="0 = ilimitado"></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-ev-desc" class="form-control" required rows="4"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="ev-img-area" onclick="document.getElementById('f-ev-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-ev-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-ev-img','ev-img-area')"><input type="hidden" id="f-ev-img"></div>
    <label class="toggle"><input type="checkbox" id="f-ev-public" checked><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Evento</button>`, "return salvarEvento(event)");
};
window.salvarEvento = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-ev-title").value,
        date: document.getElementById("f-ev-date").value,
        location: document.getElementById("f-ev-location").value,
        maxParticipants: parseInt(document.getElementById("f-ev-max").value) || null,
        isPublic: document.getElementById("f-ev-public").checked,
        description: document.getElementById("f-ev-desc").value,
        imageUrl: document.getElementById("f-ev-img").value || null,
    };
    try {
        await api.post("/admin/eventos", data);
        toast.show("Evento criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.mostrarFormProjeto = () => {
    modalForm("Novo Projeto", `
    <div class="form-group"><label>Título</label><input type="text" id="f-pr-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Início</label><input type="date" id="f-pr-start" class="form-control"></div>
      <div class="form-group"><label>Término</label><input type="date" id="f-pr-end" class="form-control"></div>
    </div>
    <div class="form-group"><label>Status</label><select id="f-pr-status" class="form-control"><option value="PLANNING">Planejamento</option><option value="IN_PROGRESS">Em Andamento</option><option value="COMPLETED">Concluído</option></select></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-pr-desc" class="form-control" required rows="4"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="pr-img-area" onclick="document.getElementById('f-pr-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-pr-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-pr-img','pr-img-area')"><input type="hidden" id="f-pr-img"></div>
    <label class="toggle"><input type="checkbox" id="f-pr-public" checked><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Projeto</button>`, "return salvarProjeto(event)");
};
window.salvarProjeto = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-pr-title").value,
        startDate: document.getElementById("f-pr-start").value || null,
        endDate: document.getElementById("f-pr-end").value || null,
        status: document.getElementById("f-pr-status").value,
        isPublic: document.getElementById("f-pr-public").checked,
        description: document.getElementById("f-pr-desc").value,
        imageUrl: document.getElementById("f-pr-img").value || null,
    };
    try {
        await api.post("/admin/projetos", data);
        toast.show("Projeto criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.mostrarFormNoticia = () => {
    modalForm("Nova Notícia", `
    <div class="form-group"><label>Título</label><input type="text" id="f-no-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Slug</label><input type="text" id="f-no-slug" class="form-control" required placeholder="meu-slug"></div>
      <div class="form-group"><label>Categoria</label><select id="f-no-cat" class="form-control"><option value="">Geral</option><option>Projetos</option><option>Eventos</option><option>Clube</option><option>Campanhas</option><option>Parcerias</option></select></div>
    </div>
    <div class="form-group"><label>Resumo</label><textarea id="f-no-excerpt" class="form-control" rows="2"></textarea></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-no-content" class="form-control" required rows="6"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="no-img-area" onclick="document.getElementById('f-no-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-no-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-no-img','no-img-area')"><input type="hidden" id="f-no-img"></div>
    <label class="toggle"><input type="checkbox" id="f-no-pub"><div class="toggle-slider"></div><span class="toggle-label">Publicar</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Notícia</button>`, "return salvarNoticia(event)");
};
window.salvarNoticia = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-no-title").value,
        slug: document.getElementById("f-no-slug").value,
        category: document.getElementById("f-no-cat").value || null,
        excerpt: document.getElementById("f-no-excerpt").value || null,
        content: document.getElementById("f-no-content").value,
        imageUrl: document.getElementById("f-no-img").value || null,
        published: document.getElementById("f-no-pub").checked,
    };
    try {
        await api.post("/admin/noticias", data);
        toast.show("Notícia criada!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
window.mostrarFormAviso = () => {
    modalForm("Novo Aviso", `
    <div class="form-group"><label>Título</label><input type="text" id="f-av-title" class="form-control" required></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-av-content" class="form-control" required rows="6"></textarea></div>
    <button type="submit" class="btn btn-primary btn-full">Criar Aviso</button>`, "return salvarAviso(event)");
};
window.salvarAviso = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-av-title").value,
        content: document.getElementById("f-av-content").value,
    };
    try {
        await api.post("/admin/avisos", data);
        toast.show("Aviso criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
