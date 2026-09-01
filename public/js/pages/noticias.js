import { api } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { CATEGORY_COLORS } from "../lib/constants.js";

const params = new URLSearchParams(location.search);
const slug = params.get("slug");
document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    if (slug) {
        await renderDetail(page);
        return;
    }
    await renderList(page);
});
async function renderList(page) {
    try {
        const noticias = await api.get("/noticias");
        if (!noticias.length) {
            page.innerHTML = `<section class="hero"><div class="container"><span class="tag">Comunicação</span><h1>Últimas <span>Notícias</span></h1><p>Fique por dentro das novidades, conquistas e ações do clube.</p></div></section><section class="section"><div class="container"><div class="empty-state"><h3>Nenhuma notícia encontrada</h3></div></div></section>`;
            return;
        }
        const cats = [...new Set(noticias.map(n=>n.category).filter(Boolean))];
        const fmt = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
        const renderGrid = (list) => {
            const grid = document.getElementById("noticias-grid");
            const countEl = document.getElementById("noticias-count");
            if (countEl) countEl.textContent = `${list.length} matérias encontradas`;
            if (!grid) return;
            if (!list.length) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-muted);">Nenhuma matéria com esse filtro.</div>`;
                return;
            }
            grid.innerHTML = list.map((n)=>{
                const cor = CATEGORY_COLORS[n.category] || "#6b7280";
                const date = fmt(n.createdAt);
                const media = n.imageUrl ? `<img src="${esc(n.imageUrl)}" alt="${esc(n.title)}" loading="lazy">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${cor}14,${cor});display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-heading);font-weight:700;font-size:1.75rem;">${esc((n.category||"N").charAt(0))}</div>`;
                return `<a href="/noticias?slug=${encodeURIComponent(n.slug)}" class="encontre-card">
                  <div class="encontre-card__media" style="aspect-ratio:16/10;">${media}<span class="encontre-card__badge" style="background:${cor}">${esc(n.category||"Geral")}</span></div>
                  <div class="encontre-card__body" style="padding: .9rem 1rem;">
                    <h3 class="encontre-card__title" style="font-size:.9375rem;min-height:2.6rem;">${esc(n.title)}</h3>
                    <div class="encontre-card__meta" style="margin-top:.35rem; display:flex; gap:.35rem; align-items:center; flex-wrap:wrap;"><span>${esc(date)}</span><span>·</span><span>Por ${esc(n.author?.name||"")}</span></div>
                    ${n.excerpt ? `<p style="font-size:.8125rem;line-height:1.5;color:var(--text-muted);margin:.5rem 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(n.excerpt)}</p>` : ""}
                  </div>
                </a>`;
            }).join("");
        };
        page.innerHTML = `<section class="hero"><div class="container"><span class="tag">Comunicação</span><h1>Últimas <span>Notícias</span></h1><p>Fique por dentro das novidades, conquistas e ações do clube.</p></div></section>
        <section class="section" style="background:#F9FAFB; padding: 2.5rem 0 4rem;"><div class="container">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;">
            <p id="noticias-count" style="font-size:.8125rem;color:var(--text-muted);margin:0;">${noticias.length} matérias encontradas</p>
            <div id="noticias-filters" style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <button data-cat="all" class="encontre-filter encontre-filter--active">Todas</button>
              ${cats.map(c=>`<button data-cat="${esc(c)}" class="encontre-filter">${esc(c)}</button>`).join("")}
            </div>
          </div>
          <div class="encontre-grid" id="noticias-grid" style="grid-template-columns: repeat(3, 1fr);"></div>
        </div></section>`;
        renderGrid(noticias);
        document.getElementById("noticias-filters")?.addEventListener("click", (e)=>{
            const btn = e.target.closest("button[data-cat]");
            if(!btn) return;
            document.querySelectorAll("#noticias-filters .encontre-filter").forEach(b=>b.classList.remove("encontre-filter--active"));
            btn.classList.add("encontre-filter--active");
            const cat = btn.dataset.cat;
            const filtered = cat==="all" ? noticias : noticias.filter(n=>n.category===cat);
            renderGrid(filtered);
        });
    } catch (e) {
        page.innerHTML = `<p>Erro ao carregar notícias.</p>`;
    }
}
async function renderDetail(page) {
    try {
        const n = await api.get(`/noticias/${slug}`);
        const date = new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
        const cor = CATEGORY_COLORS[n.category] || "#6b7280";
        page.innerHTML = `<section class="hero hero--compact"><div class="container"><a href="/noticias" class="hero-back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Voltar para Noticias</a><div style="margin-top:1.25rem;"><span class="badge" style="background:${cor};color:#fff;padding:.35rem .75rem;border-radius:100px;font-size:.6875rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${esc(n.category || "Geral")}</span></div><h1 style="margin-top:1rem;max-width:32rem;">${esc(n.title)}</h1><div style="display:flex;gap:1rem;margin-top:1rem;color:rgba(255,255,255,.7);font-size:.8125rem;"><span>${date}</span><span>Por ${esc(n.author.name)}</span></div></div></section>
    <section class="section" style="padding: 3rem 0 5rem;"><div class="container" style="max-width:42rem;">${n.imageUrl ? `<img src="${esc(n.imageUrl)}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;margin-bottom:2rem;box-shadow:0 8px 32px rgba(15,52,110,.08);">` : `<div style="aspect-ratio:16/9;background:linear-gradient(135deg,${cor}14,${cor});border-radius:16px;margin-bottom:2rem;"></div>`}${n.excerpt ? `<p style="font-size:1.0625rem;line-height:1.7;color:var(--text);font-style:italic;border-left:3px solid ${cor};padding-left:1.15rem;margin-bottom:2rem;background:#F9FAFB;padding:.9rem 1.15rem;border-radius:0 8px 8px 0;">${esc(n.excerpt)}</p>` : ""}<article class="prose" style="font-size:1rem;line-height:1.8;color:var(--text);">${n.content.split("\n").filter((p) => p.trim()).map((p) => `<p style="margin-bottom:1.25rem;">${esc(p)}</p>`).join("")}</article><div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:1rem;"><a href="/noticias" style="font-size:.875rem;font-weight:600;color:var(--primary);display:inline-flex;gap:.35rem;align-items:center;text-decoration:none;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Ver todas as noticias</a><span style="font-size:.75rem;color:var(--text-light);">${date}</span></div></div></section>`;
    } catch {
        page.innerHTML = `<p>Noticia nao encontrada.</p>`;
    }
}