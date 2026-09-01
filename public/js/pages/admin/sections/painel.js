import { api } from "../../../lib/index.js";
import { esc } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const s = await api.get("/admin/stats");
    const cards = [
        { l: "Membros", v: s.membros, cor: "#17458F", icon: icons.membros },
        { l: "Eventos", v: s.eventos, cor: "#F59E0B", icon: icons.eventos },
        { l: "Projetos", v: s.projetos, cor: "#17458F", icon: icons.projetos },
        { l: "Notícias", v: s.noticias, cor: "#FBBF24", icon: icons.noticias },
        { l: "Avisos", v: s.avisos, cor: "#D97706", icon: icons.avisos },
    ];
    const quickActions = [
        { label: "Novo Evento", cor: "#F59E0B", onClick: "mostrarFormEvento()" },
        { label: "Novo Projeto", cor: "#17458F", onClick: "mostrarFormProjeto()" },
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
            ...noticias.slice(0, 3).map((n) => ({ tipo: "noticia", titulo: n.title, data: n.createdAt, url: `/noticias?slug=${encodeURIComponent(n.slug)}` })),
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
        extraHtml = `
      ${recents.length ? `<div class="dashboard-section">
        <div class="dashboard-section-title">Atividades Recentes</div>
        <div class="recent-list">
          ${recents.map(r => `<a href="${r.url}" target="_blank" class="recent-item">
            <div class="recent-item-icon ${r.tipo}">${r.tipo === "evento" ? icons.eventos : icons.noticias}</div>
            <div class="recent-item-content">
              <div class="recent-item-title">${esc(r.titulo)}</div>
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
                <div class="recent-item-title">${esc(e.title)}</div>
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
}
