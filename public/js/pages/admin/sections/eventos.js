import { api, toast } from "../../../lib/index.js";
import { esc, modalForm, closeModal, uploadField, toDateTimeInput, bindActions } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const eventos = await api.get("/admin/eventos");
    const totalInscritos = eventos.reduce((sum, item) => sum + (item.signupCount || 0), 0);
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${eventos.length} eventos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${totalInscritos} inscrições</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-eventos" placeholder="Buscar eventos..." aria-label="Buscar eventos">${icons.search}</div>
        <button class="btn btn-secondary" data-action="novo">${icons.plus} Novo Evento</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-eventos"><thead><tr><th>Título</th><th>Data</th><th>Local</th><th>Inscritos</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${eventos.map((evento) => `<tr>
        <td>${esc(evento.title)}</td>
        <td><div class="cell-date">${new Date(evento.date).toLocaleDateString("pt-BR")}</div><div class="cell-time">${new Date(evento.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div></td>
        <td>${evento.location ? esc(evento.location) : '<span class="cell-empty">—</span>'}</td>
        <td><div class="signup-cell">${evento.maxParticipants ? `<div class="signup-bar"><div class="signup-fill" style="width:${Math.min(100, (evento.signupCount / evento.maxParticipants) * 100)}%"></div></div><span class="signup-text">${evento.signupCount}/${evento.maxParticipants}</span>` : `<span class="signup-text">${evento.signupCount} inscritos</span>`}</div></td>
        <td><span class="badge ${evento.isPublic ? "badge-positive" : "badge-gray"}">${evento.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/eventos?id=${encodeURIComponent(evento.id)}" target="_blank" rel="noopener" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" data-action="editar" data-id="${esc(evento.id)}" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(evento.id)}" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

export function bind(root, { refresh }) {
    bindActions(root, {
        novo: () => openForm(refresh),
        editar: ({ id }) => openEditForm(id, refresh),
        excluir: ({ id }) => remove(id, refresh),
    });
}

function eventForm(evento = null) {
    const isEdit = Boolean(evento);
    const isPublic = evento ? Boolean(evento.isPublic) : true;
    return `
    <div class="form-group"><label>Título</label><input type="text" id="f-ev-title" class="form-control" value="${esc(evento?.title || "")}" maxlength="255" required></div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input type="datetime-local" id="f-ev-date" class="form-control" value="${toDateTimeInput(evento?.date)}" required></div>
      <div class="form-group"><label>Local</label><input type="text" id="f-ev-location" class="form-control" value="${esc(evento?.location || "")}" maxlength="255" placeholder="Local"></div>
    </div>
    <div class="form-group"><label>Vagas máximas</label><input type="number" id="f-ev-max" class="form-control" value="${evento?.maxParticipants ?? ""}" min="1" placeholder="Deixe vazio para ilimitado"></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-ev-desc" class="form-control" rows="4" maxlength="10000" required>${esc(evento?.description || "")}</textarea></div>
    <div class="form-group"><label>Imagem</label>${uploadField("f-ev-img", evento?.imageUrl || "")}</div>
    <label class="toggle"><input type="checkbox" id="f-ev-public" ${isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full modal-submit">${isEdit ? "Salvar" : "Criar Evento"}</button>`;
}

function readForm() {
    return {
        title: document.getElementById("f-ev-title").value,
        date: document.getElementById("f-ev-date").value,
        location: document.getElementById("f-ev-location").value || null,
        maxParticipants: Number.parseInt(document.getElementById("f-ev-max").value, 10) || null,
        description: document.getElementById("f-ev-desc").value,
        imageUrl: document.getElementById("f-ev-img").value || null,
        isPublic: document.getElementById("f-ev-public").checked,
    };
}

export function openForm(refresh = () => location.reload()) {
    modalForm("Novo Evento", eventForm(), async () => {
        await api.post("/admin/eventos", readForm());
        closeModal();
        toast.show("Evento criado!");
        refresh();
    });
}

async function openEditForm(id, refresh) {
    const evento = await api.get(`/admin/eventos/${encodeURIComponent(id)}`);
    modalForm("Editar Evento", eventForm(evento), async () => {
        await api.put(`/admin/eventos/${encodeURIComponent(id)}`, readForm());
        closeModal();
        toast.show("Evento atualizado!");
        refresh();
    });
}

async function remove(id, refresh) {
    if (!confirm("Excluir este evento? Esta ação não pode ser desfeita.")) return;
    await api.del(`/admin/eventos/${encodeURIComponent(id)}`);
    toast.show("Evento excluído!");
    refresh();
}
