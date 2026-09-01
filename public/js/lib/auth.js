export class Auth {
    constructor() {
        this.tokenKey = "token";
        this.userKey = "user";
    }
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }
    getUser() {
        const raw = localStorage.getItem(this.userKey);
        return raw ? JSON.parse(raw) : null;
    }
    isAuthenticated() {
        return !!this.getToken();
    }
    setSession(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }
    updateUser(user) {
        const current = this.getUser() || {};
        this.setSession(this.getToken(), { ...current, ...user });
    }
    async login(email, password) {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.message || "Erro no login");
        this.setSession(data.token, data.user);
        return data;
    }
    async register(name, email, password, phone, birthDate) {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, phone, birthDate }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.message || "Erro no cadastro");
        this.setSession(data.token, data.user);
        return data;
    }
    logout() {
        this.clearSession();
        window.location.href = "/";
    }
}
