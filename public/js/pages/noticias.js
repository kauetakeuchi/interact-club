import { api } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { CATEGORY_COLORS } from "../lib/constants.js";

const params = new URLSearchParams(location.search);
const slug = params.get("slug");

const ARROW_LEFT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
const ARROW_LEFT_THIN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;

const HERO = `<section class="hero"><div class="container"><span class="tag">Comunicação</span><h1>Últimas <span>Notícias</span></h1><p>Fique por dentro das novidades, conquistas e ações do clube.</p></div></section>`;

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    if (slug) {
        await renderDetail(page);
        return;
    }
    await renderList(page);
});

/** Cor da categoria e a mesma cor quase transparente, usadas pelo CSS via variáveis. */
function categoryVars(category) {
    const cor = CATEGORY_COLORS[category] || "#6b7280";
    return { cor, style: `--cat:${cor};--cat-soft:${cor}14;--badge:${cor}` };
}

function formatShortDate(value) {
    return new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function formatLongDate(value) {
    return new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** "Por Fulano", ou nada quando a notícia não tem autor. */
function byline(n) {
    return n.author?.name ? `Por ${esc(n.author.name)}` : "";
}

function paragraphs(text, attrs = "") {
    return text.split("\n").filter((p) => p.trim()).map((p) => `<p${attrs}>${esc(p)}</p>`).join("");
}

// ---------- Lista ----------

function newsCard(n) {
    const { style } = categoryVars(n.category);
    const media = n.imageUrl
        ? `<img src="${esc(n.imageUrl)}" alt="${esc(n.title)}" loading="lazy">`
        : `<div class="encontre-card__placeholder">${esc((n.category || "N").charAt(0))}</div>`;
    const excerpt = n.excerpt ? `<p class="encontre-card__excerpt">${esc(n.excerpt)}</p>` : "";
    return `<a href="/noticias?slug=${encodeURIComponent(n.slug)}" class="encontre-card encontre-card--news" style="${style}">
      <div class="encontre-card__media">${media}<span class="encontre-card__badge">${esc(n.category || "Geral")}</span></div>
      <div class="encontre-card__body">
        <h3 class="encontre-card__title">${esc(n.title)}</h3>
        <div class="encontre-card__meta"><span>${esc(formatShortDate(n.createdAt))}</span>${n.author?.name ? `<span>·</span><span>${byline(n)}</span>` : ""}</div>
        ${excerpt}
      </div>
    </a>`;
}

function renderGrid(list) {
    const grid = document.getElementById("noticias-grid");
    const countEl = document.getElementById("noticias-count");
    if (countEl) countEl.textContent = `${list.length} matérias encontradas`;
    if (!grid) return;
    grid.innerHTML = list.length
        ? list.map(newsCard).join("")
        : `<div class="list-empty">Nenhuma matéria com esse filtro.</div>`;
}

async function renderList(page) {
    try {
        const noticias = await api.get("/noticias");
        if (!noticias.length) {
            page.innerHTML = `${HERO}<section class="section"><div class="container"><div class="empty-state"><h3>Nenhuma notícia encontrada</h3></div></div></section>`;
            return;
        }
        const categorias = [...new Set(noticias.map((n) => n.category).filter(Boolean))];
        const filtros = categorias.map((c) => `<button data-cat="${esc(c)}" class="encontre-filter">${esc(c)}</button>`).join("");
        page.innerHTML = `${HERO}
        <section class="section news-list-section"><div class="container">
          <div class="news-list-toolbar">
            <p id="noticias-count" class="news-list-count">${noticias.length} matérias encontradas</p>
            <div id="noticias-filters" class="news-list-filters">
              <button data-cat="all" class="encontre-filter encontre-filter--active">Todas</button>
              ${filtros}
            </div>
          </div>
          <div class="encontre-grid encontre-grid--3" id="noticias-grid"></div>
        </div></section>`;
        renderGrid(noticias);
        document.getElementById("noticias-filters")?.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-cat]");
            if (!btn) return;
            document.querySelectorAll("#noticias-filters .encontre-filter").forEach((b) => b.classList.remove("encontre-filter--active"));
            btn.classList.add("encontre-filter--active");
            const cat = btn.dataset.cat;
            renderGrid(cat === "all" ? noticias : noticias.filter((n) => n.category === cat));
        });
    } catch {
        page.innerHTML = `<p>Erro ao carregar notícias.</p>`;
    }
}

// ---------- Matéria ----------

function articleHero(n, date, style) {
    return `<section class="hero hero--compact" style="${style}"><div class="container">
      <a href="/noticias" class="hero-back">${ARROW_LEFT} Voltar para Notícias</a>
      <div class="news-article__badge-wrap"><span class="badge news-article__badge">${esc(n.category || "Geral")}</span></div>
      <h1 class="news-article__title">${esc(n.title)}</h1>
      <div class="news-article__meta"><span>${date}</span>${n.author?.name ? `<span>${byline(n)}</span>` : ""}</div>
    </div></section>`;
}

function articleBody(n, date, style) {
    const cover = n.imageUrl
        ? `<img src="${esc(n.imageUrl)}" alt="" class="news-article__cover">`
        : `<div class="news-article__cover--empty"></div>`;
    const excerpt = n.excerpt ? `<p class="news-article__excerpt">${esc(n.excerpt)}</p>` : "";
    return `<section class="section news-article-section" style="${style}"><div class="container news-article">
      ${cover}
      ${excerpt}
      <article class="prose news-article__content">${paragraphs(n.content)}</article>
      <div class="news-article__footer">
        <a href="/noticias" class="news-article__back">${ARROW_LEFT_THIN} Ver todas as notícias</a>
        <span class="news-article__date">${date}</span>
      </div>
    </div></section>`;
}

async function renderDetail(page) {
    try {
        const n = await api.get(`/noticias/${encodeURIComponent(slug)}`);
        const date = formatLongDate(n.createdAt);
        const { style } = categoryVars(n.category);
        page.innerHTML = articleHero(n, date, style) + articleBody(n, date, style);
    } catch {
        page.innerHTML = `<p>Notícia não encontrada.</p>`;
    }
}
