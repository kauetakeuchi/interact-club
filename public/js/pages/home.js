import { api, auth, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";
import { esc } from "../lib/security.js";
import { CATEGORY_COLORS } from "../lib/constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    document.querySelector('a[href="/cadastro"]')?.addEventListener("click", (e) => {
        if (!auth.isAuthenticated()) return;
        e.preventDefault();
        toast.show("Voce ja esta cadastrado!");
    });
    await initNewsCarousel();
    await initEventosHome();
    await renderProjects();
});

async function initNewsCarousel() {
    const section = document.getElementById("news-carousel-section");
    if (!section) return;
    const root = document.getElementById("news-carousel");
    if (!root) return;
    section.hidden = false;
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Noticias em destaque");
    root.innerHTML = `<div class="news-edition"><article class="news-lead"><div class="skeleton skeleton-light" style="aspect-ratio:16/10.2;border-radius:16px 16px 0 0;"></div><div style="padding:1.25rem;"><div class="skeleton skeleton-light" style="height:.75rem;width:6rem;margin-bottom:.9rem;"></div><div class="skeleton skeleton-light" style="height:1.4rem;width:90%;margin-bottom:.6rem;"></div><div class="skeleton skeleton-light" style="height:.85rem;width:100%;"></div></div></article><div class="news-stack"><div class="skeleton skeleton-light" style="height:112px;border-radius:12px;"></div><div class="skeleton skeleton-light" style="height:112px;border-radius:12px;"></div><div class="skeleton skeleton-light" style="height:112px;border-radius:12px;"></div></div></div>`;
    let status = document.getElementById("news-status");
    if (!status) {
        status = document.createElement("span");
        status.id = "news-status";
        status.className = "sr-only";
        status.setAttribute("aria-live", "polite");
        section.appendChild(status);
    }
    status.textContent = "Carregando noticias...";
    let noticias;
    try {
        noticias = await api.get("/noticias");
    } catch (err) {
        status.textContent = err.message || "Erro ao carregar noticias.";
        root.innerHTML = `<div class="news-empty"><p style="margin-bottom:1rem;font-size:.875rem;">` + esc(err.message || "Nao foi possivel carregar as noticias agora.") + `</p><button class="btn btn-primary" id="retry-news">Tentar novamente</button></div>`;
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
    status.textContent = "Noticias carregadas.";
    const items = noticias.slice(0, 5);
    const lead = items[0];
    const rest = items.slice(1, 5);
    const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    const leadCor = CATEGORY_COLORS[lead.category] || "#17458F";
    const leadDate = fmtDate(lead.createdAt);
    const leadTexto = lead.excerpt || ((lead.content || "").slice(0, 220) + ((lead.content || "").length > 220 ? "..." : ""));
    const leadMedia = lead.imageUrl
        ? `<img src="` + esc(lead.imageUrl) + `" alt="` + esc(lead.title) + `" loading="lazy" decoding="async">`
        : `<div class="news-stack__thumb--placeholder" style="background:linear-gradient(135deg,` + leadCor + `, #2E63C4);width:100%;height:100%;aspect-ratio:16/10.2;display:flex;align-items:center;justify-content:center;font-size:3rem;color:#fff;">` + esc((lead.category || "N").charAt(0)) + `</div>`;
    const leadHtml = `<article class="news-lead"><a href="/noticias?slug=` + encodeURIComponent(lead.slug) + `" class="news-lead__media">` + leadMedia + (lead.category ? `<span class="news-lead__badge">` + esc(lead.category) + `</span>` : "") + `</a><div class="news-lead__body"><div class="news-lead__meta"><span>` + leadDate + `</span>` + (lead.author?.name ? `<span> - Por ` + esc(lead.author.name) + `</span>` : "") + `</div><h3><a href="/noticias?slug=` + encodeURIComponent(lead.slug) + `">` + esc(lead.title) + `</a></h3><p>` + esc(leadTexto) + `</p><a href="/noticias?slug=` + encodeURIComponent(lead.slug) + `" class="news-lead__cta">Ler materia <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg></span></a></div></article>`;
    let stackHtml = "";
    if (rest.length) {
        stackHtml = `<div class="news-stack">` + rest.map((n) => {
            const c = CATEGORY_COLORS[n.category] || "#6b7280";
            const d = fmtDate(n.createdAt);
            const ex = n.excerpt || ((n.content || "").slice(0, 98) + ((n.content || "").length > 98 ? "..." : ""));
            const media = n.imageUrl
                ? `<img src="` + esc(n.imageUrl) + `" alt="` + esc(n.title) + `">`
                : `<div class="news-stack__thumb--placeholder" style="background:linear-gradient(135deg,` + c + `, #94a3b8);width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-family:var(--font-heading);font-size:1.5rem;">` + esc((n.category || "N").charAt(0)) + `</div>`;
            return `<article class="news-stack__item"><a href="/noticias?slug=` + encodeURIComponent(n.slug) + `" class="news-stack__media">` + media + `</a><div class="news-stack__body"><div class="news-stack__meta">` + (n.category ? `<span class="mini-badge" style="background:` + c + `;color:#fff;">` + esc(n.category) + `</span>` : "") + `<span>` + d + `</span></div><h4><a href="/noticias?slug=` + encodeURIComponent(n.slug) + `">` + esc(n.title) + `</a></h4><p>` + esc(ex) + `</p></div></article>`;
        }).join("") + `</div>`;
    }
    root.innerHTML = `<div class="news-edition">` + leadHtml + stackHtml + `</div>`;
}

async function initEventosHome() {
    const section = document.getElementById("eventos-home");
    const grid = document.getElementById("eventos-home-grid");
    const calCard = document.getElementById("cal-card");
    if (!section || !grid || !calCard) return;
    section.hidden = false;
    grid.innerHTML = Array(3).fill('<div class="skeleton skeleton-light" style="height:96px;border-radius:14px;"></div>').join("");
    calCard.innerHTML = '<div class="skeleton skeleton-light" style="height:320px;border-radius:16px;"></div>';
    let futuros = [];
    try {
        const data = await api.get("/eventos");
        futuros = (data.futuros || []).slice(0, 3);
        if (!futuros.length) { section.hidden = true; return; }
    } catch (err) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem 1rem;color:var(--text-muted);font-size:.875rem;">Nao foi possivel carregar a agenda agora.</div>';
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
        futuros.forEach((ev) => {
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
              <button aria-label="Mes anterior" id="cal-prev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
              <button aria-label="Proximo mes" id="cal-next"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
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
            <h4><a href="/eventos">` + esc(ev.title) + `</a></h4>
            <div class="cal-event__meta">` + (loc ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg> ` + loc + `</span>` : "") + `<span>` + esc(d.toLocaleDateString("pt-BR", { weekday: "short" })) + ` ` + esc(d.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})) + `</span></div>
            <p class="cal-event__desc">` + esc((ev.description || "").slice(0, 90)) + ((ev.description||"").length>90?"...":"") + `</p>
            <div class="cal-event__foot"><span class="cal-event__vagas">` + vagasTxt + `</span><a href="/eventos" class="cal-event__cta">Ver <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg><span style="display:none" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M9 12h7M12 8.5l4 3.5-4 3.5"/></svg></span></a></div>
          </div>
        </article>`;
    }).join("");
}

async function renderProjects() {
    const section = document.getElementById("projetos-section");
    const container = document.getElementById("projetos-home");
    if (!section || !container) return;
    section.hidden = false;
    container.innerHTML = Array(3).fill('<div class="skeleton skeleton-light" style="height:17rem;border-radius:12px;"></div>').join("");
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
            const label = ({ PLANNING: "Planejamento", IN_PROGRESS: "Em Andamento", COMPLETED: "Concluido" }[p.status] || p.status);
            const grad = ({ PLANNING: "#f59e0b", IN_PROGRESS: "#2E63C4", COMPLETED: "#10b981" }[p.status] || "#6b7280");
            const badgeCls = "ficha__badge--" + p.status.toLowerCase();
            const media = p.imageUrl
                ? `<img src="` + esc(p.imageUrl) + `" alt="` + esc(p.title) + `" loading="lazy" decoding="async">`
                : `<div class="ficha__placeholder" style="background:linear-gradient(135deg,` + grad + `14,` + grad + `);">` + esc(p.title.charAt(0).toUpperCase()) + `</div>`;
            return `<article class="ficha">
              <a href="/projetos?id=` + p.id + `" class="ficha__media">` + media + `<span class="ficha__badge ` + badgeCls + `">` + esc(label) + `</span></a>
              <div class="ficha__body">
                <h3 class="ficha__title"><a href="/projetos?id=` + p.id + `">` + esc(p.title) + `</a></h3>
                <dl class="ficha__meta">
                  <div><dt>Inicio</dt><dd>` + esc(fmt(p.startDate)) + `</dd></div>
                  <div><dt>Termino</dt><dd>` + esc(fmt(p.endDate)) + `</dd></div>
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
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem 1rem;">
          <p style="color:var(--text-muted);font-size:.875rem;margin-bottom:1rem;">` + esc(err.message || "Nao foi possivel carregar os projetos agora.") + `</p>
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
