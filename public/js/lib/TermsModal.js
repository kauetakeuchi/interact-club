/**
 * Confirmação de Termos e Política no cadastro.
 *
 * Não é um cookie banner: aparece no momento da ação, e só a
 * confirmação libera o envio do formulário. O aceite é por
 * manifestação inequívoca, sem marcar checkbox no formulário.
 */
const TERMS_URL = "/termos";
const PRIVACY_URL = "/privacidade";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

let lastFocused = null;

function build() {
    const overlay = document.createElement("div");
    overlay.className = "terms-modal-overlay";
    overlay.id = "terms-modal";
    overlay.innerHTML = `
      <div class="terms-modal" role="dialog" aria-modal="true"
           aria-labelledby="terms-modal-title" aria-describedby="terms-modal-desc">
        <h2 class="terms-modal-title" id="terms-modal-title">Antes de criar sua conta</h2>
        <p class="terms-modal-desc" id="terms-modal-desc">
          Ao criar a conta, você concorda com os
          <a href="${TERMS_URL}" target="_blank" rel="noopener">Termos e Condições</a>
          e com a
          <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Política de Privacidade</a>
          do Interact Club, e confirma que os dados informados são verdadeiros.
        </p>
        <p class="terms-modal-note">
          A política explica como tratamos a data de nascimento e o contato,
          e quais são os seus direitos.
        </p>
        <div class="terms-modal-actions">
          <button type="button" class="terms-modal-cancel" data-act="cancel">Voltar</button>
          <button type="button" class="terms-modal-ok" data-act="ok">Li e concordo</button>
        </div>
      </div>`;
    return overlay;
}

function trapTab(e, modal) {
    const items = Array.from(modal.querySelectorAll(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    }
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function close(overlay) {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    lastFocused?.focus();
}

function onKey(e) {
    const overlay = document.getElementById("terms-modal");
    if (!overlay) return;
    if (e.key === "Escape") {
        e.preventDefault();
        close(overlay);
        return;
    }
    if (e.key === "Tab") trapTab(e, overlay.querySelector(".terms-modal"));
}

/**
 * Abre o modal e resolve quando a pessoa confirma.
 * @returns {Promise<boolean>} true se concordou.
 */
export function askTermsConsent() {
    return new Promise((resolve) => {
        const existing = document.getElementById("terms-modal");
        if (existing) existing.remove();

        lastFocused = document.activeElement;
        const overlay = build();
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";

        requestAnimationFrame(() => {
            overlay.classList.add("is-visible");
            overlay.querySelector(".terms-modal-ok")?.focus();
        });

        const finish = (accepted) => {
            document.body.style.overflow = "";
            close(overlay);
            resolve(accepted);
        };

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) return finish(false);
            const act = e.target.closest("[data-act]")?.dataset.act;
            if (act === "ok") finish(true);
            if (act === "cancel") finish(false);
        });

        document.addEventListener("keydown", onKey, true);
    });
}
