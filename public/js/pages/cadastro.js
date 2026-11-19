import { auth, toast } from "../lib/index.js";
import { initPasswordToggles } from "../lib/password.js";
import { askTermsConsent } from "../lib/TermsModal.js";
import { bindPhoneInput } from "../lib/phone.js";

if (auth.isAuthenticated()) {
    auth.refresh().then((user) => {
        if (!user) return;
        toast.show("Você já tem cadastro no clube! Voltando para o início...");
        setTimeout(() => window.location.replace("/"), 1800);
    });
}
initPasswordToggles();
bindPhoneInput(document.getElementById("reg-phone"));

document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("register-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Criando...';
    try {
        // Concordância com Termos e Política antes de qualquer envio.
        const accepted = await askTermsConsent();
        if (!accepted) {
            btn.disabled = false;
            btn.textContent = "Criar Conta";
            return;
        }
        const name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        const phone = document.getElementById("reg-phone").value;
        const birthDate = document.getElementById("reg-birth").value;
        const password = document.getElementById("reg-password").value;
        const emailUpdatesOptIn = document.getElementById("reg-email-updates").checked;
        await auth.register(name, email, password, phone, birthDate, emailUpdatesOptIn);
        toast.show("Enviamos um link de confirmação para seu email.");
        setTimeout(() => {
            window.location.href = `/verificar-email?sent=1&email=${encodeURIComponent(email)}`;
        }, 700);
    }
    catch (err) {
        toast.show(err.message || "Erro ao criar conta", "error");
        btn.disabled = false;
        btn.textContent = "Criar Conta";
    }
});

// Data de nascimento não pode ser no futuro.
const birthInput = document.getElementById("reg-birth");
if (birthInput) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    birthInput.max = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    birthInput.min = "1900-01-01";
}
