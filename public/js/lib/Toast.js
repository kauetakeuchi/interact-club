export class Toast {
    constructor() {
        this.container = document.getElementById("toast-container") || (() => {
            const el = document.createElement("div");
            el.id = "toast-container";
            el.className = "toast-container";
            document.body.appendChild(el);
            return el;
        })();
    }
    show(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}
