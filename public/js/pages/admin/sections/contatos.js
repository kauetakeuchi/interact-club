import { api, toast } from "../../../lib/index.js";
import { esc, bindActions } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const contatos = await api.get("/admin/contatos");
    const novas = contatos.filter((contato) => !contato.isRead).length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${contatos.length} mensagens</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${novas} não lidas</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-contatos" placeholder="Buscar mensagens..." aria-label="Buscar mensagens">${icons.search}</div>
      </div>
    </div>
    ${contatos.length === 0 ? `<div class="empty-state"><h3>Nenhuma mensagem recebida</h3><p>Mensagens enviadas pelo formulário de contato aparecem aqui.</p></div>` : `
    <div class="table-wrap"><table class="admin-table" id="tabela-contatos"><thead><tr><th>Nome</th><th>Email</th><th>Assunto</th><th>Mensagem</th><th>Data</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${contatos.map((contato) => `<tr>
        <td><div class="cell-name"><div class="cell-avatar">${esc(contato.name.charAt(0).toUpperCase())}</div>${esc(contato.name)}</div></td>
        <td><span class="cell-email">${esc(contato.email)}</span>${contato.phone ? `<div class="cell-time">${esc(contato.phone)}</div>` : ""}</td>
        <td>${esc(contato.subject)}</td>
        <td><div class="cell-preview">${esc(contato.message)}</div></td>
        <td><div class="cell-date">${new Date(contato.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td><span class="status-dot status-${contato.isRead ? "green" : "amber"}"></span><span class="status-label">${contato.isRead ? "Lida" : "Nova"}</span></td>
        <td class="td-actions">
          ${contato.isRead ? "" : `<button class="btn-icon" data-action="lida" data-id="${esc(contato.id)}" title="Marcar como lida">${icons.check}</button>`}
          <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(contato.id)}" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`}`;
}

export function bind(root, { refresh }) {
    bindActions(root, {
        lida: ({ id }) => markRead(id, refresh),
        excluir: ({ id }) => remove(id, refresh),
    });
}

async function markRead(id, refresh) {
    await api.put(`/admin/contatos/${encodeURIComponent(id)}/lida`);
    toast.show("Mensagem marcada como lida!");
    refresh();
}

async function remove(id, refresh) {
    if (!confirm("Excluir esta mensagem? Esta ação não pode ser desfeita.")) return;
    await api.del(`/admin/contatos/${encodeURIComponent(id)}`);
    toast.show("Mensagem excluída!");
    refresh();
}
