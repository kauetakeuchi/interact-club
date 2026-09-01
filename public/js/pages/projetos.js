import { api } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_GRADIENTS } from "../lib/constants.js";

const params = new URLSearchParams(location.search);
const detailId = params.get("id");
const statusLabels = PROJECT_STATUS_LABELS;
const statusGrad = PROJECT_STATUS_GRADIENTS;
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}
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
        const data = await api.get("/projetos");
        const projects = data.filter((p) => p.isPublic).sort((a,b) => {
            const da = a.startDate ? new Date(a.startDate) : new Date(a.createdAt);
            const db = b.startDate ? new Date(b.startDate) : new Date(b.createdAt);
            return db - da;
        });
        const renderGrid = (list) => {
            const countEl = document.getElementById("encontre-count");
            if (countEl) countEl.textContent = `${list.length} projetos encontrados`;
            const grid = document.getElementById("encontre-grid");
            if (!grid) return;
            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-muted);">Nenhum projeto com esse filtro.</div>`;
                return;
            }
            grid.innerHTML = list.map((proj) => {
                const cor = statusGrad[proj.status] || "#6b7280";
                const label = statusLabels[proj.status] || proj.status;
                const media = proj.imageUrl
                    ? `<img src="${esc(proj.imageUrl)}" alt="${esc(proj.title)}" loading="lazy" decoding="async">`
                    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${cor}22,${cor});display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-heading);font-weight:700;font-size:1.5rem;">${esc(proj.title.charAt(0).toUpperCase())}</div>`;
                const date = proj.startDate ? new Date(proj.startDate).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : "";
                const badgeColor = proj.status === "PLANNING" ? "#6B7280" : proj.status === "IN_PROGRESS" ? "#17458F" : "#16A34A";
                return `<a href="/projetos?id=${proj.id}" class="encontre-card">
                  <div class="encontre-card__media">${media}<span class="encontre-card__badge" style="background:${badgeColor}">${esc(label)}</span></div>
                  <div class="encontre-card__body">
                    <h3 class="encontre-card__title">${esc(proj.title)}</h3>
                    <div class="encontre-card__meta">${esc(label)} · ${esc(date)}</div>
                    <div class="encontre-card__date">Término: ${proj.endDate ? new Date(proj.endDate).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }) : "—"}</div>
                  </div>
                </a>`;
            }).join("");
        };
        page.innerHTML = `<section class="hero"><div class="container"><span class="tag">Nossas acoes</span><h1>Nossos <span>Projetos</span></h1><p>Conheca os projetos que transformam a comunidade com a energia dos jovens e a seriedade do Rotary.</p></div></section><section class="section" style="padding: 5rem 0;"><div class="container">
          <div class="encontre-head">
            <h1>Encontre projetos</h1>
            <div class="encontre-filters" id="encontre-filters">
              <button data-filter="all" class="encontre-filter encontre-filter--active">Todos</button>
              <button data-filter="PLANNING" class="encontre-filter">Planejamento</button>
              <button data-filter="IN_PROGRESS" class="encontre-filter">Em andamento</button>
              <button data-filter="COMPLETED" class="encontre-filter">Concluidos</button>
            </div>
          </div>
          <p class="encontre-count" id="encontre-count">${projects.length} projetos encontrados</p>
          <div class="encontre-grid" id="encontre-grid"></div>
        </div></section>`;
        renderGrid(projects);
        document.getElementById("encontre-filters")?.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-filter]");
            if (!btn) return;
            document.querySelectorAll(".encontre-filter").forEach(b=>b.classList.remove("encontre-filter--active"));
            btn.classList.add("encontre-filter--active");
            const f = btn.dataset.filter;
            const filtered = f === "all" ? projects : projects.filter(p=>p.status===f);
            renderGrid(filtered);
        });
    } catch (e) {
        page.innerHTML = `<p>Erro ao carregar projetos.</p>`;
    }
}
async function renderDetail(page) {
    try {
        const p = await api.get(`/projetos/${detailId}`);
        const cor = statusGrad[p.status] || "#6b7280";
        const inicio = p.startDate ? new Date(p.startDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "—";
        const termino = p.endDate ? new Date(p.endDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "—";
        page.innerHTML = `
      <section class="hero"><div class="container"><a href="/projetos" style="display:inline-flex;align-items:center;gap:.5rem;color:rgba(255,255,255,.6);font-size:.875rem;margin-bottom:1.5rem;">← Voltar para Projetos</a><h1>${esc(p.title)}</h1></div></section>
      <section class="section"><div class="container"><div class="event-sidebar"><div>${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.title)}" style="width:100%;height:20rem;object-fit:cover;margin-bottom:2rem;">` : `<div style="height:20rem;background:linear-gradient(135deg,${cor}22,${cor}44);margin-bottom:2rem;"></div>`}<div style="line-height:1.8;color:var(--text);">${p.description.split("\n").filter((s) => s.trim()).map((s) => `<p style="margin-bottom:1rem;">${esc(s)}</p>`).join("")}</div></div>
      <div><div class="info-card" style="position:sticky;top:6rem;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><span style="font-size:.875rem;font-weight:500;color:var(--text);">Status</span><span style="font-size:1.5rem;font-family:var(--font-heading);color:var(--primary-dark);">${statusLabels[p.status] || p.status}</span></div>
      <div style="line-height:2;font-size:.875rem;color:var(--text);"><div style="display:flex;justify-content:space-between;"><span>Início</span><span>${inicio}</span></div><div style="display:flex;justify-content:space-between;"><span>Término</span><span>${termino}</span></div></div>
      <p style="font-size:.75rem;color:var(--text);text-align:center;margin-top:.75rem;">${statusLabels[p.status] || p.status}</p></div></div></div></div></section>`;
    }
    catch {
        page.innerHTML = `<p>Projeto não encontrado.</p>`;
    }
}