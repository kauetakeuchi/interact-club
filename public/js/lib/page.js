import { auth, dashboard } from "./index.js";
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

    auth.refresh().then((user) => {
        if (!user) auth.clearSession();
        navbar.render();
    });
}
