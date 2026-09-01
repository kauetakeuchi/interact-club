export class Navbar {
    constructor(auth, onAvatarClick) { this.auth = auth; this.onAvatarClick = onAvatarClick; }
    init() {
        this.toggleBtn = document.querySelector(".mobile-toggle");
        const loginLink = document.getElementById("login-link");
        const userMenu = document.getElementById("user-menu");
        const avatarLetter = document.getElementById("avatar-letter");
        const userName = document.getElementById("user-name");
        const logoutBtn = document.getElementById("logout-btn");
        const avatarLink = document.getElementById("avatar-link");
        if (this.auth.isAuthenticated()) {
            const user = this.auth.getUser();
            if (loginLink)
                loginLink.style.display = "none";
            if (userMenu)
                userMenu.style.display = "flex";
            if (avatarLetter && user)
                avatarLetter.textContent = user.name.charAt(0).toUpperCase();
            if (userName && user)
                userName.textContent = user.name;
            if (logoutBtn)
                logoutBtn.addEventListener("click", () => this.auth.logout());
            if (avatarLink)
                avatarLink.addEventListener("click", (e) => { e.preventDefault(); this.onAvatarClick?.(); });
        }
        else {
            if (loginLink)
                loginLink.style.display = "block";
            if (userMenu)
                userMenu.style.display = "none";
        }
        document.querySelector(".mobile-toggle")?.addEventListener("click", () => {
            const nav = document.querySelector(".navbar");
            const open = nav?.classList.toggle("mobile-open");
            this.toggleBtn?.setAttribute("aria-expanded", String(!!open));
            this.toggleBtn?.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        });
    }
}
