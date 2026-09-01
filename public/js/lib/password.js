function bindToggle(btn) {
    btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.classList.toggle("visible", isPassword);
        btn.setAttribute("aria-label", isPassword ? "Esconder senha" : "Mostrar senha");
    });
}

/**
 * Ativa os botões .password-toggle da página (olho mostrar/esconder senha).
 */
export function initPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach(bindToggle);
}
