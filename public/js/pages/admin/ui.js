import { toast } from "../../lib/index.js";
import { esc } from "../../lib/security.js";

export { esc };

// --- Modal genérico de formulário ---

export function closeModal() {
    const overlay = document.getElementById("modal");
    if (!overlay) return;
    overlay.dispatchEvent(new Event("modal:close"));
    overlay.remove();
}

export function modalForm(title, html, onSubmit) {
    closeModal();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "modal";
    overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <button type="button" class="close" data-modal-close aria-label="Fechar">✕</button>
      <h2>${esc(title)}</h2>
      <form id="modal-form">${html}</form>
    </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-modal-close]")) closeModal();
    });

    const onKeydown = (event) => {
        if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeydown);
    overlay.addEventListener("modal:close", () => document.removeEventListener("keydown", onKeydown));

    const form = overlay.querySelector("form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            await onSubmit(event, form);
        } catch (err) {
            toast.show(err.message || "Não foi possível salvar.", "error");
        } finally {
            if (submit) submit.disabled = false;
        }
    });

    bindUploads(overlay);
    setTimeout(() => overlay.querySelector("input, textarea, select")?.focus(), 100);
    return overlay;
}

// --- Upload de imagem ---

export function uploadField(id, value = "") {
    const preview = value
        ? `<img src="${esc(value)}" alt="">`
        : `<div class="upload-placeholder">Clique para adicionar imagem</div>`;
    return `<div class="upload-area" data-upload-area role="button" tabindex="0" aria-label="Adicionar imagem">
      <div class="upload-preview">${preview}</div>
      <input type="file" accept="image/*" hidden data-upload-input data-target="${esc(id)}">
    </div>
    <input type="hidden" id="${esc(id)}" value="${esc(value)}">`;
}

async function uploadImage(file) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Não foi possível enviar a imagem.");
    return data.url;
}

export function bindUploads(root) {
    root.addEventListener("click", (event) => {
        if (event.target.closest("input")) return;
        const area = event.target.closest("[data-upload-area]");
        area?.querySelector('input[type="file"]')?.click();
    });

    root.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const area = event.target.closest("[data-upload-area]");
        if (!area) return;
        event.preventDefault();
        area.querySelector('input[type="file"]')?.click();
    });

    root.addEventListener("change", async (event) => {
        const input = event.target.closest("[data-upload-input]");
        const file = input?.files?.[0];
        if (!file) return;

        const area = input.closest("[data-upload-area]");
        const preview = area?.querySelector(".upload-preview");
        if (preview) preview.innerHTML = '<div class="upload-placeholder">Enviando imagem...</div>';

        try {
            const url = await uploadImage(file);
            const target = document.getElementById(input.dataset.target);
            if (target) target.value = url;
            if (preview) preview.innerHTML = `<img src="${esc(url)}" alt="">`;
        } catch (err) {
            if (preview) preview.innerHTML = '<div class="upload-placeholder">Clique para adicionar imagem</div>';
            toast.show(err.message || "Erro ao enviar imagem", "error");
        } finally {
            input.value = "";
        }
    });
}

// --- Busca nas tabelas ---

export function bindTableSearch(root) {
    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-table-search]");
        if (!input) return;
        const table = document.getElementById(input.dataset.tableSearch);
        if (!table) return;

        const query = input.value.trim().toLowerCase();
        table.querySelectorAll("tbody tr").forEach((row) => {
            row.hidden = Boolean(query) && !row.textContent.toLowerCase().includes(query);
        });
    });
}

// --- Ações declaradas no HTML (sem handlers inline) ---

export function bindActions(root, handlers) {
    root.addEventListener("click", async (event) => {
        const trigger = event.target.closest("[data-action]");
        if (!trigger || !root.contains(trigger)) return;

        const handler = handlers[trigger.dataset.action];
        if (!handler) return;

        event.preventDefault();
        if (trigger.tagName === "BUTTON") trigger.disabled = true;
        try {
            await handler(trigger.dataset, trigger);
        } catch (err) {
            toast.show(err.message || "Não foi possível concluir a ação.", "error");
        } finally {
            if (trigger.tagName === "BUTTON") trigger.disabled = false;
        }
    });
}

// --- Datas para inputs nativos ---

const pad = (value) => String(value).padStart(2, "0");

export function toDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInput(value) {
    if (!value) return "";
    const date = new Date(value);
    return `${toDateInput(value)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
