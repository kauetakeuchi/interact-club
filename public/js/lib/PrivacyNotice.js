/**
 * Aviso de privacidade da primeira visita.
 *
 * O site não usa cookies nem rastreadores: gravamos apenas
 * `theme`, `token` e `user` no localStorage. Por isso este aviso
 * não pede consentimento — ele informa o que é guardado e onde
 * está o texto completo.
 *
 * A decisão fica no localStorage, chave `privacy-notice`, para o
 * aviso não reaparecer a cada visita. Apagar a chave faz ele voltar.
 */
const KEY = "privacy-notice";

const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function alreadySeen() {
    try { return localStorage.getItem(KEY) === "seen"; } catch { return true; }
}

function dismiss() {
    try { localStorage.setItem(KEY, "seen"); } catch {}
    document.getElementById("privacy-notice")?.remove();
}

export function showPrivacyNotice() {
    if (alreadySeen()) return;
    if (!document.getElementById("page-content")) return;

    const el = document.createElement("aside");
    el.id = "privacy-notice";
    el.className = "privacy-notice";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Aviso de privacidade");
    el.innerHTML = `
      <div class="privacy-notice-inner" role="note">
        <div class="privacy-notice-copy">
          <p class="privacy-notice-title">Uma coisa rápida sobre seus dados</p>
          <p class="privacy-notice-text">
            Este site não usa cookies nem rastreadores de anúncios. Guardamos
            apenas o seu tema de tela e, se você entrar na conta, o token que
            mantém você logado. Nada disso sai do servidor do clube.
            <a href="/privacidade">Ver a política completa</a>
          </p>
        </div>
        <div class="privacy-notice-actions">
          <a class="privacy-notice-link" href="/privacidade">Ler a política</a>
          <button class="privacy-notice-ok" type="button">Entendi</button>
        </div>
      </div>`;

    document.body.appendChild(el);
    el.querySelector(".privacy-notice-ok")?.addEventListener("click", dismiss);
    el.querySelectorAll("a[href='/privacidade']").forEach((a) => a.addEventListener("click", dismiss));

    requestAnimationFrame(() => el.classList.add("is-visible"));

    // Fecha com Esc, sem prender a pessoa na tela.
    const onKey = (e) => {
        if (e.key === "Escape") { dismiss(); document.removeEventListener("keydown", onKey); }
    };
    document.addEventListener("keydown", onKey);
}

export { esc };
