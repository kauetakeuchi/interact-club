import { auth, toast } from "../lib/index.js";
import { initPasswordToggles } from "../lib/password.js";
import { askTermsConsent } from "../lib/TermsModal.js";

if (auth.isAuthenticated()) {
    auth.refresh().then((user) => {
        if (user) window.location.replace("/");
    });
}
initPasswordToggles();

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
        if (err.code === "EMAIL_NOT_VERIFIED") {
            setTimeout(() => {
                window.location.href = `/verificar-email?email=${encodeURIComponent(document.getElementById("reg-email").value)}`;
            }, 900);
        }
    }
});
