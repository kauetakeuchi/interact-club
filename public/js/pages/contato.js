import { api, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    page.innerHTML = `
    <section class="hero"><div class="container"><span class="tag">Fale conosco</span><h1>Entre em <span>Contato</span></h1><p>Tem dúvidas, sugestões ou quer o Interact na sua comunidade? Mande uma mensagem!</p></div></section>
    <section class="section"><div class="container" style="max-width:40rem;">
      <form id="contato-form">
        <div class="form-row">
          <div class="form-group"><label>Nome *</label><input type="text" id="ct-name" class="form-control" required maxlength="255" placeholder="Seu nome"></div>
          <div class="form-group"><label>Email *</label><input type="email" id="ct-email" class="form-control" required placeholder="seu@email.com"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Telefone</label><input type="tel" id="ct-phone" class="form-control" placeholder="(11) 99999-9999"></div>
          <div class="form-group"><label>Assunto *</label><input type="text" id="ct-subject" class="form-control" required maxlength="255" placeholder="Sobre o que é?"></div>
        </div>
        <div class="form-group"><label>Mensagem *</label><textarea id="ct-message" class="form-control" required rows="6" placeholder="Escreva sua mensagem..."></textarea></div>
        <button type="submit" class="btn btn-primary btn-full" id="ct-btn">Enviar Mensagem</button>
      </form>
    </div></section>`;

    document.getElementById("contato-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("ct-btn");
        const data = {
            name: document.getElementById("ct-name").value,
            email: document.getElementById("ct-email").value,
            phone: document.getElementById("ct-phone").value || null,
            subject: document.getElementById("ct-subject").value,
            message: document.getElementById("ct-message").value,
        };
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Enviando...';
        try {
            await api.post("/contato", data);
            toast.show("Mensagem enviada! Em breve entraremos em contato.");
            document.getElementById("contato-form").reset();
        }
        catch (err) {
            toast.show(err.message || "Erro ao enviar mensagem", "error");
        }
        finally {
            btn.disabled = false;
            btn.textContent = "Enviar Mensagem";
        }
    });
});
