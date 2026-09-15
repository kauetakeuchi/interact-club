import { auth, toast } from "../lib/index.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email") || "";
const status = document.getElementById("verification-status");
const loginLink = document.getElementById("login-link");
const resendForm = document.getElementById("resend-form");
const emailInput = document.getElementById("verification-email");

function showResend(message) {
    status.textContent = message;
    emailInput.value = email;
    resendForm.hidden = false;
}

async function verify() {
    if (!token) {
        showResend(params.get("sent") === "1"
            ? "Enviamos um link para o seu email. Clique nele para ativar sua conta. Confira também a caixa de spam."
            : "Informe seu email para receber um novo link de verificação.");
        return;
    }

    try {
        const data = await auth.verifyEmail(token);
        status.textContent = data.message;
        loginLink.hidden = false;
    } catch (err) {
        showResend(err.message || "Não foi possível confirmar este link.");
    }
}

resendForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("resend-btn");
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Enviando…';
    try {
        const data = await auth.resendVerification(emailInput.value);
        status.textContent = data.message;
        toast.show("Solicitação enviada.");
    } catch (err) {
        toast.show(err.message || "Erro ao enviar o link", "error");
    } finally {
        button.disabled = false;
        button.textContent = "Enviar novo link";
    }
});

verify();
