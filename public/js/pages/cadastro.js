import { auth, toast } from "../lib/index.js";
import { initPasswordToggles } from "../lib/password.js";

if (auth.isAuthenticated()) {
    window.location.href = "/";
}
initPasswordToggles();

document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("register-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Criando...';
    try {
        const name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        const phone = document.getElementById("reg-phone").value;
        const birthDate = document.getElementById("reg-birth").value;
        const password = document.getElementById("reg-password").value;
        await auth.register(name, email, password, phone, birthDate);
        toast.show("Conta criada! Bem-vindo!");
        setTimeout(() => { window.location.href = "/"; }, 500);
    }
    catch (err) {
        toast.show(err.message || "Erro ao criar conta", "error");
        btn.disabled = false;
        btn.textContent = "Criar Conta";
    }
});
