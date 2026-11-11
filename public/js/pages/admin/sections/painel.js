import { api, auth } from "../../../lib/index.js";
import { esc, bindActions } from "../ui.js";
import { icons } from "../icons.js";
import { openForm as novoEvento } from "./eventos.js";
import { openForm as novoProjeto } from "./projetos.js";
import { openForm as novaNoticia } from "./noticias.js";
import { openForm as novoAviso } from "./avisos.js";

export async function render() {
    const stats = await api.get("/admin/stats");
    const cards = [
        { label: "Membros", note: "pessoas no clube", value: stats.membros, icon: icons.membros, section: "membros" },
        { label: "Eventos", note: "na agenda", value: stats.eventos, icon: icons.eventos, section: "eventos" },
        { label: "Projetos", note: "iniciativas", value: stats.projetos, icon: icons.projetos, section: "projetos" },
        { label: "Notícias", note: "histórias publicadas", value: stats.noticias, icon: icons.noticias, section: "noticias" },
        { label: "Avisos", note: "recados enviados", value: stats.avisos, icon: icons.avisos, section: "avisos" },
    ];
    const quickActions = [
        { action: "novo-evento", label: "Criar evento", detail: "Adicionar uma data à agenda", icon: icons.eventos },
        { action: "novo-projeto", label: "Abrir projeto", detail: "Registrar uma nova iniciativa", icon: icons.projetos },
        { action: "nova-noticia", label: "Contar uma história", detail: "Publicar uma notícia do clube", icon: icons.noticias },
        { action: "novo-aviso", label: "Mandar um aviso", detail: "Compartilhar um recado rápido", icon: icons.avisos },
    ];
    const visibleCards = cards.filter((card) => card.section !== "membros" || auth.getUser()?.role === "ADMIN");

    let extraHtml = "";
    try {
        const [eventos, noticias] = await Promise.all([
            api.get("/admin/eventos"),
            api.get("/admin/noticias"),
        ]);
        const proximosEventos = eventos
            .filter((evento) => new Date(evento.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3);
        const recentes = [
            ...eventos.slice(0, 3).map((evento) => ({ tipo: "evento", titulo: evento.title, data: evento.date, url: `/eventos?id=${encodeURIComponent(evento.id)}` })),
            ...noticias.slice(0, 3).map((noticia) => ({ tipo: "noticia", titulo: noticia.title, data: noticia.createdAt, url: `/noticias?slug=${encodeURIComponent(noticia.slug)}` })),
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);

        extraHtml = `<div class="dashboard-columns">
      ${recentes.length ? `<section class="dashboard-section dashboard-list-section">
        <div class="dashboard-section-heading"><div><span>Movimento</span><h2>Atividade recente</h2></div></div>
        <div class="recent-list">
          ${recentes.map((item) => `<a href="${item.url}" target="_blank" rel="noopener" class="recent-item">
            <div class="recent-item-icon ${item.tipo}">${item.tipo === "evento" ? icons.eventos : icons.noticias}</div>
            <div class="recent-item-content">
              <div class="recent-item-title">${esc(item.titulo)}</div>
              <div class="recent-item-date">${new Date(item.data).toLocaleDateString("pt-BR")} · ${item.tipo === "evento" ? "Evento" : "Notícia"}</div>
            </div>
            <span class="recent-item-arrow">↗</span>
          </a>`).join("")}
        </div>
      </section>` : ""}

      ${proximosEventos.length ? `<section class="dashboard-section dashboard-list-section">
          <div class="dashboard-section-heading"><div><span>Na agenda</span><h2>Próximos encontros</h2></div><a href="/admin?secao=eventos">Ver agenda</a></div>
          <div class="recent-list">
            ${proximosEventos.map((evento) => `<a href="/eventos?id=${encodeURIComponent(evento.id)}" target="_blank" rel="noopener" class="recent-item">
              <time class="event-date-tile"><strong>${new Date(evento.date).toLocaleDateString("pt-BR", { day: "2-digit" })}</strong><span>${new Date(evento.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></time>
              <div class="recent-item-content">
                <div class="recent-item-title">${esc(evento.title)}</div>
                <div class="recent-item-date">${new Date(evento.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${evento.location ? ` · ${esc(evento.location)}` : ""}</div>
              </div>
              <span class="recent-item-arrow">↗</span>
            </a>`).join("")}
          </div>
        </section>` : ""}</div>`;
    } catch {
        // O painel continua útil mesmo se os widgets secundários falharem.
    }

    return `<section class="club-overview" aria-labelledby="club-overview-title">
      <div class="dashboard-section-heading overview-heading">
        <div><span>Um olhar rápido</span><h2 id="club-overview-title">O clube em números</h2></div>
        <p>Dados atualizados agora</p>
      </div>
      <div class="stats-grid">
      ${visibleCards.map((card, index) => `<a href="/admin?secao=${card.section}" class="stat-card ${index === 0 ? "stat-card-main" : ""}" style="animation:fadeUp .4s ease ${index * .06}s both;">
        <div class="stat-card-icon">${card.icon}</div>
        <div class="stat-card-copy">
          <div class="stat-value">${card.value}</div>
          <div class="stat-label">${card.label}</div>
          <div class="stat-note">${card.note}</div>
        </div>
        <span class="stat-arrow">↗</span>
      </a>`).join("")}
      </div>
    </section>
    <section class="dashboard-section quick-actions-section" style="animation:fadeUp .4s ease .38s both;">
      <div class="dashboard-section-heading">
        <div><span>Começar por aqui</span><h2>Ações rápidas</h2></div>
        <p>O que você quer colocar em movimento?</p>
      </div>
      <div class="quick-actions">
        ${quickActions.map((item) => `<button class="quick-action-btn" data-action="${item.action}"><span class="quick-action-icon">${item.icon}</span><span class="quick-action-copy"><strong>${item.label}</strong><small>${item.detail}</small></span><span class="quick-action-plus">${icons.plus}</span></button>`).join("")}
      </div>
    </section>
    ${extraHtml}`;
}

export function bind(root, { refresh }) {
    bindActions(root, {
        "novo-evento": () => novoEvento(refresh),
        "novo-projeto": () => novoProjeto(refresh),
        "nova-noticia": () => novaNoticia(refresh),
        "novo-aviso": () => novoAviso(refresh),
    });
}
