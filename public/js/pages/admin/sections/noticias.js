import { api, toast } from "../../../lib/index.js";
import { CATEGORY_COLORS } from "../../../lib/constants.js";
import { esc, modalForm } from "../ui.js";
import { icons } from "../icons.js";

export async function render() {
    const n = await api.get("/admin/noticias");
    const pub = n.filter((x) => x.published).length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${n.length} notícias</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${pub} publicadas</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" placeholder="Buscar notícias..." onkeyup="filtrarTabela(this)">${icons.search}</div>
        <button class="btn btn-secondary" onclick="mostrarFormNoticia()">${icons.plus} Nova Notícia</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-noticias"><thead><tr><th>Título</th><th>Categoria</th><th>Autor</th><th>Data</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${n.map((x) => `<tr>
        <td>${esc(x.title)}</td>
        <td>${x.category ? `<span class="cat-badge" style="--cat-cor:${CATEGORY_COLORS[x.category] || "#666"}">${esc(x.category)}</span>` : '<span class="cell-empty">—</span>'}</td>
        <td>${x.author?.name ? esc(x.author.name) : "—"}</td>
        <td><div class="cell-date">${new Date(x.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td><span class="pub-indicator ${x.published ? "pub-yes" : "pub-no"}"></span><span>${x.published ? "Publicado" : "Rascunho"}</span></td>
        <td class="td-actions">
          <a href="/noticias?slug=${encodeURIComponent(x.slug)}" target="_blank" class="btn-icon" title="Visualizar">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" onclick="editarNoticia('${x.id}')" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" onclick="excluirNoticia('${x.id}')" title="Excluir">${icons.trash}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

window.mostrarFormNoticia = () => {
    modalForm("Nova Notícia", `
    <div class="form-group"><label>Título</label><input type="text" id="f-no-title" class="form-control" required></div>
    <div class="form-row">
      <div class="form-group"><label>Slug</label><input type="text" id="f-no-slug" class="form-control" required placeholder="meu-slug"></div>
      <div class="form-group"><label>Categoria</label><select id="f-no-cat" class="form-control"><option value="">Geral</option><option>Projetos</option><option>Eventos</option><option>Clube</option><option>Campanhas</option><option>Parcerias</option></select></div>
    </div>
    <div class="form-group"><label>Resumo</label><textarea id="f-no-excerpt" class="form-control" rows="2"></textarea></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-no-content" class="form-control" required rows="6"></textarea></div>
    <div class="form-group"><label>Imagem</label><div class="upload-area" id="no-img-area" onclick="document.getElementById('f-no-img-file').click()"><div class="upload-placeholder">Clique para adicionar imagem</div></div><input type="file" id="f-no-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-no-img','no-img-area')"><input type="hidden" id="f-no-img"></div>
    <label class="toggle"><input type="checkbox" id="f-no-pub"><div class="toggle-slider"></div><span class="toggle-label">Publicar</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Criar Notícia</button>`, "return salvarNoticia(event)");
};

window.salvarNoticia = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-no-title").value,
        slug: document.getElementById("f-no-slug").value,
        category: document.getElementById("f-no-cat").value || null,
        excerpt: document.getElementById("f-no-excerpt").value || null,
        content: document.getElementById("f-no-content").value,
        imageUrl: document.getElementById("f-no-img").value || null,
        published: document.getElementById("f-no-pub").checked,
    };
    try {
        await api.post("/admin/noticias", data);
        toast.show("Notícia criada!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.editarNoticia = async (id) => {
    try {
        const n = await api.get(`/admin/noticias/${id}`);
        modalForm("Editar Notícia", `
      <div class="form-group"><label>Título</label><input type="text" id="f-no-title" class="form-control" value="${esc(n.title)}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Slug</label><input type="text" id="f-no-slug" class="form-control" value="${esc(n.slug)}" required placeholder="meu-slug"></div>
        <div class="form-group"><label>Categoria</label><select id="f-no-cat" class="form-control"><option value="">Geral</option><option ${n.category === "Projetos" ? "selected" : ""}>Projetos</option><option ${n.category === "Eventos" ? "selected" : ""}>Eventos</option><option ${n.category === "Clube" ? "selected" : ""}>Clube</option><option ${n.category === "Campanhas" ? "selected" : ""}>Campanhas</option><option ${n.category === "Parcerias" ? "selected" : ""}>Parcerias</option></select></div>
      </div>
      <div class="form-group"><label>Resumo</label><textarea id="f-no-excerpt" class="form-control" rows="2">${esc(n.excerpt || "")}</textarea></div>
      <div class="form-group"><label>Conteúdo</label><textarea id="f-no-content" class="form-control" required rows="6">${esc(n.content)}</textarea></div>
      <div class="form-group"><label>Imagem</label><div class="upload-area" id="no-edit-img-area" onclick="document.getElementById('f-no-edit-img-file').click()">${n.imageUrl ? `<img src="${esc(n.imageUrl)}" style="max-height:12rem;margin:0 auto;">` : `<div class="upload-placeholder">Clique para adicionar imagem</div>`}</div><input type="file" id="f-no-edit-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'f-no-img','no-edit-img-area')"><input type="hidden" id="f-no-img" value="${esc(n.imageUrl || "")}"></div>
      <label class="toggle"><input type="checkbox" id="f-no-pub" ${n.published ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Publicar</span></label>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">Salvar</button>`, "return salvarEdicaoNoticia(event, '" + id + "')");
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.salvarEdicaoNoticia = async (e, id) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("f-no-title").value,
        slug: document.getElementById("f-no-slug").value,
        category: document.getElementById("f-no-cat").value || null,
        excerpt: document.getElementById("f-no-excerpt").value || null,
        content: document.getElementById("f-no-content").value,
        imageUrl: document.getElementById("f-no-img").value || null,
        published: document.getElementById("f-no-pub").checked,
    };
    try {
        await api.put(`/admin/noticias/${id}`, data);
        toast.show("Notícia atualizada!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};

window.excluirNoticia = async (id) => {
    if (!confirm("Excluir notícia?"))
        return;
    try {
        await api.del(`/admin/noticias/${id}`);
        toast.show("Notícia excluída!");
        location.reload();
    }
    catch (err) {
        toast.show(err.message, "error");
    }
};
