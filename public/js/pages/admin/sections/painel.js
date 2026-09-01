import { api } from "../../../lib/index.js";
import { esc } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const s = await api.get("/admin/stats");
    const cards = [
        { l: "Membros", note: "pessoas no clube", v: s.membros, icon: icons.membros },
        { l: "Eventos", note: "na agenda", v: s.eventos, icon: icons.eventos },
        { l: "Projetos", note: "iniciativas", v: s.projetos, icon: icons.projetos },
        { l: "Notícias", note: "histórias publicadas", v: s.noticias, icon: icons.noticias },
        { l: "Avisos", note: "recados enviados", v: s.avisos, icon: icons.avisos },
    ];
    const quickActions = [
        { label: "Criar evento", detail: "Adicionar uma data à agenda", icon: icons.eventos, onClick: "mostrarFormEvento()" },
        { label: "Abrir projeto", detail: "Registrar uma nova iniciativa", icon: icons.projetos, onClick: "mostrarFormProjeto()" },
        { label: "Contar uma história", detail: "Publicar uma notícia do clube", icon: icons.noticias, onClick: "mostrarFormNoticia()" },
        { label: "Mandar um aviso", detail: "Compartilhar um recado rápido", icon: icons.avisos, onClick: "mostrarFormAviso()" },
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
            ...noticias.slice(0, 3).map((n) => ({ tipo: "noticia", titulo: n.title, data: n.createdAt, url: `/noticias?slug=${encodeURIComponent(n.slug)}` })),
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
        extraHtml = `<div class="dashboard-columns">
      ${recents.length ? `<section class="dashboard-section dashboard-list-section">
        <div class="dashboard-section-heading"><div><span>Movimento</span><h2>Atividade recente</h2></div></div>
        <div class="recent-list">
          ${recents.map(r => `<a href="${r.url}" target="_blank" class="recent-item">
            <div class="recent-item-icon ${r.tipo}">${r.tipo === "evento" ? icons.eventos : icons.noticias}</div>
            <div class="recent-item-content">
              <div class="recent-item-title">${esc(r.titulo)}</div>
              <div class="recent-item-date">${new Date(r.data).toLocaleDateString("pt-BR")} · ${r.tipo === "evento" ? "Evento" : "Notícia"}</div>
            </div>
            <span class="recent-item-arrow">↗</span>
          </a>`).join("")}
        </div>
      </section>` : ""}

      ${proxEventos.length ? `<section class="dashboard-section dashboard-list-section">
          <div class="dashboard-section-heading"><div><span>Na agenda</span><h2>Próximos encontros</h2></div><a href="/admin?eventos">Ver agenda</a></div>
          <div class="recent-list">
            ${proxEventos.map((e) => `<a href="/eventos?id=${e.id}" target="_blank" class="recent-item">
              <time class="event-date-tile"><strong>${new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit" })}</strong><span>${new Date(e.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></time>
              <div class="recent-item-content">
                <div class="recent-item-title">${esc(e.title)}</div>
                <div class="recent-item-date">${new Date(e.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${e.location ? ` · ${esc(e.location)}` : ""}</div>
              </div>
              <span class="recent-item-arrow">↗</span>
            </a>`).join("")}
          </div>
        </section>` : ""}</div>`;
    }
    catch { }
    return `<section class="club-overview" aria-labelledby="club-overview-title">
      <div class="dashboard-section-heading overview-heading">
        <div><span>Um olhar rápido</span><h2 id="club-overview-title">O clube em números</h2></div>
        <p>Dados atualizados agora</p>
      </div>
      <div class="stats-grid">
      ${cards.map((x, i) => `<a href="/admin?${["membros", "eventos", "projetos", "noticias", "avisos"][i]}" class="stat-card ${i === 0 ? "stat-card-main" : ""}" style="animation:fadeUp .4s ease ${i * .06}s both;">
        <div class="stat-card-icon">${x.icon}</div>
        <div class="stat-card-copy">
          <div class="stat-value">${x.v}</div>
          <div class="stat-label">${x.l}</div>
          <div class="stat-note">${x.note}</div>
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
        ${quickActions.map(a => `<button class="quick-action-btn" onclick="${a.onClick}"><span class="quick-action-icon">${a.icon}</span><span class="quick-action-copy"><strong>${a.label}</strong><small>${a.detail}</small></span><span class="quick-action-plus">${icons.plus}</span></button>`).join("")}
      </div>
    </section>
    ${extraHtml}`;
}
