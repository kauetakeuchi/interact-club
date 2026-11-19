// Peças comuns das páginas de listagem (eventos e projetos):
// topo da página, área "Encontre..." com filtros, card e textos em parágrafos.
// As cores que dependem dos dados vão como variáveis CSS (--cat, --cat-soft, --badge);
// o visual fica todo no CSS (06-projetos.css).

import { esc } from "./security.js";

/** Topo azul das páginas públicas. `titleHtml` já vem montado (pode ter <span>). */
export function pageHero({ tag, titleHtml, text }) {
    return `<section class="hero"><div class="container"><span class="tag">${tag}</span><h1>${titleHtml}</h1><p>${text}</p></div></section>`;
}

/**
 * Área "Encontre ..." com título, botões de filtro, contador e grade vazia.
 * `filters`: [{ value, label }]; o primeiro começa ativo.
 */
export function encontreSection({ heading, filtersId, filters, countId, countText, gridId }) {
    const buttons = filters
        .map((f, i) => `<button data-filter="${f.value}" class="encontre-filter${i === 0 ? " encontre-filter--active" : ""}">${f.label}</button>`)
        .join("\n              ");
    return `<section class="section section--roomy"><div class="container">
          <div class="encontre-head">
            <h1>${heading}</h1>
            <div class="encontre-filters" id="${filtersId}">
              ${buttons}
            </div>
          </div>
          <p class="encontre-count" id="${countId}">${countText}</p>
          <div class="encontre-grid" id="${gridId}"></div>
        </div></section>`;
}

/** Liga os botões de filtro: marca o ativo e chama `onChange(valor)`. */
export function bindFilters(filtersId, onChange) {
    const container = document.getElementById(filtersId);
    container?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-filter]");
        if (!btn) return;
        container.querySelectorAll(".encontre-filter").forEach((b) => b.classList.remove("encontre-filter--active"));
        btn.classList.add("encontre-filter--active");
        onChange(btn.dataset.filter);
    });
}

/** Quadrado colorido com a inicial, usado quando o item não tem imagem. */
export function letterPlaceholder(letter) {
    return `<div class="encontre-card__placeholder">${esc(letter)}</div>`;
}

/**
 * Card da grade. Campos com "Html" já devem vir escapados.
 * `vars`: variáveis de cor (ex.: "--cat:#17458F;--badge:#6B7280").
 */
export function encontreCard({ href, extraClass = "", vars, mediaHtml, badgeHtml, titleHtml, metaHtml, dateHtml }) {
    return `<a href="${href}" class="encontre-card${extraClass ? ` ${extraClass}` : ""}" style="${vars}">
                  <div class="encontre-card__media">${mediaHtml}<span class="encontre-card__badge">${badgeHtml}</span></div>
                  <div class="encontre-card__body">
                    <h3 class="encontre-card__title">${titleHtml}</h3>
                    <div class="encontre-card__meta">${metaHtml}</div>
                    <div class="encontre-card__date">${dateHtml}</div>
                  </div>
                </a>`;
}

/** Texto com quebras de linha vira parágrafos <p> escapados. */
export function paragraphs(text) {
    return text.split("\n").filter((p) => p.trim()).map((p) => `<p>${esc(p)}</p>`).join("");
}
