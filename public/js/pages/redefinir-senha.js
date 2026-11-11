import { auth, toast } from "../lib/index.js";
import { initPasswordToggles } from "../lib/password.js";

const token = new URLSearchParams(window.location.search).get("token");
const form = document.getElementById("reset-form");
const button = document.getElementById("reset-btn");
const status = document.getElementById("reset-status");
const loginLink = document.getElementById("reset-login-link");

initPasswordToggles();

function showError(message) {
    status.hidden = false;
    status.textContent = message;
}

if (!token) {
    form.hidden = true;
    showError("Link de redefinição inválido. Solicite um novo link na página de recuperação de senha.");
    loginLink.hidden = false;
}

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("reset-password").value;
    const confirmation = document.getElementById("reset-confirm").value;
    if (password !== confirmation) {
        toast.show("As senhas não coincidem.", "error");
        return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Salvando...';
    try {
        const data = await auth.resetPassword(token, password);
        form.hidden = true;
        status.hidden = false;
        status.textContent = data.message;
        loginLink.hidden = false;
    } catch (err) {
        showError(err.message || "Não foi possível redefinir a senha.");
        button.disabled = false;
        button.textContent = "Redefinir senha";
    }
});
