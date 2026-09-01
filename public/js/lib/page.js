import { auth, dashboard } from "./index.js";
import { Layout } from "./Layout.js";
import { Navbar } from "./Navbar.js";

/**
 * Bootstrap padrão das páginas públicas: injeta navbar/footer
 * e conecta o menu do usuário.
 */
export function initPublicPage() {
    new Layout(auth).renderPublic();
    new Navbar(auth, () => dashboard.toggle()).init();
}
