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
        if (!res.ok) {
            const error = new Error(data.message || "Erro no login");
            error.code = data.code;
            throw error;
        }
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
        if (!res.ok) {
            const error = new Error(data.message || "Erro no cadastro");
            error.code = data.code;
            throw error;
        }
        return data;
    }
    async verifyEmail(token) {
        const res = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
            const error = new Error(data.message || "Erro ao confirmar email");
            error.code = data.code;
            throw error;
        }
        return data;
    }
    async resendVerification(email) {
        const res = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.message || "Erro ao reenviar verificação");
        return data;
    }
    logout() {
        this.clearSession();
        window.location.href = "/";
    }
}
