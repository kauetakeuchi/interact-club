import { toast } from "../../lib/index.js";

export function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// --- Filtro de busca nas tabelas ---
window.filtrarTabela = (input) => {
    const q = input.value.toLowerCase();
    const table = input.closest(".section-bar")?.nextElementSibling?.querySelector("table");
    if (!table)
        return;
    table.querySelectorAll("tbody tr").forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
};

// --- Modal genérico de formulário ---
export function modalForm(title, html, onSubmit) {
    document.getElementById("modal")?.remove();
    const m = document.createElement("div");
    m.className = "modal-overlay";
    m.id = "modal";
    m.innerHTML = `<div class="modal"><button class="close" onclick="this.closest('.modal-overlay').remove()">✕</button><h2>${title}</h2><form id="modal-form" onsubmit="${onSubmit}">${html}</form></div>`;
    document.body.appendChild(m);
    setTimeout(() => m.querySelector("input,textarea,select")?.focus(), 100);
}

// --- Upload de imagem ---
window.handleImageUpload = async (e, inputId, areaId) => {
    const file = e.target.files?.[0];
    if (!file)
        return;
    const fd = new FormData();
    fd.append("file", file);
    try {
        const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("token") }, body: fd });
        const data = await res.json();
        if (data.url) {
            document.getElementById(inputId).value = data.url;
            const area = document.getElementById(areaId);
            if (area)
                area.innerHTML = `<img src="${data.url}" style="max-height:12rem;margin:0 auto;">`;
        }
    }
    catch {
        toast.show("Erro ao fazer upload", "error");
    }
};
