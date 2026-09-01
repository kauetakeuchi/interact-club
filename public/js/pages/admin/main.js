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
    membros: "Cuide das pessoas que fazem o clube acontecer.",
    eventos: "Organize os próximos encontros e ações.",
    projetos: "Acompanhe as iniciativas que estão saindo do papel.",
    noticias: "Conte o que o clube vem fazendo.",
    avisos: "Compartilhe recados com todo mundo.",
    contatos: "Veja quem entrou em contato pelo site.",
};

const titles = { painel: "Painel", membros: "Membros", eventos: "Eventos", projetos: "Projetos", noticias: "Notícias", avisos: "Avisos", contatos: "Contatos" };

const firstName = user?.name?.trim().split(/\s+/)[0] || "Admin";

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

function todayLabel() {
    const formatted = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long", day: "2-digit", month: "long",
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function layout(title) {
    const links = [
        { h: "painel", l: "Painel" }, { h: "membros", l: "Membros" },
        { h: "eventos", l: "Eventos" }, { h: "projetos", l: "Projetos" },
        { h: "noticias", l: "Notícias" }, { h: "avisos", l: "Avisos" },
        { h: "contatos", l: "Contatos" },
    ];
    const isDashboard = section === "painel";
    return `<div class="layout-sidebar">
    <button class="admin-nav-overlay" aria-label="Fechar menu" onclick="toggleAdminNav(false)"></button>
    <aside class="sidebar sidebar-admin" id="admin-navigation">
      <div class="sidebar-brand">
        <a class="sidebar-logo" href="/admin?painel" aria-label="Ir para o painel">
          <span class="sidebar-logo-mark"><span>IC</span></span>
          <span class="sidebar-logo-copy">Interact <small>Sede do clube</small></span>
        </a>
        <button class="sidebar-close" onclick="toggleAdminNav(false)" aria-label="Fechar menu">✕</button>
      </div>
      <div class="sidebar-context">
        <span></span>
        <p>Organizar</p>
      </div>
      <nav class="sidebar-nav" aria-label="Administração do clube">
        ${links.map(l => `<a href="/admin?${l.h}" class="${section === l.h ? "active" : ""}" ${section === l.h ? 'aria-current="page"' : ""}>${secIcons[l.h]}<span>${l.l}</span></a>`).join("")}
        <div class="sidebar-divider"></div>
        <a href="/" class="sidebar-home-link">${icons.home}<span>Voltar ao site</span></a>
        <div class="sidebar-nav-spacer"></div>
        <div class="sidebar-user-inline">
          <div class="sidebar-user-avatar">${esc(user.name.charAt(0).toUpperCase())}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${esc(user.name)}</div>
            <div class="sidebar-user-role">Administração</div>
          </div>
          <button class="sidebar-user-logout" onclick="localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'" title="Sair da conta" aria-label="Sair da conta">${icons.logout}</button>
        </div>
      </nav>
    </aside>
    <main class="main-content">
      <div class="admin-mobile-bar">
        <button class="admin-menu-button" onclick="toggleAdminNav(true)" aria-label="Abrir menu" aria-controls="admin-navigation" aria-expanded="false"><span></span><span></span></button>
        <span class="admin-mobile-brand">Interact</span>
        <div class="sidebar-user-avatar">${esc(user.name.charAt(0).toUpperCase())}</div>
      </div>
      <div class="content-header">
        <div class="content-header-copy">
          <span class="content-eyebrow">${isDashboard ? todayLabel() : "Administração do clube"}</span>
          <h1>${isDashboard ? `${greeting()}, <em>${esc(firstName)}</em>.` : title}</h1>
          <p>${isDashboard ? "Aqui está o que está acontecendo no clube hoje." : secDesc[section] || ""}</p>
        </div>
        <div class="content-header-mark" aria-hidden="true">${secIcons[section] || icons.painel}</div>
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

window.toggleAdminNav = (open) => {
    document.body.classList.toggle("admin-nav-open", open);
    document.querySelector(".admin-menu-button")?.setAttribute("aria-expanded", String(open));
};

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.toggleAdminNav(false);
});
