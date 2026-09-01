import { api, toast } from "../../../lib/index.js";
import { esc, modalForm } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const a = await api.get("/admin/avisos");
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${a.length} avisos</span>
      </div>
      <div class="section-bar-actions">
        <button class="btn btn-secondary" onclick="mostrarFormAviso()">${icons.plus} Novo Aviso</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-avisos"><thead><tr><th>Título</th><th>Conteúdo</th><th>Autor</th><th>Data</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${a.map((x) => `<tr>
        <td>${esc(x.title)}</td>
        <td><div class="cell-preview">${esc(x.content)}</div></td>
        <td>${x.author?.name ? esc(x.author.name) : "—"}</td>
        <td><div class="cell-date">${new Date(x.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td class="td-actions">
          <button class="btn-icon btn-icon-edit" onclick="editarAviso('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirAviso('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

window.mostrarFormAviso = () => {
    modalForm("Novo Aviso", `
    <div class="form-group"><label>Título</label><input type="text" id="f-av-title" class="form-control" required></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-av-content" class="form-control" required rows="6"></textarea></div>
    <button type="submit" class="btn btn-primary btn-full">Criar Aviso</button>`, "return salvarAviso(event)");
};

window.salvarAviso = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-av-title").value,
        content: document.getElementById("f-av-content").value,
    };
    try {
        await api.post("/admin/avisos", data);
        toast.show("Aviso criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.editarAviso = async (id) => {
    try {
        const a = await api.get(`/admin/avisos/${id}`);
        modalForm("Editar Aviso", `
      <div class="form-group"><label>Título</label><input type="text" id="f-av-title" class="form-control" value="${esc(a.title)}" required></div>
      <div class="form-group"><label>Conteúdo</label><textarea id="f-av-content" class="form-control" required rows="6">${esc(a.content)}</textarea></div>
      <button type="submit" class="btn btn-primary btn-full">Salvar</button>`, "return salvarEdicaoAviso(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.salvarEdicaoAviso = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-av-title").value,
        content: document.getElementById("f-av-content").value,
    };
    try {
        await api.put(`/admin/avisos/${id}`, data);
        toast.show("Aviso atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirAviso = async (id) => {
    if (!confirm("Excluir aviso?"))
        return;
    try {
        await api.del(`/admin/avisos/${id}`);
        toast.show("Aviso excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
