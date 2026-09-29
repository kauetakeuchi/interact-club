import { api, toast } from "../../../lib/index.js";
import { esc, modalForm } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const e = await api.get("/admin/eventos");
    const totalInscritos = e.reduce((sum, x) => sum + (x.signupCount || 0), 0);
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${e.length} eventos</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${totalInscritos} inscrições</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar eventos..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormEvento()">${icons.plus} Novo Evento</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-eventos"><thead><tr><th>Título</th><th>Data</th><th>Local</th><th>Inscritos</th><th>Visibilidade</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${e.map((x) => `<tr>
        <td>${esc(x.title)}</td>
        <td><div class="cell-date">${new Date(x.date).toLocaleDateString("pt-BR")}</div><div class="cell-time">${new Date(x.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div></td>
        <td>${x.location ? esc(x.location) : '<span class="cell-empty">—</span>'}</td>
        <td><div class="signup-cell">${x.maxParticipants ? `<div class="signup-bar"><div class="signup-fill" style="width:${Math.min(100, (x.signupCount / x.maxParticipants) * 100)}%"></div></div><span class="signup-text">${x.signupCount}/${x.maxParticipants}</span>` : `<span class="signup-text">${x.signupCount} inscritos</span>`}</div></td>
        <td><span class="badge ${x.isPublic ? "badge-positive" : "badge-gray"}">${x.isPublic ? "Público" : "Interno"}</span></td>
        <td class="td-actions">
          <a href="/eventos?id=${x.id}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarEvento('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirEvento('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

window.mostrarFormEvento = () => {
    modalForm("Novo Evento", `
    <div class="form-group"><label>Título</label><input type="text" id="f-ev-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Data</label><input type="datetime-local" id="f-ev-date" class="form-control" required></div>
      <div class="form-group"><label>Local</label><input type="text" id="f-ev-location" class="form-control" placeholder="Local"></div>
    </div>
    <div class="form-group"><label>Vagas máximas</label><input type="number" id="f-ev-max" class="form-control" min="0" placeholder="0 = ilimitado"></div>
    <div class="form-group"><label>Descrição</label><textarea id="f-ev-desc" class="form-control" required rows="4"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="ev-img-area" onclick="document.getElementById('f-ev-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-ev-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-ev-img','ev-img-area')"><input type="hidden" id="f-ev-img"></div>
    <label class="toggle"><input type="checkbox" id="f-ev-public" checked><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Evento</button>`, "return salvarEvento(event)");
};

window.salvarEvento = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-ev-title").value,
        date: document.getElementById("f-ev-date").value,
        location: document.getElementById("f-ev-location").value,
        maxParticipants: parseInt(document.getElementById("f-ev-max").value) || null,
        isPublic: document.getElementById("f-ev-public").checked,
        description: document.getElementById("f-ev-desc").value,
        imageUrl: document.getElementById("f-ev-img").value || null,
    };
    try {
        await api.post("/admin/eventos", data);
        toast.show("Evento criado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.editarEvento = async (id) => {
    try {
        const e = await api.get(`/admin/eventos/${id}`);
        modalForm("Editar Evento", `
      <div class="form-group"><label>Título</label><input type="text" id="f-ev-title" class="form-control" value="${esc(e.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Data</label><input type="datetime-local" id="f-ev-date" class="form-control" value="${new Date(e.date).toISOString().slice(0, 16)}" required></div>
        <div class="form-group"><label>Local</label><input type="text" id="f-ev-location" class="form-control" value="${esc(e.location || "")}" placeholder="Local"></div>
      </div>
      <div class="form-group"><label>Vagas máximas</label><input type="number" id="f-ev-max" class="form-control" value="${e.maxParticipants || ""}" min="0" placeholder="0 = ilimitado"></div>
      <div class="form-group"><label>Descrição</label><textarea id="f-ev-desc" class="form-control" required rows="4">${esc(e.description)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="ev-edit-img-area" onclick="document.getElementById('f-ev-edit-img-file').click()">${e.imageUrl ? `<img src="${esc(e.imageUrl)}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-ev-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-ev-edit-img','ev-edit-img-area')"><input type="hidden" id="f-ev-edit-img" value="${esc(e.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-ev-public" ${e.isPublic ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Público</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoEvento(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.salvarEdicaoEvento = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-ev-title").value,
        date: document.getElementById("f-ev-date").value,
        location: document.getElementById("f-ev-location").value,
        maxParticipants: parseInt(document.getElementById("f-ev-max").value) || null,
        isPublic: document.getElementById("f-ev-public").checked,
        description: document.getElementById("f-ev-desc").value,
        imageUrl: document.getElementById("f-ev-edit-img").value || null,
    };
    try {
        await api.put(`/admin/eventos/${id}`, data);
        toast.show("Evento atualizado!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirEvento = async (id) => {
    if (!confirm("Excluir evento?"))
        return;
    try {
        await api.del(`/admin/eventos/${id}`);
        toast.show("Evento excluído!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
