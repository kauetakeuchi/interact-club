import { api } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { pageHero, encontreSection, bindFilters, encontreCard, letterPlaceholder, paragraphs } from "../lib/listing.js";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_GRADIENTS } from "../lib/constants.js";

const params = new URLSearchParams(location.search);
const detailId = params.get("id");
const statusLabels = PROJECT_STATUS_LABELS;
const statusGrad = PROJECT_STATUS_GRADIENTS;
document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    if (detailId) {
        await renderDetail(page);
        return;
    }
    await renderList(page);
});
const BADGE_COLORS = { PLANNING: "#6B7280", IN_PROGRESS: "#17458F" };

function projectCard(proj) {
    const cor = statusGrad[proj.status] || "#6b7280";
    const label = statusLabels[proj.status] || proj.status;
    const badgeColor = BADGE_COLORS[proj.status] || "#16A34A";
    const inicio = proj.startDate ? new Date(proj.startDate).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : "";
    const termino = proj.endDate ? new Date(proj.endDate).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }) : "—";
    return encontreCard({
        href: `/projetos?id=${encodeURIComponent(proj.id)}`,
        vars: `--cat-soft:${cor}22;--cat:${cor};--badge:${badgeColor}`,
        mediaHtml: proj.imageUrl
            ? `<img src="${esc(proj.imageUrl)}" alt="${esc(proj.title)}" loading="lazy" decoding="async">`
            : letterPlaceholder(proj.title.charAt(0).toUpperCase()),
        badgeHtml: esc(label),
        titleHtml: esc(proj.title),
        metaHtml: `${esc(label)} · ${esc(inicio)}`,
        dateHtml: `Término: ${termino}`,
    });
}

function renderGrid(list) {
    const countEl = document.getElementById("encontre-count");
    if (countEl) countEl.textContent = `${list.length} projetos encontrados`;
    const grid = document.getElementById("encontre-grid");
    if (!grid) return;
    grid.innerHTML = list.length
        ? list.map(projectCard).join("")
        : `<div class="list-empty">Nenhum projeto com esse filtro.</div>`;
}

async function renderList(page) {
    try {
        const data = await api.get("/projetos");
        const projects = data.filter((p) => p.isPublic).sort((a, b) => {
            const da = a.startDate ? new Date(a.startDate) : new Date(a.createdAt);
            const db = b.startDate ? new Date(b.startDate) : new Date(b.createdAt);
            return db - da;
        });
        page.innerHTML = pageHero({
            tag: "Nossas ações",
            titleHtml: "Nossos <span>Projetos</span>",
            text: "Conheça os projetos que transformam a comunidade com a energia dos jovens e a seriedade do Rotary.",
        }) + encontreSection({
            heading: "Encontre projetos",
            filtersId: "encontre-filters",
            filters: [
                { value: "all", label: "Todos" },
                { value: "PLANNING", label: "Planejamento" },
                { value: "IN_PROGRESS", label: "Em andamento" },
                { value: "COMPLETED", label: "Concluídos" },
            ],
            countId: "encontre-count",
            countText: `${projects.length} projetos encontrados`,
            gridId: "encontre-grid",
        });
        renderGrid(projects);
        bindFilters("encontre-filters", (f) => renderGrid(f === "all" ? projects : projects.filter((p) => p.status === f)));
    } catch {
        page.innerHTML = `<p>Erro ao carregar projetos.</p>`;
    }
}
async function renderDetail(page) {
    try {
        const p = await api.get(`/projetos/${encodeURIComponent(detailId)}`);
        const cor = statusGrad[p.status] || "#6b7280";
        const inicio = p.startDate ? new Date(p.startDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "—";
        const termino = p.endDate ? new Date(p.endDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "—";
        page.innerHTML = `
      <section class="hero"><div class="container"><a href="/projetos" class="detail-back">← Voltar para Projetos</a><h1>${esc(p.title)}</h1></div></section>
      <section class="section"><div class="container"><div class="event-sidebar"><div>${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.title)}" class="detail-cover">` : `<div class="detail-cover--empty" style="--cat-soft:${cor}22;--cat:${cor}44"></div>`}<div class="detail-body">${paragraphs(p.description)}</div></div>
      <div><div class="info-card info-card--sticky"><div class="info-card__head"><span class="info-card__label">Status</span><span class="info-card__value">${statusLabels[p.status] || p.status}</span></div>
      <div class="info-card__dates"><div><span>Início</span><span>${inicio}</span></div><div><span>Término</span><span>${termino}</span></div></div>
      <p class="info-card__note">${statusLabels[p.status] || p.status}</p></div></div></div></div></section>`;
    }
    catch {
        page.innerHTML = `<p>Projeto não encontrado.</p>`;
    }
}