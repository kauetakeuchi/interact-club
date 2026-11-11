const CONNECTION_ERROR = "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";

async function readJson(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

function errorFromResponse(res, data, fallback) {
    const error = new Error(data.message || fallback);
    error.status = res.status;
    error.code = data.code;
    return error;
}

export class Auth {
    constructor() {
        this.userKey = "user";
    }

    getUser() {
        try {
            const raw = localStorage.getItem(this.userKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    setUser(user) {
        try {
            localStorage.setItem(this.userKey, JSON.stringify(user));
        } catch {}
    }

    isAuthenticated() {
        return Boolean(this.getUser());
    }

    clearSession() {
        try {
            localStorage.removeItem(this.userKey);
        } catch {}
    }

    updateUser(user) {
        this.setUser({ ...(this.getUser() || {}), ...user });
    }

    async request(path, options = {}) {
        let res;
        try {
            res = await fetch(`/api/auth${path}`, {
                credentials: "same-origin",
                ...options,
            });
        } catch {
            const error = new Error(CONNECTION_ERROR);
            error.status = 0;
            throw error;
        }

        const data = await readJson(res);
        if (!res.ok) throw errorFromResponse(res, data, "Erro na requisição");
        return data;
    }

    json(method, path, body) {
        return this.request(path, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    }

    async refresh() {
        try {
            const user = await this.request("/me");
            this.setUser(user);
            return user;
        } catch (err) {
            if (err.status === 401) {
                this.clearSession();
                return null;
            }
            // Falha de rede não deve deslogar quem já estava conectado.
            return this.getUser();
        }
    }

    async login(email, password) {
        const data = await this.json("POST", "/login", { email, password });
        this.setUser(data.user);
        return data;
    }

    register(name, email, password, phone, birthDate, emailUpdatesOptIn = false) {
        return this.json("POST", "/register", { name, email, password, phone, birthDate, emailUpdatesOptIn });
    }

    verifyEmail(token) {
        return this.json("POST", "/verify-email", { token });
    }

    resendVerification(email) {
        return this.json("POST", "/resend-verification", { email });
    }

    forgotPassword(email) {
        return this.json("POST", "/forgot-password", { email });
    }

    resetPassword(token, password) {
        return this.json("POST", "/reset-password", { token, password });
    }

    async logout({ redirect = true } = {}) {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        } catch {}
        this.clearSession();
        if (redirect) window.location.href = "/";
    }
}
