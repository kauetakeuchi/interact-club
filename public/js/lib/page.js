import { auth, dashboard, toast } from "./index.js";
import { Layout } from "./Layout.js";
import { Navbar } from "./Navbar.js";
import { showPrivacyNotice } from "./PrivacyNotice.js";

/**
 * Bootstrap padrão das páginas públicas: injeta navbar/footer,
 * confere a sessão pelo cookie e conecta o menu do usuário.
 */
export function initPublicPage() {
    new Layout(auth).renderPublic();
    const navbar = new Navbar(auth, () => dashboard.toggle());
    navbar.init();

    showPrivacyNotice();
    warnAlreadyRegistered();

    auth.refresh().then((user) => {
        if (!user) auth.clearSession();
        navbar.render();
    });
}

export const ALREADY_REGISTERED_MESSAGE = "Você já tem cadastro no clube! Acompanhe tudo pelo seu painel.";

/**
 * Botões "Quero participar" levam ao cadastro. Para quem já tem conta,
 * avisa aqui mesmo em vez de abrir o cadastro e voltar.
 */
function warnAlreadyRegistered() {
    document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href="/cadastro"]');
        if (!link || !auth.isAuthenticated()) return;
        e.preventDefault();
        toast.show(ALREADY_REGISTERED_MESSAGE);
    });
}
