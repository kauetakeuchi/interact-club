import { Router, Response } from "express";
import { query, getOne, exec } from "../../lib/db";
import { AuthRequest } from "../../middleware/auth";
import { validate } from "../../lib/validation";
import { noticiaSchema } from "../../lib/schemas";
import { deleteImage } from "../../lib/storage";
import { ah } from "../../lib/asyncHandler";
import { notifyContentPublishedAsync, buildContentUrl } from "../../lib/notify";
import { type NewsRow, type WithAuthorName, withAuthor } from "../../lib/types";

const router = Router();

const NOTICIA_COM_AUTOR =
  "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id";

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<WithAuthorName<NewsRow>[]>(`${NOTICIA_COM_AUTOR} ORDER BY n.createdAt DESC`);
  return res.json(rows.map(withAuthor));
}));

router.get("/:id", ah(async (req: AuthRequest, res: Response) => {
  const row = await getOne<WithAuthorName<NewsRow>>(`${NOTICIA_COM_AUTOR} WHERE n.id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ message: "Notícia não encontrada" });
  return res.json(withAuthor(row));
}));

router.post("/", validate(noticiaSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, slug, content, excerpt, imageUrl, category, published } = req.body;
  const existing = await getOne<{ id: string }>("SELECT id FROM newsarticle WHERE slug = ?", [slug]);
  if (existing) return res.status(409).json({ message: "Slug já existe" });

  await exec(
    "INSERT INTO newsarticle (id, title, slug, content, excerpt, imageUrl, category, published, authorId) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)",
    [title, slug, content, excerpt ?? null, imageUrl ?? null, category ?? null, published ?? false, req.user!.id]
  );
  if (published ?? false) {
    notifyContentPublishedAsync("noticia", {
      title,
      summary: excerpt ?? content,
      imageUrl,
      url: buildContentUrl("noticia", slug),
    });
  }
  return res.status(201).json({ success: true });
}));

router.put("/:id", validate(noticiaSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, slug, content, excerpt, imageUrl, category, published } = req.body;
  const existing = await getOne<{ id: string }>(
    "SELECT id FROM newsarticle WHERE slug = ? AND id != ? LIMIT 1",
    [slug, req.params.id]
  );
  if (existing) return res.status(409).json({ message: "Slug já existe" });

  const antigo = await getOne<{ imageUrl: string | null; published: number | boolean | null }>(
    "SELECT imageUrl, published FROM newsarticle WHERE id = ?",
    [req.params.id]
  );
  if (!antigo) return res.status(404).json({ message: "Notícia não encontrada" });

  await exec(
    "UPDATE newsarticle SET title=?, slug=?, content=?, excerpt=?, imageUrl=?, category=?, published=? WHERE id=?",
    [title, slug, content, excerpt ?? null, imageUrl ?? null, category ?? null, published ?? false, req.params.id]
  );
  if (antigo.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
  if (!antigo.published && (published ?? false)) {
    notifyContentPublishedAsync("noticia", {
      title,
      summary: excerpt ?? content,
      imageUrl,
      url: buildContentUrl("noticia", slug),
    });
  }
  return res.json({ success: true });
}));

router.delete("/:id", ah(async (req: AuthRequest, res: Response) => {
  const noticia = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM newsarticle WHERE id = ?", [req.params.id]);
  if (!noticia) return res.status(404).json({ message: "Notícia não encontrada" });
  await exec("DELETE FROM newsarticle WHERE id = ?", [req.params.id]);
  if (noticia.imageUrl) await deleteImage(noticia.imageUrl);
  return res.json({ success: true });
}));

export default router;
