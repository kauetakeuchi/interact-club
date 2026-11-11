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
        const data = await auth.forgotPassword(email);
        form.hidden = true;
        status.hidden = false;
        status.textContent = data.message;
    } catch (err) {
        toast.show(err.message || "Não foi possível enviar o link agora.", "error");
        button.disabled = false;
        button.textContent = "Enviar link";
    }
});
