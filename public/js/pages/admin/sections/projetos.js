import { api, toast } from "../../../lib/index.js";
import { PROJECT_STATUS_LABELS } from "../../../lib/constants.js";
import { esc, modalForm } from "../ui.js";
import { icons } from "../icons.js";

const statusLabel = PROJECT_STATUS_LABELS;

export async function render() {
    const p = await api.get("/admin/projetos");
    const statusClass = { PLANNING: "amber", IN_PROGRESS: "blue", COMPLETED: "green" };
    const emAndamento = p.filter((x) => x.status === "IN_PROGRESS").length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${p.length} projetos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${emAndamento} em andamento</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar projetos..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormProjeto()">${icons.plus} Novo Projeto</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-projetos"><thead><tr><th>Título</th><th>Status</th><th>Início</th><th>Término</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${p.map((x) => `<tr>
        <td>${esc(x.title)}</td>
        <td><span class="status-dot status-${statusClass[x.status]}"></span><span class="status-label">${statusLabel[x.status] || x.status}</span></td>
        <td>${x.startDate ? `<div class="cell-date">${new Date(x.startDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td>${x.endDate ? `<div class="cell-date">${new Date(x.endDate).toLocaleDateString("pt-BR")}</div>` : '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge ${x.isPublic ? "badge-positive" : "badge-gray"}">${x.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/projetos?id=${x.id}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarProjeto('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirProjeto('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

window.mostrarFormProjeto = () => {
    modalForm("Novo Projeto", `
    <div class="form-group"><label>Título</label><input type="text" id="f-pr-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Início</label><input type="date" id="f-pr-start" class="form-control"></div>
      <div class="form-group"><label>Término</label><input type="date" id="f-pr-end" class="form-control"></div>
    </div>
    <div class="form-group"><label>Status</label><select id="f-pr-status" class="form-control"><option value="PLANNING">Planejamento</option><option value="IN_PROGRESS">Em Andamento</option><option value="COMPLETED">Concluído</option></select></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-pr-desc" class="form-control" required rows="4"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="pr-img-area" onclick="document.getElementById('f-pr-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-pr-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-pr-img','pr-img-area')"><input type="hidden" id="f-pr-img"></div>
    <label class="toggle"><input type="checkbox" id="f-pr-public" checked><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Projeto</button>`, "return salvarProjeto(event)");
};

window.salvarProjeto = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-pr-title").value,
        startDate: document.getElementById("f-pr-start").value || null,
        endDate: document.getElementById("f-pr-end").value || null,
        status: document.getElementById("f-pr-status").value,
        isPublic: document.getElementById("f-pr-public").checked,
        description: document.getElementById("f-pr-desc").value,
        imageUrl: document.getElementById("f-pr-img").value || null,
    };
    try {
        await api.post("/admin/projetos", data);
        toast.show("Projeto criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.editarProjeto = async (id) => {
    try {
        const p = await api.get(`/admin/projetos/${id}`);
        modalForm("Editar Projeto", `
      <div class="form-group"><label>Título</label><input type="text" id="f-pr-title" class="form-control" value="${esc(p.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Início</label><input type="date" id="f-pr-start" class="form-control" value="${p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : ""}"></div>
        <div class="form-group"><label>Término</label><input type="date" id="f-pr-end" class="form-control" value="${p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ""}"></div>
      </div>
      <div class="form-group"><label>Status</label><select id="f-pr-status" class="form-control"><option value="PLANNING" ${p.status === "PLANNING" ? "selected" : ""}>Planejamento</option><option value="IN_PROGRESS" ${p.status === "IN_PROGRESS" ? "selected" : ""}>Em Andamento</option><option value="COMPLETED" ${p.status === "COMPLETED" ? "selected" : ""}>Concluído</option></select></div>
      <div class="form-group"><label>Descrição</label><textarea id="f-pr-desc" class="form-control" required rows="4">${esc(p.description)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="pr-edit-img-area" onclick="document.getElementById('f-pr-edit-img-file').click()">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-pr-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-pr-edit-img','pr-edit-img-area')"><input type="hidden" id="f-pr-edit-img" value="${esc(p.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-pr-public" ${p.isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoProjeto(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.salvarEdicaoProjeto = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-pr-title").value,
        startDate: document.getElementById("f-pr-start").value || null,
        endDate: document.getElementById("f-pr-end").value || null,
        status: document.getElementById("f-pr-status").value,
        isPublic: document.getElementById("f-pr-public").checked,
        description: document.getElementById("f-pr-desc").value,
        imageUrl: document.getElementById("f-pr-edit-img").value || null,
    };
    try {
        await api.put(`/admin/projetos/${id}`, data);
        toast.show("Projeto atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirProjeto = async (id) => {
    if (!confirm("Excluir projeto?"))
        return;
    try {
        await api.del(`/admin/projetos/${id}`);
        toast.show("Projeto excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
