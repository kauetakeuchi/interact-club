import { api, toast } from "../../../lib/index.js";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "../../../lib/constants.js";
import { esc, modalForm } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const m = await api.get("/membros");
    const active = m.filter(u => u.status === "ACTIVE").length;
    const admins = m.filter(u => u.role === "ADMIN").length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${m.length} total</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${active} ativos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${admins} admins</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar membros..." onkeyup="filtrarTabela(this)">${icons.search}</div>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-membros"><thead><tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Função</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${m.map(u => `<tr>
        <td><div class="cell-name"><div class="cell-avatar">${esc(u.name.charAt(0).toUpperCase())}</div>${esc(u.name)}</div></td>
        <td><span class="cell-email">${esc(u.email)}</span></td>
        <td>${u.position ? esc(u.position) : '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge badge-${u.role === "ADMIN" ? "red" : u.role === "DIRECTOR" ? "warning" : "gray"}">${USER_ROLE_LABELS[u.role] || u.role}</span></td>
        <td><span class="status-dot status-${u.status === "ACTIVE" ? "green" : u.status === "PENDING" ? "amber" : "gray"}"></span><span class="status-label">${USER_STATUS_LABELS[u.status] || u.status}</span></td>
        <td class="td-actions">
          <button class="btn-icon" onclick="editarMembro('${u.id}','${esc(u.name)}','${esc(u.email)}','${esc(u.position || "")}','${u.role}','${u.status}')" title="Editar">${icons.edit}</button>
          ${u.role !== "ADMIN" ? `<button class="btn-icon btn-icon-danger" onclick="excluirMembro('${u.id}')" title="Excluir">${icons.trash}</button>` : ""}
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

window.editarMembro = async (id, name, email, position, role, status) => {
    modalForm("Editar Membro", `
    <div class="form-row"><div class="form-group"><label>Nome</label><input type="text" id="f-mem-name" class="form-control" value="${esc(name)}"></div>
    <div class="form-group"><label>Email</label><input type="email" id="f-mem-email" class="form-control" value="${esc(email)}"></div></div>
    <div class="form-group"><label>Cargo</label><input type="text" id="f-mem-pos" class="form-control" value="${esc(position)}" placeholder="Ex: Presidente, Tesoureiro..."></div>
    <div class="form-row">
      <div class="form-group"><label>Função</label><select id="f-mem-role" class="form-control"><option value="MEMBER" ${role === "MEMBER" ? "selected" : ""}>Membro</option><option value="DIRECTOR" ${role === "DIRECTOR" ? "selected" : ""}>Diretor</option><option value="ADMIN" ${role === "ADMIN" ? "selected" : ""}>Admin</option></select></div>
      <div class="form-group"><label>Status</label><select id="f-mem-status" class="form-control"><option value="ACTIVE" ${status === "ACTIVE" ? "selected" : ""}>Ativo</option><option value="PENDING" ${status === "PENDING" ? "selected" : ""}>Pendente</option><option value="INACTIVE" ${status === "INACTIVE" ? "selected" : ""}>Inativo</option></select></div>
    </div>
    <button type="submit" class="btn btn-primary btn-full">Salvar</button>`, "return salvarEdicaoMembro(event, '" + id + "')");
};

window.salvarEdicaoMembro = async (e, id) => {
    e.preventDefault();
    const data = {};
    const name = document.getElementById("f-mem-name").value;
    const email = document.getElementById("f-mem-email").value;
    const position = document.getElementById("f-mem-pos").value;
    const role = document.getElementById("f-mem-role").value;
    const status = document.getElementById("f-mem-status").value;
    if (name)
        data.name = name;
    if (email)
        data.email = email;
    if (position)
        data.position = position;
    data.role = role;
    data.status = status;
    try {
        await api.put(`/membros/${id}`, data);
        toast.show("Membro atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirMembro = async (id) => {
    if (!confirm("Excluir membro?"))
        return;
    try {
        await api.del(`/membros/${id}`);
        toast.show("Membro excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
