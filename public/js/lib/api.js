export class Api {
    constructor(auth) { this.auth = auth; }
    async request(method, path, body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const headers = { "Content-Type": "application/json" };
        const token = this.auth.getToken();
        if (token)
            headers["Authorization"] = `Bearer ${token}`;
        try {
            const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || "Erro na requisição");
            return data;
        }
        catch (err) {
            if (err.name === "AbortError")
                throw new Error("A conexão demorou demais. Verifique sua internet e tente novamente.");
            if (err.name === "TypeError")
                throw new Error("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.");
            throw err;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    get(path) { return this.request("GET", path); }
    post(path, body) { return this.request("POST", path, body); }
    put(path, body) { return this.request("PUT", path, body); }
    del(path) { return this.request("DELETE", path); }
}
