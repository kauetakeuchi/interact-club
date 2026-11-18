import { auth, toast } from "../lib/index.js";

const form = document.getElementById("forgot-form");
const button = document.getElementById("forgot-btn");
const status = document.getElementById("forgot-status");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Enviando...';
    try {
        const email = document.getElementById("forgot-email").value;
        await auth.forgotPassword(email);
        // Esconde o subtítulo
        const subtitle = document.querySelector(".auth-subtitle");
        if (subtitle) subtitle.hidden = true;
        // Esconde o form e mostra a mensagem de sucesso na caixa
        form.hidden = true;
        status.hidden = false;
        status.innerHTML = `
          <span style="font-size:2rem;">✉️</span><br>
          <strong>Verifique sua caixa de email</strong><br>
          <span style="font-size:0.95rem;color:var(--text-muted,#6b7280)">Enviamos um link de redefinição para o seu email. Pode levar alguns instantes.</span>
        `;
    } catch (err) {
        toast.show(err.message || "Não foi possível enviar o link agora.", "error");
        button.disabled = false;
        button.textContent = "Enviar link";
    }
});
