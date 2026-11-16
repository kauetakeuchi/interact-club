import { api, auth, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";

const params = new URLSearchParams(location.search);
const detailId = params.get("id");
document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    if (detailId) {
        await renderDetail(page);
        return;
    }
    await renderList(page);
});
async function renderList(page) {
    try {
        const { futuros, passados } = await api.get("/eventos");
        const todos = [...futuros.map(e=>({...e, _tipo:"futuro"})), ...passados.map(e=>({...e, _tipo:"passado"}))];
        const renderGrid = (list) => {
            const countEl = document.getElementById("encontre-count-ev");
            if (countEl) countEl.textContent = `${list.length} eventos encontrados`;
            const grid = document.getElementById("encontre-grid-ev");
            if (!grid) return;
            if (list.length === 0) {
                grid.innerHTML = `<div class="list-empty">Nenhum evento com esse filtro.</div>`;
                return;
            }
            grid.innerHTML = list.map((e) => {
                const d = new Date(e.date);
                const dia = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
                const isPast = e._tipo === "passado";
                const vagasTxt = e.maxParticipants ? `${e.signupCount||0}/${e.maxParticipants} vagas` : "Vagas livres";
                const badgeColor = isPast ? "#6B7280" : e.maxParticipants && (e.signupCount||0) >= e.maxParticipants ? "#DC2626" : "#17458F";
                const badgeLabel = isPast ? "Realizado" : e.maxParticipants && (e.signupCount||0) >= e.maxParticipants ? "Lotado" : "Aberto";
                return `<a href="/eventos?id=${e.id}" class="encontre-card" style="${isPast ? "opacity:.85" : ""}">
                  <div class="encontre-card__media">${e.imageUrl ? `<img src="${esc(e.imageUrl)}" alt="${esc(e.title)}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#17458F22,#17458F88);display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-heading);font-weight:700;font-size:1.5rem;">${esc(e.title.charAt(0))}</div>`}<span class="encontre-card__badge" style="background:${badgeColor}">${badgeLabel}</span></div>
                  <div class="encontre-card__body">
                    <h3 class="encontre-card__title">${esc(e.title)}</h3>
                    <div class="encontre-card__meta">${e.location ? esc(e.location) + " · " : ""}${esc(dia)}</div>
                    <div class="encontre-card__date">Data: ${esc(d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</div>
                  </div>
                </a>`;
            }).join("");
        };
        page.innerHTML = `<section class="hero"><div class="container"><span class="tag">Agenda</span><h1>Próximos <span>Eventos</span></h1><p>Fique por dentro das atividades do clube e garanta sua vaga.</p></div></section><section class="section" style="padding: 5rem 0;"><div class="container">
          <div class="encontre-head">
            <h1>Encontre eventos</h1>
            <div class="encontre-filters" id="encontre-filters-ev">
              <button data-filter="all" class="encontre-filter encontre-filter--active">Todos</button>
              <button data-filter="futuro" class="encontre-filter">Próximos</button>
              <button data-filter="passado" class="encontre-filter">Realizados</button>
              <button data-filter="vagas" class="encontre-filter">Com vagas</button>
            </div>
          </div>
          <p class="encontre-count" id="encontre-count-ev">${todos.length} eventos encontrados</p>
          <div class="encontre-grid" id="encontre-grid-ev"></div>
        </div></section>`;
        renderGrid(todos);
        document.getElementById("encontre-filters-ev")?.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-filter]");
            if (!btn) return;
            document.querySelectorAll("#encontre-filters-ev .encontre-filter").forEach(b=>b.classList.remove("encontre-filter--active"));
            btn.classList.add("encontre-filter--active");
            const f = btn.dataset.filter;
            let filtered = todos;
            if (f === "futuro") filtered = todos.filter(x=>x._tipo==="futuro");
            else if (f === "passado") filtered = todos.filter(x=>x._tipo==="passado");
            else if (f === "vagas") filtered = todos.filter(x=>x._tipo==="futuro" && (!x.maxParticipants || (x.signupCount||0) < x.maxParticipants));
            renderGrid(filtered);
        });
    } catch (e) {
        page.innerHTML = `<p>Erro ao carregar eventos.</p>`;
    }
}
async function renderDetail(page) {
    try {
        const evento = await api.get(`/eventos/${detailId}`);
        const d = new Date(evento.date);
        const dateStr = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
        let signupId = null;
        if (auth.isAuthenticated()) {
            try {
                const inscricoes = await api.get("/eventos/user/inscricoes");
                const s = inscricoes.find((i) => i.eventId === detailId);
                if (s)
                    signupId = s.id;
            }
            catch { }
        }
        let count = evento.signupCount || 0;
        function renderCounts() {
            const infoCard = document.querySelector(".info-card");
            if (!infoCard)
                return;
            const countEl = infoCard.querySelector(".vagas-count");
            if (countEl)
                countEl.textContent = evento.maxParticipants ? `${count}/${evento.maxParticipants}` : `${count}`;
            const footerEl = infoCard.querySelector(".signup-footer");
            if (footerEl)
                footerEl.textContent = `${count} ${count === 1 ? "pessoa inscrita" : "pessoas inscritas"}`;
        }
        function renderAction() {
            const infoCard = document.querySelector(".info-card");
            if (!infoCard)
                return;
            const actionEl = infoCard.querySelector(".action-area");
            if (!actionEl)
                return;
            if (new Date(evento.date) < new Date()) {
                actionEl.innerHTML = `<div class="btn btn-full btn-state btn-state--past">Evento já realizado</div>`;
                return;
            }
            if (evento.maxParticipants && count >= evento.maxParticipants && !signupId) {
                actionEl.innerHTML = `<div class="btn btn-full btn-state btn-state--full">Evento lotado</div>`;
            }
            else if (signupId) {
                actionEl.innerHTML = `<button class="btn btn-full btn-cancel" id="cancel-btn">Cancelar Inscrição</button>`;
                document.getElementById("cancel-btn")?.addEventListener("click", async () => {
                    try {
                        await api.post("/eventos/cancelar", { signupId });
                        signupId = null;
                        count = Math.max(0, count - 1);
                        renderCounts();
                        renderAction();
                        toast.show("Inscrição cancelada!");
                    }
                    catch (err) {
                        toast.show(err.message, "error");
                    }
                });
            }
            else if (auth.isAuthenticated()) {
                actionEl.innerHTML = `<button class="btn btn-primary btn-full" id="signup-btn">Quero Participar</button>`;
                document.getElementById("signup-btn")?.addEventListener("click", async () => {
                    try {
                        await api.post("/eventos/inscrever", { eventId: detailId });
                        const inscricoes = await api.get("/eventos/user/inscricoes");
                        const s = inscricoes.find((i) => i.eventId === detailId);
                        if (s)
                            signupId = s.id;
                        count += 1;
                        renderCounts();
                        renderAction();
                        toast.show("Inscrição realizada!");
                    }
                    catch (err) {
                        toast.show(err.message, "error");
                    }
                });
            }
            else {
                actionEl.innerHTML = `<a href="/login" class="btn btn-primary btn-full">Faça login para participar</a>`;
            }
        }
        page.innerHTML = `
      <section class="hero"><div class="container"><a href="/eventos" class="detail-back">← Voltar para Eventos</a><h1>${esc(evento.title)}</h1><div class="detail-meta"><span>${dateStr}</span>${evento.location ? `<span>${esc(evento.location)}</span>` : ""}</div></div></section>
      <section class="section"><div class="container"><div class="event-sidebar"><div>${evento.imageUrl ? `<img src="${esc(evento.imageUrl)}" alt="${esc(evento.title)}" class="detail-cover">` : `<div class="detail-cover--empty" style="background:linear-gradient(135deg,#17458F22,#17458F44);"></div>`}<div class="detail-body">${evento.description.split("\n").filter((p) => p.trim()).map((p) => `<p>${esc(p)}</p>`).join("")}</div></div>
      <div><div class="info-card info-card--sticky"><div class="info-card__head"><span class="info-card__label">Vagas</span><span class="info-card__value vagas-count">${evento.maxParticipants ? `${evento.signupCount}/${evento.maxParticipants}` : evento.signupCount}</span></div>
      <div class="action-area"></div>
      <p class="info-card__note signup-footer">${evento.signupCount} ${evento.signupCount === 1 ? "pessoa inscrita" : "pessoas inscritas"}</p></div></div></div></div></section>`;
        renderAction();
    }
    catch {
        page.innerHTML = `<p>Evento não encontrado.</p>`;
    }
}
