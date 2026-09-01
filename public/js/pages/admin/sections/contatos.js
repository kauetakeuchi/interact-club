import { api, toast } from "../../../lib/index.js";
import { esc } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const c = await api.get("/admin/contatos");
    const novas = c.filter((x) => !x.isRead).length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${c.length} mensagens</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${novas} não lidas</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar mensagens..." onkeyup="filtrarTabela(this)">${icons.search}</div>
      </div>
    </div>
    ${c.length === 0 ? `<div class="empty-state"><h3>Nenhuma mensagem recebida</h3><p>Mensagens enviadas pelo formulário de contato aparecem aqui.</p></div>` : `
    <div class="table-wrap"><table class="admin-table" id="tabela-contatos"><thead><tr><th>Nome</th><th>Email</th><th>Assunto</th><th>Mensagem</th><th>Data</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${c.map((x) => `<tr>
        <td><div class="cell-name"><div class="cell-avatar">${esc(x.name.charAt(0).toUpperCase())}</div>${esc(x.name)}</div></td>
        <td><span class="cell-email">${esc(x.email)}</span>${x.phone ? `<div class="cell-time">${esc(x.phone)}</div>` : ""}</td>
        <td>${esc(x.subject)}</td>
        <td><div class="cell-preview">${esc(x.message)}</div></td>
        <td><div class="cell-date">${new Date(x.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td><span class="status-dot status-${x.isRead ? "green" : "amber"}"></span><span class="status-label">${x.isRead ? "Lida" : "Nova"}</span></td>
        <td class="td-actions">
          ${x.isRead ? "" : `<button class="btn-icon" onclick="marcarContatoLido('${x.id}')" title="Marcar como lida">${icons.check}</button>`}
          <button class="btn-icon btn-icon-danger" onclick="excluirContato('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`}`;
}

window.marcarContatoLido = async (id) => {
    try {
        await api.put(`/admin/contatos/${id}/lida`);
        toast.show("Mensagem marcada como lida!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirContato = async (id) => {
    if (!confirm("Excluir esta mensagem?"))
        return;
    try {
        await api.del(`/admin/contatos/${id}`);
        toast.show("Mensagem excluída!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
