import { api, toast, auth } from "../../../lib/index.js";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "../../../lib/constants.js";
import { esc, modalForm, closeModal, bindActions } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const membros = await api.get("/membros");
    const ativos = membros.filter((membro) => membro.status === "ACTIVE" && membro.emailVerifiedAt).length;
    const semConfirmar = membros.filter((membro) => !membro.emailVerifiedAt).length;
    const admins = membros.filter((membro) => membro.role === "ADMIN").length;
    const currentUser = auth.getUser();

    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${membros.length} total</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${ativos} ativos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${semConfirmar} sem confirmar email</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${admins} admins</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-membros" placeholder="Buscar membros..." aria-label="Buscar membros">${icons.search}</div>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-membros"><thead><tr><th>Nome</th><th>Email</th><th>Verificação</th><th>Cargo</th><th>Função</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${membros.map((membro) => `<tr>
        <td><div class="cell-name"><div class="cell-avatar">${esc(membro.name.charAt(0).toUpperCase())}</div>${esc(membro.name)}</div></td>
        <td><span class="cell-email">${esc(membro.email)}</span></td>
        <td><span class="status-dot status-${membro.emailVerifiedAt ? "green" : "amber"}"></span><span class="status-label">${membro.emailVerifiedAt ? "Confirmado" : "Pendente"}</span></td>
        <td>${membro.position ? esc(membro.position) : '<span class="cell-empty">—</span>'}</td>
        <td><span class="badge badge-${membro.role === "ADMIN" ? "red" : membro.role === "DIRECTOR" ? "warning" : "gray"}">${USER_ROLE_LABELS[membro.role] || membro.role}</span></td>
        <td><span class="status-dot status-${membro.status === "ACTIVE" ? "green" : membro.status === "PENDING" ? "amber" : "gray"}"></span><span class="status-label">${USER_STATUS_LABELS[membro.status] || membro.status}</span></td>
        <td class="td-actions">
          <button class="btn-icon" data-action="editar" data-id="${esc(membro.id)}" title="Editar">${icons.edit}</button>
          ${membro.role !== "ADMIN" && membro.id !== currentUser?.id ? `<button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(membro.id)}" data-name="${esc(membro.name)}" title="Excluir">${icons.trash}</button>` : ""}
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

export function bind(root, { refresh }) {
    bindActions(root, {
        editar: ({ id }) => openEditForm(id, refresh),
        excluir: ({ id, name }) => remove(id, name, refresh),
    });
}

function memberForm(membro) {
    return `
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input type="text" id="f-mem-name" class="form-control" value="${esc(membro.name)}" maxlength="255" required></div>
      <div class="form-group"><label>Email</label><input type="email" id="f-mem-email" class="form-control" value="${esc(membro.email)}" maxlength="255" required></div>
    </div>
    <div class="form-group"><label>Cargo</label><input type="text" id="f-mem-pos" class="form-control" value="${esc(membro.position || "")}" maxlength="255" placeholder="Ex: Presidente, Tesoureiro..."></div>
    <div class="form-row">
      <div class="form-group"><label>Função</label><select id="f-mem-role" class="form-control">
        <option value="MEMBER" ${membro.role === "MEMBER" ? "selected" : ""}>Membro</option>
        <option value="DIRECTOR" ${membro.role === "DIRECTOR" ? "selected" : ""}>Diretor</option>
        <option value="ADMIN" ${membro.role === "ADMIN" ? "selected" : ""}>Admin</option>
      </select></div>
      <div class="form-group"><label>Status</label><select id="f-mem-status" class="form-control">
        <option value="ACTIVE" ${membro.status === "ACTIVE" ? "selected" : ""}>Ativo</option>
        <option value="PENDING" ${membro.status === "PENDING" ? "selected" : ""}>Pendente</option>
        <option value="INACTIVE" ${membro.status === "INACTIVE" ? "selected" : ""}>Inativo</option>
      </select></div>
    </div>
    <div class="form-group"><label>Nova senha <small>opcional</small></label><input type="password" id="f-mem-password" class="form-control" minlength="8" autocomplete="new-password" placeholder="Deixe em branco para manter a atual"><small style="color:var(--text-muted);">Ao trocar, as sessões abertas desse membro são encerradas.</small></div>
    <button type="submit" class="btn btn-primary btn-full">Salvar</button>`;
}

async function openEditForm(id, refresh) {
    const membros = await api.get("/membros");
    const membro = membros.find((item) => item.id === id);
    if (!membro) throw new Error("Membro não encontrado.");

    modalForm("Editar Membro", memberForm(membro), async () => {
        const password = document.getElementById("f-mem-password").value;
        const payload = {
            name: document.getElementById("f-mem-name").value,
            email: document.getElementById("f-mem-email").value,
            position: document.getElementById("f-mem-pos").value || null,
            role: document.getElementById("f-mem-role").value,
            status: document.getElementById("f-mem-status").value,
        };
        if (password) payload.password = password;

        const updated = await api.put(`/membros/${encodeURIComponent(id)}`, payload);
        closeModal();

        if (updated.emailVerificationSent) {
            toast.show("Membro atualizado. Enviamos um novo link de verificação para o email.");
        } else {
            toast.show("Membro atualizado!");
        }

        // Mudanças no próprio perfil também alteram o cabeçalho do painel.
        if (auth.getUser()?.id === id) {
            location.reload();
            return;
        }
        refresh();
    });
}

async function remove(id, name, refresh) {
    if (!confirm(`Excluir o membro "${name}"? Esta ação não pode ser desfeita.`)) return;
    await api.del(`/membros/${encodeURIComponent(id)}`);
    toast.show("Membro excluído!");
    refresh();
}
