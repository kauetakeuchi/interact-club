import { api, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";

function renderSuccess() {
    return `<div class="success-state">
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#17458F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h2 class="success-title">Mensagem enviada!</h2>
      <p class="success-text">Em breve entraremos em contato. Obrigado pelo seu interesse no Interact Club!</p>
      <button class="btn btn-primary" id="ct-reset">Enviar outra mensagem</button>
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    page.innerHTML = `
    <section class="hero"><div class="container"><span class="tag">Fale conosco</span><h1>Entre em <span>Contato</span></h1><p>Tem d&uacute;vidas, sugest&otilde;es ou quer o Interact na sua comunidade? Mande uma mensagem ou venha nos visitar.</p></div></section>
    <section class="section section-muted"><div class="container">
      <h2 class="section-title">Estamos prontos para te ajudar</h2>
      <div class="contact-grid">
        <div class="contact-card">
          <div class="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3>E-mail</h3>
          <p>ic.taquaritinga@hotmail.com</p>
          <a href="mailto:ic.taquaritinga@hotmail.com" class="contact-link">Enviar e-mail</a>
        </div>
        <div class="contact-card">
          <div class="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <h3>Telefone</h3>
          <p>(16) 3252-6583</p>
          <a href="tel:+551632526583" class="contact-link">Ligar agora</a>
        </div>
        <div class="contact-card">
          <div class="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3>Endere&ccedil;o</h3>
          <p>Rua Francisco Mesquita, 640<br>Taquaritinga — SP, 15902-016</p>
          <a href="https://www.google.com/maps/search/?api=1&query=Rua+Francisco+Mesquita+640+Taquaritinga+SP" target="_blank" rel="noopener" class="contact-link">Ver no mapa</a>
        </div>
        <div class="contact-card">
          <div class="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3>Hor&aacute;rio</h3>
          <p>Sábados, às 11h<br>na sede do Rotary</p>
          <span class="contact-link" style="cursor:default;">Visite-nos!</span>
        </div>
      </div>
    </div></section>
    <section class="section"><div class="container" style="max-width:42rem;">
      <h2 class="section-title" style="text-align:center;">Envie sua mensagem</h2>
      <form id="contato-form" class="contact-form">
        <div class="form-row">
          <div class="form-group"><label for="ct-name">Nome *</label><input type="text" id="ct-name" class="form-control" required maxlength="255" placeholder="Seu nome completo"></div>
          <div class="form-group"><label for="ct-email">E-mail *</label><input type="email" id="ct-email" class="form-control" required placeholder="seu@email.com.br"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="ct-phone">Telefone</label><input type="tel" id="ct-phone" class="form-control" placeholder="(00) 00000-0000"></div>
          <div class="form-group"><label for="ct-subject">Assunto *</label><input type="text" id="ct-subject" class="form-control" required maxlength="255" placeholder="Sobre o que &eacute;?"></div>
        </div>
        <div class="form-group"><label for="ct-message">Mensagem *</label><textarea id="ct-message" class="form-control" required rows="6" placeholder="Escreva sua mensagem aqui..."></textarea></div>
        <button type="submit" class="btn btn-primary btn-full" id="ct-btn">Enviar Mensagem</button>
      </form>
      <div id="ct-success" style="display:none;"></div>
    </div></section>`;

    const form = document.getElementById("contato-form");
    const successEl = document.getElementById("ct-success");

    form?.addEventListener("submit", async (e) => {
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
            form.style.display = "none";
            successEl.innerHTML = renderSuccess();
            successEl.style.display = "block";
            successEl.querySelector("#ct-reset")?.addEventListener("click", () => {
                form.style.display = "block";
                successEl.style.display = "none";
                successEl.innerHTML = "";
                form.reset();
            });
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