import { auth } from "../../lib/index.js";
import { esc, bindTableSearch } from "./ui.js";
import { icons } from "./icons.js";
import { sections } from "./sections/index.js";

const STAFF_ROLES = new Set(["ADMIN", "DIRECTOR"]);

const sectionIcons = {
    painel: icons.painel,
    membros: icons.membros,
    eventos: icons.eventos,
    projetos: icons.projetos,
    noticias: icons.noticias,
    avisos: icons.avisos,
    contatos: icons.mail,
};

const sectionDescriptions = {
    painel: "Visão geral do clube",
    membros: "Cuide das pessoas que fazem o clube acontecer.",
    eventos: "Organize os próximos encontros e ações.",
    projetos: "Acompanhe as iniciativas que estão saindo do papel.",
    noticias: "Conte o que o clube vem fazendo.",
    avisos: "Compartilhe recados com todo mundo.",
    contatos: "Veja quem entrou em contato pelo site.",
};

const sectionTitles = {
    painel: "Painel",
    membros: "Membros",
    eventos: "Eventos",
    projetos: "Projetos",
    noticias: "Notícias",
    avisos: "Avisos",
    contatos: "Contatos",
};

const roleLabels = { ADMIN: "Administração", DIRECTOR: "Diretoria", MEMBER: "Membro" };

function requestedSection() {
    const params = new URLSearchParams(location.search);
    const firstKey = params.keys().next().value;
    const requested = (params.get("secao") || firstKey || "painel").toLowerCase();
    return Object.prototype.hasOwnProperty.call(sections, requested) ? requested : "painel";
}

const section = requestedSection();

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

function navLink(item, current, user) {
    if (item.adminOnly && user.role !== "ADMIN") return "";
    const active = current === item.id;
    return `<a href="/admin?secao=${item.id}" class="${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""}>${sectionIcons[item.id]}<span>${item.label}</span></a>`;
}

function layout(user) {
    const links = [
        { id: "painel", label: "Painel" },
        { id: "membros", label: "Membros", adminOnly: true },
        { id: "eventos", label: "Eventos" },
        { id: "projetos", label: "Projetos" },
        { id: "noticias", label: "Notícias" },
        { id: "avisos", label: "Avisos" },
        { id: "contatos", label: "Contatos" },
    ];
    const isDashboard = section === "painel";
    const firstName = user.name.trim().split(/\s+/)[0] || "olá";
    const initial = esc(user.name.charAt(0).toUpperCase());

    return `<div class="layout-sidebar">
    <button class="admin-nav-overlay" data-admin-nav-close aria-label="Fechar menu" tabindex="-1"></button>
    <aside class="sidebar sidebar-admin" id="admin-navigation">
      <div class="sidebar-brand">
        <a class="sidebar-logo" href="/admin?secao=painel" aria-label="Ir para o painel">
          <span class="sidebar-logo-mark"><span>IC</span></span>
          <span class="sidebar-logo-copy">Interact <small>Sede do clube</small></span>
        </a>
        <button class="sidebar-close" data-admin-nav-close aria-label="Fechar menu">✕</button>
      </div>
      <div class="sidebar-context">
        <span></span>
        <p>Organizar</p>
      </div>
      <nav class="sidebar-nav" aria-label="Administração do clube">
        ${links.map((item) => navLink(item, section, user)).join("")}
        <div class="sidebar-divider"></div>
        <a href="/" class="sidebar-home-link">${icons.home}<span>Voltar ao site</span></a>
        <div class="sidebar-nav-spacer"></div>
        <div class="sidebar-user-inline">
          <div class="sidebar-user-avatar">${initial}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${esc(user.name)}</div>
            <div class="sidebar-user-role">${roleLabels[user.role] || "Membro"}</div>
          </div>
          <button class="sidebar-user-logout" id="admin-logout" title="Sair da conta" aria-label="Sair da conta">${icons.logout}</button>
        </div>
      </nav>
    </aside>
    <main class="main-content">
      <div class="admin-mobile-bar">
        <button class="admin-menu-button" data-admin-nav-open aria-label="Abrir menu" aria-controls="admin-navigation" aria-expanded="false"><span></span><span></span></button>
        <span class="admin-mobile-brand">Interact</span>
        <div class="sidebar-user-avatar">${initial}</div>
      </div>
      <div class="content-header">
        <div class="content-header-copy">
          <span class="content-eyebrow">${isDashboard ? todayLabel() : "Administração do clube"}</span>
          <h1>${isDashboard ? `${greeting()}, <em>${esc(firstName)}</em>.` : sectionTitles[section]}</h1>
          <p>${isDashboard ? "Aqui está o que está acontecendo no clube hoje." : sectionDescriptions[section] || ""}</p>
        </div>
        <div class="content-header-mark" aria-hidden="true">${sectionIcons[section] || icons.painel}</div>
      </div>
      <div id="section-content" aria-live="polite"></div>
    </main>
  </div>`;
}

function setNavOpen(open) {
    document.body.classList.toggle("admin-nav-open", open);
    document.querySelector(".admin-menu-button")?.setAttribute("aria-expanded", String(open));
}

function bindChrome() {
    document.querySelector("[data-admin-nav-open]")?.addEventListener("click", () => setNavOpen(true));
    document.querySelectorAll("[data-admin-nav-close]").forEach((button) => {
        button.addEventListener("click", () => setNavOpen(false));
    });
    document.getElementById("admin-logout")?.addEventListener("click", () => auth.logout());
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setNavOpen(false);
    });
}

let content = null;

async function renderSection() {
    // Recria o contêiner para que listeners das ações não se acumulem a cada atualização.
    const previous = document.getElementById("section-content");
    const fresh = document.createElement("div");
    fresh.id = "section-content";
    fresh.setAttribute("aria-live", "polite");
    if (previous) previous.replaceWith(fresh);
    else document.querySelector(".main-content")?.appendChild(fresh);
    content = fresh;
    content.setAttribute("aria-busy", "true");
    content.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';

    try {
        content.innerHTML = await sections[section].render();
        bindTableSearch(content);
        sections[section].bind?.(content, { refresh: renderSection });
    } catch (err) {
        content.innerHTML = `<div class="empty-state">
          <h3>Não foi possível carregar esta área</h3>
          <p>${esc(err.message || "Tente novamente em instantes.")}</p>
          <button class="btn btn-secondary" id="section-retry">Tentar novamente</button>
        </div>`;
        document.getElementById("section-retry")?.addEventListener("click", renderSection);
    } finally {
        content.removeAttribute("aria-busy");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    window.addEventListener("auth:expired", () => location.replace("/login"));

    const user = await auth.refresh();
    if (!user) {
        location.replace("/login");
        return;
    }
    if (!STAFF_ROLES.has(user.role)) {
        location.replace("/");
        return;
    }
    if (section === "membros" && user.role !== "ADMIN") {
        location.replace("/admin?secao=painel");
        return;
    }

    document.getElementById("app").innerHTML = layout(user);
    bindChrome();
    await renderSection();
});
