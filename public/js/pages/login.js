import { auth, toast } from "../lib/index.js";
import { initPasswordToggles } from "../lib/password.js";

if (auth.isAuthenticated()) {
    window.location.href = "/";
}
initPasswordToggles();

document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("login-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Entrando...';
    try {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        if (/\s/.test(email)) {
            toast.show("Email não pode conter espaços", "error");
            btn.disabled = false;
            btn.textContent = "Entrar";
            return;
        }
        await auth.login(email, password);
        toast.show("Login realizado!");
        setTimeout(() => { window.location.href = "/"; }, 500);
    }
    catch (err) {
        toast.show(err.message || "Email ou senha inválidos", "error");
        const verificationHelp = document.getElementById("verification-help");
        if (err.code === "EMAIL_NOT_VERIFIED" && verificationHelp) {
            verificationHelp.hidden = false;
            verificationHelp.href = `/verificar-email?email=${encodeURIComponent(document.getElementById("login-email").value)}`;
        }
        btn.disabled = false;
        btn.textContent = "Entrar";
    }
});
