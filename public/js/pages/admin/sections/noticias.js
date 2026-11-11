import { api, toast } from "../../../lib/index.js";
import { CATEGORY_COLORS } from "../../../lib/constants.js";
import { esc, modalForm, closeModal, uploadField, bindActions } from "../ui.js";
import { icons } from "../icons.js";

const CATEGORIES = ["Projetos", "Eventos", "Clube", "Campanhas", "Parcerias"];

export async function render() {
    const noticias = await api.get("/admin/noticias");
    const publicadas = noticias.filter((noticia) => noticia.published).length;
    return `<div class="section-bar">
      <div class="section-bar-stats">
        <span class="section-bar-stat">${noticias.length} notícias</span>
        <span class="section-bar-divider"></span>
        <span class="section-bar-stat">${publicadas} publicadas</span>
      </div>
      <div class="section-bar-actions">
        <div class="search-wrap"><input class="search-input" data-table-search="tabela-noticias" placeholder="Buscar notícias..." aria-label="Buscar notícias">${icons.search}</div>
        <button class="btn btn-secondary" data-action="novo">${icons.plus} Nova Notícia</button>
      </div>
    </div>
    <div class="table-wrap"><table class="admin-table" id="tabela-noticias"><thead><tr><th>Título</th><th>Categoria</th><th>Autor</th><th>Data</th><th>Status</th><th class="th-actions">Ações</th></tr></thead><tbody>
      ${noticias.map((noticia) => `<tr>
        <td>${esc(noticia.title)}</td>
        <td>${noticia.category ? `<span class="cat-badge" style="--cat-cor:${esc(CATEGORY_COLORS[noticia.category] || "#666")}">${esc(noticia.category)}</span>` : '<span class="cell-empty">—</span>'}</td>
        <td>${noticia.author?.name ? esc(noticia.author.name) : "—"}</td>
        <td><div class="cell-date">${new Date(noticia.createdAt).toLocaleDateString("pt-BR")}</div></td>
        <td><span class="pub-indicator ${noticia.published ? "pub-yes" : "pub-no"}"></span><span>${noticia.published ? "Publicado" : "Rascunho"}</span></td>
        <td class="td-actions">
          <a href="/noticias?slug=${encodeURIComponent(noticia.slug)}" target="_blank" rel="noopener" class="btn-icon" title="${noticia.published ? "Visualizar" : "Pré-visualizar rascunho"}">${icons.eye}</a>
          <button class="btn-icon btn-icon-edit" data-action="editar" data-id="${esc(noticia.id)}" title="Editar">${icons.edit}</button>
          <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${esc(noticia.id)}" title="Excluir">${icons.trash}</button>
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

function slugify(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 200);
}

function categoryOptions(selected) {
    const options = CATEGORIES.includes(selected) || !selected ? CATEGORIES : [...CATEGORIES, selected];
    return `<option value="">Geral</option>` + options.map((category) =>
        `<option value="${esc(category)}" ${selected === category ? "selected" : ""}>${esc(category)}</option>`
    ).join("");
}

function newsForm(noticia = null) {
    const isEdit = Boolean(noticia);
    return `
    <div class="form-group"><label>Título</label><input type="text" id="f-no-title" class="form-control" value="${esc(noticia?.title || "")}" maxlength="255" required></div>
    <div class="form-row">
      <div class="form-group"><label>Slug</label><input type="text" id="f-no-slug" class="form-control" value="${esc(noticia?.slug || "")}" maxlength="255" placeholder="meu-slug" required></div>
      <div class="form-group"><label>Categoria</label><select id="f-no-cat" class="form-control">${categoryOptions(noticia?.category || "")}</select></div>
    </div>
    <div class="form-group"><label>Resumo</label><textarea id="f-no-excerpt" class="form-control" rows="2" maxlength="500">${esc(noticia?.excerpt || "")}</textarea></div>
    <div class="form-group"><label>Conteúdo</label><textarea id="f-no-content" class="form-control" rows="6" maxlength="10000" required>${esc(noticia?.content || "")}</textarea></div>
    <div class="form-group"><label>Imagem</label>${uploadField("f-no-img", noticia?.imageUrl || "")}</div>
    <label class="toggle"><input type="checkbox" id="f-no-pub" ${noticia?.published ? "checked" : ""}><div class="toggle-slider"></div><span class="toggle-label">Publicar</span></label>
    <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem;">${isEdit ? "Salvar" : "Criar Notícia"}</button>`;
}

function readForm() {
    return {
        title: document.getElementById("f-no-title").value,
        slug: document.getElementById("f-no-slug").value,
        category: document.getElementById("f-no-cat").value || null,
        excerpt: document.getElementById("f-no-excerpt").value || null,
        content: document.getElementById("f-no-content").value,
        imageUrl: document.getElementById("f-no-img").value || null,
        published: document.getElementById("f-no-pub").checked,
    };
}

export function openForm(refresh = () => location.reload()) {
    const overlay = modalForm("Nova Notícia", newsForm(), async () => {
        await api.post("/admin/noticias", readForm());
        closeModal();
        toast.show("Notícia criada!");
        refresh();
    });

    const title = overlay.querySelector("#f-no-title");
    const slug = overlay.querySelector("#f-no-slug");
    let slugEdited = false;
    slug.addEventListener("input", () => { slugEdited = slug.value.trim() !== ""; });
    title.addEventListener("input", () => {
        if (!slugEdited) slug.value = slugify(title.value);
    });
}

async function openEditForm(id, refresh) {
    const noticia = await api.get(`/admin/noticias/${encodeURIComponent(id)}`);
    modalForm("Editar Notícia", newsForm(noticia), async () => {
        await api.put(`/admin/noticias/${encodeURIComponent(id)}`, readForm());
        closeModal();
        toast.show("Notícia atualizada!");
        refresh();
    });
}

async function remove(id, refresh) {
    if (!confirm("Excluir esta notícia? Esta ação não pode ser desfeita.")) return;
    await api.del(`/admin/noticias/${encodeURIComponent(id)}`);
    toast.show("Notícia excluída!");
    refresh();
}
