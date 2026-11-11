import { api, toast } from "../../../lib/index.js";
import { esc, modalForm, closeModal, bindActions } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const avisos = await api.get("/admin/avisos");
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${avisos.length} avisos</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-avisos" placeholder="Buscar avisos..." aria-label="Buscar avisos">${icons.search}</div>
        <button class="btn btn-secondary" data-action="novo">${icons.plus} Novo Aviso</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-avisos"><thead><tr><th>Título</th><th>Conteúdo</th><th>Autor</th><th>Data</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${avisos.map((aviso) => `<tr>
        <td>${esc(aviso.title)}</td>
        <td><div class="cell-preview">${esc(aviso.content)}</div></td>
        <td>${aviso.author?.name ? esc(aviso.author.name) : "—"}</td>
        <td><div class="cell-date">${new Date(aviso.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td class="td-actions">
          <button class="btn-icon btn-icon-edit" data-action="editar" data-id="${esc(aviso.id)}" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(aviso.id)}" title="Excluir">${icons.trash}</button>
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

function noticeForm(aviso = null) {
    return `
    <div class="form-group"><label>Título</label><input type="text" id="f-av-title" class="form-control" value="${esc(aviso?.title || "")}" maxlength="255" required></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-av-content" class="form-control" rows="6" maxlength="10000" required>${esc(aviso?.content || "")}</textarea></div>
    <button type="submit" class="btn btn-primary btn-full">${aviso ? "Salvar" : "Criar Aviso"}</button>`;
}

function readForm() {
    return {
        title: document.getElementById("f-av-title").value,
        content: document.getElementById("f-av-content").value,
    };
}

export function openForm(refresh = () => location.reload()) {
    modalForm("Novo Aviso", noticeForm(), async () => {
        await api.post("/admin/avisos", readForm());
        closeModal();
        toast.show("Aviso criado!");
        refresh();
    });
}

async function openEditForm(id, refresh) {
    const aviso = await api.get(`/admin/avisos/${encodeURIComponent(id)}`);
    modalForm("Editar Aviso", noticeForm(aviso), async () => {
        await api.put(`/admin/avisos/${encodeURIComponent(id)}`, readForm());
        closeModal();
        toast.show("Aviso atualizado!");
        refresh();
    });
}

async function remove(id, refresh) {
    if (!confirm("Excluir este aviso? Esta ação não pode ser desfeita.")) return;
    await api.del(`/admin/avisos/${encodeURIComponent(id)}`);
    toast.show("Aviso excluído!");
    refresh();
}
