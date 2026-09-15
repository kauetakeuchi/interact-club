import { api, toast } from "../lib/index.js";
import { initPublicPage } from "../lib/page.js";

function renderSuccess() {
    return `<div class="success-state contact-success">
      <div class="success-icon">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <span class="contact-section-label">Tudo certo</span>
      <h2 class="success-title">Pronto, chegou!</h2>
      <p class="success-text">Obrigado pela mensagem. Nossa equipe responderá em breve.</p>
      <button class="contact-submit contact-submit-secondary" id="ct-reset">Escrever outro recado <span aria-hidden="true">↗</span></button>
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
    initPublicPage();
    const page = document.getElementById("page-content");
    page.innerHTML = `
    <header class="contact-intro">
      <div class="container contact-intro-grid">
        <div class="contact-intro-copy contact-reveal">
          <span class="contact-kicker"><i></i> Fale conosco</span>
          <h1>Quer falar com<br>o clube? <em>Chega mais.</em></h1>
          <p>Dúvida, ideia, vontade de participar ou convite para algum projeto? Envie sua mensagem. A equipe do próprio clube responde.</p>
        </div>
        <div class="contact-intro-note contact-reveal" aria-label="Um recado nosso">
          <span class="contact-note-number">01</span>
          <p>Atendimento de verdade.<br><strong>Você fala diretamente com o clube.</strong></p>
          <svg viewBox="0 0 110 40" aria-hidden="true"><path d="M2 28c23-17 53-20 102-10M91 8l14 10-13 10"/></svg>
        </div>
      </div>
    </header>

    <main class="contact-main">
      <div class="container contact-layout">
        <section class="contact-directory contact-reveal" aria-labelledby="contact-directory-title">
          <span class="contact-section-label">Chama por onde quiser</span>
          <h2 id="contact-directory-title">Vai pelo mais fácil.</h2>
          <div class="contact-lines">
            <a href="mailto:ic.taquaritinga@hotmail.com" class="contact-line">
              <span class="contact-line-index">01</span>
              <span class="contact-line-copy"><small>E-mail</small><strong>ic.taquaritinga@hotmail.com</strong></span>
              <span class="contact-line-arrow" aria-hidden="true">↗</span>
            </a>
            <a href="tel:+551632526583" class="contact-line">
              <span class="contact-line-index">02</span>
              <span class="contact-line-copy"><small>Telefone</small><strong>(16) 3252-6583</strong></span>
              <span class="contact-line-arrow" aria-hidden="true">↗</span>
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=Rua+Francisco+Mesquita+640+Taquaritinga+SP" target="_blank" rel="noopener" class="contact-line">
              <span class="contact-line-index">03</span>
              <span class="contact-line-copy"><small>Onde nos encontramos</small><strong>Rua Francisco Mesquita, 640<br>Taquaritinga — SP</strong></span>
              <span class="contact-line-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <aside class="contact-meeting">
            <span class="contact-meeting-day">Sáb</span>
            <div><small>Nossos encontros</small><strong>Todo sábado, às 11h</strong><p>É na sede do Rotary. Pode aparecer.</p></div>
          </aside>
        </section>

        <section class="contact-letter contact-reveal" aria-labelledby="contact-form-title">
          <div class="contact-letter-head">
            <span class="contact-section-label">Manda um recado</span>
            <h2 id="contact-form-title">Conte sua ideia.</h2>
            <p>Não precisa escrever bonito. Só diz como podemos ajudar.</p>
          </div>
          <form id="contato-form" class="contact-form">
        <div class="form-row">
          <div class="form-group"><label for="ct-name">Seu nome <span>*</span></label><input type="text" id="ct-name" class="form-control" required maxlength="255" autocomplete="name" placeholder="Como podemos te chamar?"></div>
          <div class="form-group"><label for="ct-email">Seu melhor e-mail <span>*</span></label><input type="email" id="ct-email" class="form-control" required autocomplete="email" placeholder="voce@email.com"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="ct-phone">WhatsApp <small>se quiser</small></label><input type="tel" id="ct-phone" class="form-control" autocomplete="tel" placeholder="(00) 00000-0000"></div>
          <div class="form-group"><label for="ct-subject">Assunto <span>*</span></label><input type="text" id="ct-subject" class="form-control" required maxlength="255" placeholder="Quero participar..."></div>
        </div>
        <div class="form-group"><label for="ct-message">Seu recado <span>*</span></label><textarea id="ct-message" class="form-control" required rows="6" placeholder="Manda os detalhes por aqui..."></textarea></div>
        <div class="contact-form-foot">
          <p>Normalmente respondemos em até 2 dias.</p>
          <button type="submit" class="contact-submit" id="ct-btn">Mandar mensagem <span aria-hidden="true">↗</span></button>
        </div>
      </form>
      <div id="ct-success" style="display:none;"></div>
        </section>
      </div>
    </main>`;

    const revealItems = page.querySelectorAll(".contact-reveal");
    revealItems.forEach((item, index) => item.style.setProperty("--contact-delay", `${index * 90}ms`));
    requestAnimationFrame(() => revealItems.forEach((item) => item.classList.add("is-visible")));

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
        btn.innerHTML = '<span class="spinner"></span> Mandando...';
        try {
            await api.post("/contato", data);
            toast.show("Mensagem recebida! Entraremos em contato em breve.");
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
            btn.innerHTML = 'Mandar mensagem <span aria-hidden="true">↗</span>';
        }
    });
});
