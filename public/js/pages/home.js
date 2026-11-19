import { api } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { CATEGORY_COLORS } from "../lib/constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    await Promise.all([initNewsCarousel(), initEventosHome(), renderProjects()]);
});

const ARROW_CIRCLE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg>`;

const NEWS_SKELETON = `<div class="news-edition">
  <article class="news-lead">
    <div class="skeleton skeleton-light skeleton--lead-media"></div>
    <div class="skeleton-pad">
      <div class="skeleton skeleton-light skeleton--line-tag"></div>
      <div class="skeleton skeleton-light skeleton--line-title"></div>
      <div class="skeleton skeleton-light skeleton--line-text"></div>
    </div>
  </article>
  <div class="news-stack">
    <div class="skeleton skeleton-light skeleton--stack-item"></div>
    <div class="skeleton skeleton-light skeleton--stack-item"></div>
    <div class="skeleton skeleton-light skeleton--stack-item"></div>
  </div>
</div>`;

function formatNewsDate(value) {
    return new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

/** Resumo da notícia: o excerpt, ou o começo do texto cortado em `max` caracteres. */
function newsSummary(n, max) {
    if (n.excerpt) return n.excerpt;
    const content = n.content || "";
    return content.slice(0, max) + (content.length > max ? "..." : "");
}

function newsLead(lead) {
    const href = `/noticias?slug=${encodeURIComponent(lead.slug)}`;
    const cor = CATEGORY_COLORS[lead.category] || "#17458F";
    const media = lead.imageUrl
        ? `<img src="${esc(lead.imageUrl)}" alt="${esc(lead.title)}" loading="lazy" decoding="async">`
        : `<div class="news-stack__thumb--placeholder news-lead__placeholder" style="--cat:${cor}">${esc((lead.category || "N").charAt(0))}</div>`;
    const badge = lead.category ? `<span class="news-lead__badge">${esc(lead.category)}</span>` : "";
    const author = lead.author?.name ? `<span> - Por ${esc(lead.author.name)}</span>` : "";
    return `<article class="news-lead"><a href="${href}" class="news-lead__media">${media}${badge}</a><div class="news-lead__body">`
        + `<div class="news-lead__meta"><span>${formatNewsDate(lead.createdAt)}</span>${author}</div>`
        + `<h3><a href="${href}">${esc(lead.title)}</a></h3>`
        + `<p>${esc(newsSummary(lead, 220))}</p>`
        + `<a href="${href}" class="news-lead__cta">Ler matéria <span aria-hidden="true">${ARROW_CIRCLE}</span></a>`
        + `</div></article>`;
}

function newsStackItem(n) {
    const href = `/noticias?slug=${encodeURIComponent(n.slug)}`;
    const cor = CATEGORY_COLORS[n.category] || "#6b7280";
    const media = n.imageUrl
        ? `<img src="${esc(n.imageUrl)}" alt="${esc(n.title)}">`
        : `<div class="news-stack__thumb--placeholder news-stack__placeholder" style="--cat:${cor}">${esc((n.category || "N").charAt(0))}</div>`;
    const badge = n.category ? `<span class="mini-badge" style="--cat:${cor}">${esc(n.category)}</span>` : "";
    return `<article class="news-stack__item"><a href="${href}" class="news-stack__media">${media}</a><div class="news-stack__body">`
        + `<div class="news-stack__meta">${badge}<span>${formatNewsDate(n.createdAt)}</span></div>`
        + `<h4><a href="${href}">${esc(n.title)}</a></h4>`
        + `<p>${esc(newsSummary(n, 98))}</p>`
        + `</div></article>`;
}

async function initNewsCarousel() {
    const section = document.getElementById("news-carousel-section");
    if (!section) return;
    const root = document.getElementById("news-carousel");
    if (!root) return;
    section.hidden = false;
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Notícias em destaque");
    root.innerHTML = NEWS_SKELETON;
    let status = document.getElementById("news-status");
    if (!status) {
        status = document.createElement("span");
        status.id = "news-status";
        status.className = "sr-only";
        status.setAttribute("aria-live", "polite");
        section.appendChild(status);
    }
    status.textContent = "Carregando notícias...";
    let noticias;
    try {
        noticias = await api.get("/noticias");
    } catch (err) {
        status.textContent = err.message || "Erro ao carregar notícias.";
        root.innerHTML = `<div class="news-empty"><p>${esc(err.message || "Não foi possível carregar as notícias agora.")}</p><button class="btn btn-primary" id="retry-news">Tentar novamente</button></div>`;
        document.getElementById("retry-news")?.addEventListener("click", (e) => {
            const b = e.currentTarget;
            if (b.disabled) return;
            b.disabled = true;
            initNewsCarousel();
        });
        return;
    }
    if (!noticias.length) {
        section.hidden = true;
        return;
    }
    status.textContent = "Notícias carregadas.";
    const items = noticias.slice(0, 5);
    const stack = items.slice(1, 5);
    const stackHtml = stack.length ? `<div class="news-stack">${stack.map(newsStackItem).join("")}</div>` : "";
    root.innerHTML = `<div class="news-edition">${newsLead(items[0])}${stackHtml}</div>`;
}

async function initEventosHome() {
    const section = document.getElementById("eventos-home");
    const grid = document.getElementById("eventos-home-grid");
    const calCard = document.getElementById("cal-card");
    if (!section || !grid || !calCard) return;
    section.hidden = false;
    grid.innerHTML = Array(3).fill('<div class="skeleton skeleton-light skeleton--event"></div>').join("");
    calCard.innerHTML = '<div class="skeleton skeleton-light skeleton--calendar"></div>';
    let futuros = [];
    let agenda = [];
    try {
        const data = await api.get("/eventos");
        agenda = data.futuros || [];
        futuros = agenda.slice(0, 3);
        if (!agenda.length) { section.hidden = true; return; }
    } catch {
        grid.innerHTML = '<div class="home-load-error">Não foi possível carregar a agenda agora.</div>';
        calCard.hidden = true;
        return;
    }
    const today = new Date();
    let curYear = today.getFullYear();
    let curMonth = today.getMonth();
    const renderCal = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const prevLast = new Date(year, month, 0).getDate();
        const monthName = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const eventsByDay = new Map();
        agenda.forEach((ev) => {
            const d = new Date(ev.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const k = d.getDate();
                if (!eventsByDay.has(k)) eventsByDay.set(k, []);
                eventsByDay.get(k).push(ev);
            }
        });
        const weekdays = ["D","S","T","Q","Q","S","S"];
        let daysHtml = "";
        for (let i = startWeek - 1; i >= 0; i--) {
            const d = prevLast - i;
            daysHtml += `<div class="cal-day cal-day--muted">` + d + `</div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEv = eventsByDay.has(d);
            const cls = ["cal-day", isToday ? "cal-day--today" : "", hasEv ? "cal-day--event" : ""].filter(Boolean).join(" ");
            daysHtml += `<div class="` + cls + `">` + d + (hasEv ? '<span class="cal-day__dot"></span>' : "") + `</div>`;
        }
        const totalCells = startWeek + daysInMonth;
        const remain = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remain; d++) {
            daysHtml += `<div class="cal-day cal-day--muted">` + d + `</div>`;
        }
        calCard.innerHTML = `
          <div class="cal-head">
            <h3>` + monthName + `</h3>
            <div class="cal-head__nav">
              <button aria-label="Mês anterior" id="cal-prev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
              <button aria-label="Próximo mês" id="cal-next"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
            </div>
          </div>
          <div class="cal-weekdays">` + weekdays.map((w)=>`<span>`+w+`</span>`).join("") + `</div>
          <div class="cal-days">` + daysHtml + `</div>
        `;
        calCard.querySelector("#cal-prev")?.addEventListener("click", () => {
            curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; }
            renderCal(curYear, curMonth);
        });
        calCard.querySelector("#cal-next")?.addEventListener("click", () => {
            curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; }
            renderCal(curYear, curMonth);
        });
    };
    renderCal(curYear, curMonth);
    grid.innerHTML = futuros.map((ev) => {
        const d = new Date(ev.date);
        const dia = d.getDate();
        const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const isToday = d.toDateString() === today.toDateString();
        const loc = ev.location ? esc(ev.location) : "";
        const vagasTxt = ev.maxParticipants ? `${ev.signupCount || 0}/${ev.maxParticipants} vagas` : "Vagas livres";
        return `<article class="cal-event">
          <div class="cal-event__date ` + (isToday ? "cal-event__date--today" : "") + `"><b>` + dia + `</b><span>` + mes + `</span></div>
          <div class="cal-event__body">
            <h4><a href="/eventos?id=` + encodeURIComponent(ev.id) + `">` + esc(ev.title) + `</a></h4>
            <div class="cal-event__meta">` + (loc ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg> ` + loc + `</span>` : "") + `<span>` + esc(d.toLocaleDateString("pt-BR", { weekday: "short" })) + ` ` + esc(d.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})) + `</span></div>
            <p class="cal-event__desc">` + esc((ev.description || "").slice(0, 90)) + ((ev.description||"").length>90?"...":"") + `</p>
            <div class="cal-event__foot"><span class="cal-event__vagas">` + vagasTxt + `</span><a href="/eventos?id=` + encodeURIComponent(ev.id) + `" class="cal-event__cta">Ver <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg></a></div>
          </div>
        </article>`;
    }).join("");
}

async function renderProjects() {
    const section = document.getElementById("projetos-section");
    const container = document.getElementById("projetos-home");
    if (!section || !container) return;
    section.hidden = false;
    container.innerHTML = Array(3).fill('<div class="skeleton skeleton-light skeleton--project"></div>').join("");
    let status = document.getElementById("projetos-status");
    if (!status) {
        status = document.createElement("span");
        status.id = "projetos-status";
        status.className = "sr-only";
        status.setAttribute("aria-live", "polite");
        section.appendChild(status);
    }
    status.textContent = "Carregando projetos...";
    try {
        const projetos = await api.get("/projetos");
        const publicos = projetos.filter((p) => p.isPublic).slice(0, 3);
        if (publicos.length === 0) {
            section.hidden = true;
            return;
        }
        const fmt = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }) : "--";
        container.innerHTML = publicos.map((p) => {
            const label = ({ PLANNING: "Planejamento", IN_PROGRESS: "Em Andamento", COMPLETED: "Concluído" }[p.status] || p.status);
            const grad = ({ PLANNING: "#f59e0b", IN_PROGRESS: "#2E63C4", COMPLETED: "#10b981" }[p.status] || "#6b7280");
            const badgeCls = "ficha__badge--" + p.status.toLowerCase();
            const media = p.imageUrl
                ? `<img src="` + esc(p.imageUrl) + `" alt="` + esc(p.title) + `" loading="lazy" decoding="async">`
                : `<div class="ficha__placeholder" style="--cat:${grad};--cat-soft:${grad}14">${esc(p.title.charAt(0).toUpperCase())}</div>`;
            return `<article class="ficha">
              <a href="/projetos?id=` + p.id + `" class="ficha__media">` + media + `<span class="ficha__badge ` + badgeCls + `">` + esc(label) + `</span></a>
              <div class="ficha__body">
                <h3 class="ficha__title"><a href="/projetos?id=` + p.id + `">` + esc(p.title) + `</a></h3>
                <dl class="ficha__meta">
                  <div><dt>Início</dt><dd>` + esc(fmt(p.startDate)) + `</dd></div>
                  <div><dt>Término</dt><dd>` + esc(fmt(p.endDate)) + `</dd></div>
                </dl>
                <p class="ficha__desc">` + esc(p.description.slice(0, 145)) + (p.description.length > 145 ? "..." : "") + `</p>
                <div class="ficha__foot">
                  <span class="ficha__foot__status">` + esc(label) + `</span>
                  <a href="/projetos?id=` + p.id + `">Ver ficha <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg></span></a>
                </div>
              </div>
            </article>`;
        }).join("");
        status.textContent = "Projetos carregados.";
    } catch (err) {
        status.textContent = err.message || "Erro ao carregar projetos.";
        container.innerHTML = `<div class="home-load-error">
          <p>${esc(err.message || "Não foi possível carregar os projetos agora.")}</p>
          <button class="btn btn-primary" id="retry-projetos">Tentar novamente</button>
        </div>`;
        document.getElementById("retry-projetos")?.addEventListener("click", (e) => {
            const b = e.currentTarget;
            if (b.disabled) return;
            b.disabled = true;
            renderProjects();
        });
    }
}
