import { api, auth, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { pageHero, encontreSection, bindFilters, encontreCard, letterPlaceholder, paragraphs } from "../lib/listing.js";

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
const EVENT_PLACEHOLDER_VARS = "--cat-soft:#17458F22;--cat:#17458F88";

function eventCard(e) {
    const d = new Date(e.date);
    const dia = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
    const isPast = e._tipo === "passado";
    const lotado = e.maxParticipants && (e.signupCount || 0) >= e.maxParticipants;
    const badgeColor = isPast ? "#6B7280" : lotado ? "#DC2626" : "#17458F";
    const badgeLabel = isPast ? "Realizado" : lotado ? "Lotado" : "Aberto";
    const dataCompleta = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return encontreCard({
        href: `/eventos?id=${encodeURIComponent(e.id)}`,
        extraClass: isPast ? "encontre-card--past" : "",
        vars: `${EVENT_PLACEHOLDER_VARS};--badge:${badgeColor}`,
        mediaHtml: e.imageUrl
            ? `<img src="${esc(e.imageUrl)}" alt="${esc(e.title)}" loading="lazy">`
            : letterPlaceholder(e.title.charAt(0)),
        badgeHtml: badgeLabel,
        titleHtml: esc(e.title),
        metaHtml: `${e.location ? esc(e.location) + " · " : ""}${esc(dia)}`,
        dateHtml: `Data: ${esc(dataCompleta)}`,
    });
}

function renderGrid(list) {
    const countEl = document.getElementById("encontre-count-ev");
    if (countEl) countEl.textContent = `${list.length} eventos encontrados`;
    const grid = document.getElementById("encontre-grid-ev");
    if (!grid) return;
    grid.innerHTML = list.length
        ? list.map(eventCard).join("")
        : `<div class="list-empty">Nenhum evento com esse filtro.</div>`;
}

async function renderList(page) {
    try {
        const { futuros, passados } = await api.get("/eventos");
        const todos = [...futuros.map((e) => ({ ...e, _tipo: "futuro" })), ...passados.map((e) => ({ ...e, _tipo: "passado" }))];
        page.innerHTML = pageHero({
            tag: "Agenda",
            titleHtml: "Próximos <span>Eventos</span>",
            text: "Fique por dentro das atividades do clube e garanta sua vaga.",
        }) + encontreSection({
            heading: "Encontre eventos",
            filtersId: "encontre-filters-ev",
            filters: [
                { value: "all", label: "Todos" },
                { value: "futuro", label: "Próximos" },
                { value: "passado", label: "Realizados" },
                { value: "vagas", label: "Com vagas" },
            ],
            countId: "encontre-count-ev",
            countText: `${todos.length} eventos encontrados`,
            gridId: "encontre-grid-ev",
        });
        renderGrid(todos);
        bindFilters("encontre-filters-ev", (f) => {
            let filtered = todos;
            if (f === "futuro") filtered = todos.filter((x) => x._tipo === "futuro");
            else if (f === "passado") filtered = todos.filter((x) => x._tipo === "passado");
            else if (f === "vagas") filtered = todos.filter((x) => x._tipo === "futuro" && (!x.maxParticipants || (x.signupCount || 0) < x.maxParticipants));
            renderGrid(filtered);
        });
    } catch {
        page.innerHTML = `<p>Erro ao carregar eventos.</p>`;
    }
}
async function renderDetail(page) {
    try {
        const evento = await api.get(`/eventos/${encodeURIComponent(detailId)}`);
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
            const userRole = auth.getUser()?.role;
            if (userRole === "ADMIN" || userRole === "DIRECTOR") {
                actionEl.innerHTML = ``;
                return;
            }
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
            else if (auth.isAuthenticated() && auth.getUser()?.role === "MEMBER") {
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
                actionEl.innerHTML = ``;
            }
        }
        page.innerHTML = `
      <section class="hero"><div class="container"><a href="/eventos" class="detail-back">← Voltar para Eventos</a><h1>${esc(evento.title)}</h1><div class="detail-meta"><span>${dateStr}</span>${evento.location ? `<span>${esc(evento.location)}</span>` : ""}</div></div></section>
      <section class="section"><div class="container"><div class="event-sidebar"><div>${evento.imageUrl ? `<img src="${esc(evento.imageUrl)}" alt="${esc(evento.title)}" class="detail-cover">` : `<div class="detail-cover--empty" style="--cat-soft:#17458F22;--cat:#17458F44"></div>`}<div class="detail-body">${paragraphs(evento.description)}</div></div>
      <div><div class="info-card info-card--sticky"><div class="info-card__head"><span class="info-card__label">Vagas</span><span class="info-card__value vagas-count">${evento.maxParticipants ? `${evento.signupCount}/${evento.maxParticipants}` : evento.signupCount}</span></div>
      <div class="action-area"></div>
      <p class="info-card__note signup-footer">${evento.signupCount} ${evento.signupCount === 1 ? "pessoa inscrita" : "pessoas inscritas"}</p></div></div></div></div></section>`;
        renderAction();
    }
    catch {
        page.innerHTML = `<p>Evento não encontrado.</p>`;
    }
}
