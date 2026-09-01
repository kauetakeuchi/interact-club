import { auth } from "../../lib/index.js";
import { esc } from "./ui.js";
import { icons } from "./icons.js";
import { sections } from "./sections/index.js";

const user = auth.getUser();
if (!user || user.role !== "ADMIN") {
    window.location.href = "/login";
}

const section = location.search.slice(1) || "painel";

const secIcons = {
    painel: icons.painel, membros: icons.membros, eventos: icons.eventos,
    projetos: icons.projetos, noticias: icons.noticias, avisos: icons.avisos,
    contatos: icons.mail,
};

const secDesc = {
    painel: "Visão geral do clube",
    membros: "Gerencie os membros do clube",
    eventos: "Crie e gerencie eventos",
    projetos: "Acompanhe os projetos do clube",
    noticias: "Publique notícias e atualizações",
    avisos: "Envie avisos aos membros",
    contatos: "Mensagens recebidas pelo site",
};

const titles = { painel: "Painel", membros: "Membros", eventos: "Eventos", projetos: "Projetos", noticias: "Notícias", avisos: "Avisos", contatos: "Contatos" };

function layout(title) {
    const links = [
        { h: "painel", l: "Painel" }, { h: "membros", l: "Membros" },
        { h: "eventos", l: "Eventos" }, { h: "projetos", l: "Projetos" },
        { h: "noticias", l: "Notícias" }, { h: "avisos", l: "Avisos" },
        { h: "contatos", l: "Contatos" },
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
          <div class="sidebar-user-avatar">${esc(user.name.charAt(0).toUpperCase())}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${esc(user.name)}</div>
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
    if (!user || user.role !== "ADMIN")
        return;
    const app = document.getElementById("app");
    app.innerHTML = layout(titles[section] || "Admin");
    const c = document.getElementById("section-content");
    c.innerHTML = await (sections[section]?.() || sections.painel());
});
