export class Navbar {
    constructor(auth, onAvatarClick) {
        this.auth = auth;
        this.onAvatarClick = onAvatarClick;
    }

    init() {
        this.toggleBtn = document.querySelector(".mobile-toggle");
        this.toggleBtn?.addEventListener("click", () => {
            const nav = document.querySelector(".navbar");
            const open = nav?.classList.toggle("mobile-open");
            this.toggleBtn?.setAttribute("aria-expanded", String(Boolean(open)));
            this.toggleBtn?.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        });

        document.getElementById("logout-btn")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.auth.logout();
        });

        document.getElementById("avatar-link")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.onAvatarClick?.();
        });

        this.render();
    }

    render() {
        const loginLink = document.getElementById("login-link");
        const userMenu = document.getElementById("user-menu");
        const avatarLetter = document.getElementById("avatar-letter");
        const userName = document.getElementById("user-name");
        const user = this.auth.getUser();

        if (user) {
            if (loginLink) loginLink.style.display = "none";
            if (userMenu) userMenu.style.display = "flex";
            if (avatarLetter) {
                avatarLetter.textContent = user.name.charAt(0).toUpperCase();
                if (user.avatarUrl) {
                    const img = document.createElement("img");
                    img.src = user.avatarUrl;
                    img.alt = "";
                    avatarLetter.replaceChildren(img);
                }
            }
            if (userName) userName.textContent = user.name;
        } else {
            if (loginLink) loginLink.style.display = "inline-flex";
            if (userMenu) userMenu.style.display = "none";
        }
    }
}
