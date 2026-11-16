import { api, toast } from "../../../lib/index.js";
import { PROJECT_STATUS_LABELS } from "../../../lib/constants.js";
import { esc, modalForm, closeModal, uploadField, toDateInput, bindActions } from "../ui.js";
import { icons } from "../icons.js";

const statusClass = { PLANNING: "amber", IN_PROGRESS: "blue", COMPLETED: "green" };

export async function render() {
    const projetos = await api.get("/admin/projetos");
    const emAndamento = projetos.filter((projeto) => projeto.status === "IN_PROGRESS").length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${projetos.length} projetos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${emAndamento} em andamento</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-projetos" placeholder="Buscar projetos..." aria-label="Buscar projetos">${icons.search}</div>
        <button class="btn btn-secondary" data-action="novo">${icons.plus} Novo Projeto</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-projetos"><thead><tr><th>Título</th><th>Status</th><th>Início</th><th>Término</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${projetos.map((projeto) => `<tr>
        <td>${esc(projeto.title)}</td>
        <td><span class="status-dot status-${statusClass[projeto.status]}"></span><span class="status-label">${PROJECT_STATUS_LABELS[projeto.status] || projeto.status}</span></td>
        <td>${projeto.startDate ? `<div class="cell-date">${new Date(projeto.startDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td>${projeto.endDate ? `<div class="cell-date">${new Date(projeto.endDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge ${projeto.isPublic ? "badge-positive" : "badge-gray"}">${projeto.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/projetos?id=${encodeURIComponent(projeto.id)}" target="_blank" rel="noopener" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" data-action="editar" data-id="${esc(projeto.id)}" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(projeto.id)}" title="Excluir">${icons.trash}</button>
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

function projectForm(projeto = null) {
    const isEdit = Boolean(projeto);
    const isPublic = projeto ? Boolean(projeto.isPublic) : true;
    return `
    <div class="form-group"><label>Título</label><input type="text" id="f-pr-title" class="form-control" value="${esc(projeto?.title || "")}" maxlength="255" required></div>
    <div class="form-row">
      <div class="form-group"><label>Início</label><input type="date" id="f-pr-start" class="form-control" value="${toDateInput(projeto?.startDate)}"></div>
      <div class="form-group"><label>Término</label><input type="date" id="f-pr-end" class="form-control" value="${toDateInput(projeto?.endDate)}"></div>
    </div>
    <div class="form-group"><label>Status</label><select id="f-pr-status" class="form-control">
      <option value="PLANNING" ${projeto?.status === "PLANNING" ? "selected" : ""}>Planejamento</option>
      <option value="IN_PROGRESS" ${projeto?.status === "IN_PROGRESS" ? "selected" : ""}>Em Andamento</option>
      <option value="COMPLETED" ${projeto?.status === "COMPLETED" ? "selected" : ""}>Concluído</option>
    </select></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-pr-desc" class="form-control" rows="4" maxlength="10000" required>${esc(projeto?.description || "")}</textarea></div>
    <div class="form-group"><label>Imagem</label>${uploadField("f-pr-img", projeto?.imageUrl || "")}</div>
    <label class="toggle"><input type="checkbox" id="f-pr-public" ${isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full modal-submit">${isEdit ? "Salvar" : "Criar Projeto"}</button>`;
}

function readForm() {
    return {
        title: document.getElementById("f-pr-title").value,
        startDate: document.getElementById("f-pr-start").value || null,
        endDate: document.getElementById("f-pr-end").value || null,
        status: document.getElementById("f-pr-status").value,
        description: document.getElementById("f-pr-desc").value,
        imageUrl: document.getElementById("f-pr-img").value || null,
        isPublic: document.getElementById("f-pr-public").checked,
    };
}

export function openForm(refresh = () => location.reload()) {
    modalForm("Novo Projeto", projectForm(), async () => {
        await api.post("/admin/projetos", readForm());
        closeModal();
        toast.show("Projeto criado!");
        refresh();
    });
}

async function openEditForm(id, refresh) {
    const projeto = await api.get(`/admin/projetos/${encodeURIComponent(id)}`);
    modalForm("Editar Projeto", projectForm(projeto), async () => {
        await api.put(`/admin/projetos/${encodeURIComponent(id)}`, readForm());
        closeModal();
        toast.show("Projeto atualizado!");
        refresh();
    });
}

async function remove(id, refresh) {
    if (!confirm("Excluir este projeto? Esta ação não pode ser desfeita.")) return;
    await api.del(`/admin/projetos/${encodeURIComponent(id)}`);
    toast.show("Projeto excluído!");
    refresh();
}
