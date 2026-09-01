import { Router, Response } from "express";
import crypto from "crypto";
import { query, getOne, exec } from "../lib/db";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { validate } from "../lib/validation";
import { eventoSchema, projetoSchema, noticiaSchema, avisoSchema } from "../lib/schemas";
import { deleteImage } from "../lib/storage";
import { logError } from "../lib/logger";

const router = Router();
router.use(requireAdmin);

// ---------- Painel ----------

router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const [membros, eventos, projetos, noticias, avisos] = await Promise.all([
      getOne<{ total: number }>("SELECT COUNT(*) as total FROM user").then((r) => Number(r?.total ?? 0)),
      getOne<{ total: number }>("SELECT COUNT(*) as total FROM event").then((r) => Number(r?.total ?? 0)),
      getOne<{ total: number }>("SELECT COUNT(*) as total FROM project").then((r) => Number(r?.total ?? 0)),
      getOne<{ total: number }>("SELECT COUNT(*) as total FROM newsarticle").then((r) => Number(r?.total ?? 0)),
      getOne<{ total: number }>("SELECT COUNT(*) as total FROM notice").then((r) => Number(r?.total ?? 0)),
    ]);
    return res.json({ membros, eventos, projetos, noticias, avisos });
  } catch (err) {
    logError("admin/stats", err);
    return res.status(500).json({ message: "Erro ao carregar estatísticas" });
  }
});

// ---------- Eventos ----------

router.get("/eventos", async (_req: AuthRequest, res: Response) => {
  const eventos = await query<any[]>(
    "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e ORDER BY e.`date` DESC"
  );
  return res.json(eventos);
});

router.get("/eventos/:id", async (req: AuthRequest, res: Response) => {
  const evento = await getOne<any>(
    "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e WHERE e.id = ?",
    [req.params.id]
  );
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  return res.json(evento);
});

router.post("/eventos", validate(eventoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
    const id = crypto.randomUUID();
    await exec(
      "INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null]
    );
    const evento = await getOne<any>(
      "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e WHERE e.id = ?",
      [id]
    );
    return res.status(201).json(evento);
  } catch (err) {
    logError("admin/eventos:create", err);
    return res.status(500).json({ message: "Erro ao criar evento" });
  }
});

router.put("/eventos/:id", validate(eventoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
    const antigo = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `event` WHERE id = ?", [req.params.id]);
    if (antigo?.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
    await exec(
      "UPDATE `event` SET title=?, description=?, `date`=?, location=?, imageUrl=?, isPublic=?, maxParticipants=? WHERE id=?",
      [title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null, req.params.id]
    );
    const evento = await getOne<any>("SELECT * FROM `event` WHERE id = ?", [req.params.id]);
    return res.json(evento);
  } catch (err) {
    logError("admin/eventos:update", err);
    return res.status(500).json({ message: "Erro ao atualizar evento" });
  }
});

router.delete("/eventos/:id", async (req: AuthRequest, res: Response) => {
  try {
    await exec("DELETE FROM eventsignup WHERE eventId = ?", [req.params.id]);
    const evento = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `event` WHERE id = ?", [req.params.id]);
    if (evento?.imageUrl) await deleteImage(evento.imageUrl);
    await exec("DELETE FROM `event` WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/eventos:delete", err);
    return res.status(500).json({ message: "Erro ao excluir evento" });
  }
});

// ---------- Projetos ----------

router.get("/projetos", async (_req: AuthRequest, res: Response) => {
  const projetos = await query("SELECT * FROM `project` ORDER BY createdAt DESC");
  return res.json(projetos);
});

router.get("/projetos/:id", async (req: AuthRequest, res: Response) => {
  const projeto = await getOne<any>("SELECT * FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  return res.json(projeto);
});

router.post("/projetos", validate(projetoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
    await exec(
      "INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)",
      [title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true]
    );
    return res.status(201).json({ success: true });
  } catch (err) {
    logError("admin/projetos:create", err);
    return res.status(500).json({ message: "Erro ao criar projeto" });
  }
});

router.put("/projetos/:id", validate(projetoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
    const antigo = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `project` WHERE id = ?", [req.params.id]);
    if (antigo?.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
    await exec(
      "UPDATE `project` SET title=?, description=?, `status`=?, startDate=?, endDate=?, imageUrl=?, isPublic=? WHERE id=?",
      [title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true, req.params.id]
    );
    return res.json({ success: true });
  } catch (err) {
    logError("admin/projetos:update", err);
    return res.status(500).json({ message: "Erro ao atualizar projeto" });
  }
});

router.delete("/projetos/:id", async (req: AuthRequest, res: Response) => {
  try {
    const projeto = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `project` WHERE id = ?", [req.params.id]);
    if (projeto?.imageUrl) await deleteImage(projeto.imageUrl);
    await exec("DELETE FROM `project` WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/projetos:delete", err);
    return res.status(500).json({ message: "Erro ao excluir projeto" });
  }
});

// ---------- Notícias ----------

router.get("/noticias", async (_req: AuthRequest, res: Response) => {
  const rows = await query<any[]>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id ORDER BY n.createdAt DESC"
  );
  return res.json(rows.map(({ authorName, ...n }: any) => ({ ...n, author: { name: authorName } })));
});

router.get("/noticias/:id", async (req: AuthRequest, res: Response) => {
  const row = await getOne<any>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id WHERE n.id = ?",
    [req.params.id]
  );
  if (!row) return res.status(404).json({ message: "Notícia não encontrada" });
  const { authorName, ...n } = row;
  return res.json({ ...n, author: { name: authorName } });
});

router.post("/noticias", validate(noticiaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, content, excerpt, imageUrl, category, published } = req.body;
    const existing = await getOne<{ id: string }>("SELECT id FROM newsarticle WHERE slug = ?", [slug]);
    if (existing) return res.status(409).json({ message: "Slug já existe" });
    await exec(
      "INSERT INTO newsarticle (id, title, slug, content, excerpt, imageUrl, category, published, authorId) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, slug, content, excerpt ?? null, imageUrl ?? null, category ?? null, published ?? false, req.user!.id]
    );
    return res.status(201).json({ success: true });
  } catch (err) {
    logError("admin/noticias:create", err);
    return res.status(500).json({ message: "Erro ao criar notícia" });
  }
});

router.put("/noticias/:id", validate(noticiaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, content, excerpt, imageUrl, category, published } = req.body;
    const existing = await getOne<{ id: string }>("SELECT id FROM newsarticle WHERE slug = ? AND id != ? LIMIT 1", [
      slug,
      req.params.id,
    ]);
    if (existing) return res.status(409).json({ message: "Slug já existe" });
    const antigo = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM newsarticle WHERE id = ?", [req.params.id]);
    if (antigo?.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
    await exec(
      "UPDATE newsarticle SET title=?, slug=?, content=?, excerpt=?, imageUrl=?, category=?, published=? WHERE id=?",
      [title, slug, content, excerpt ?? null, imageUrl ?? null, category ?? null, published ?? false, req.params.id]
    );
    return res.json({ success: true });
  } catch (err) {
    logError("admin/noticias:update", err);
    return res.status(500).json({ message: "Erro ao atualizar notícia" });
  }
});

router.delete("/noticias/:id", async (req: AuthRequest, res: Response) => {
  try {
    const noticia = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM newsarticle WHERE id = ?", [req.params.id]);
    if (noticia?.imageUrl) await deleteImage(noticia.imageUrl);
    await exec("DELETE FROM newsarticle WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/noticias:delete", err);
    return res.status(500).json({ message: "Erro ao excluir notícia" });
  }
});

// ---------- Avisos ----------

router.get("/avisos", async (_req: AuthRequest, res: Response) => {
  const rows = await query<any[]>(
    "SELECT n.*, u.name as authorName FROM notice n LEFT JOIN `user` u ON n.userId = u.id ORDER BY n.createdAt DESC"
  );
  return res.json(rows.map(({ authorName, ...n }: any) => ({ ...n, author: { name: authorName } })));
});

router.get("/avisos/:id", async (req: AuthRequest, res: Response) => {
  const row = await getOne<any>(
    "SELECT n.*, u.name as authorName FROM notice n LEFT JOIN `user` u ON n.userId = u.id WHERE n.id = ?",
    [req.params.id]
  );
  if (!row) return res.status(404).json({ message: "Aviso não encontrado" });
  const { authorName, ...n } = row;
  return res.json({ ...n, author: { name: authorName } });
});

router.post("/avisos", validate(avisoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    await exec("INSERT INTO notice (id, title, content, userId) VALUES (UUID(), ?, ?, ?)", [title, content, req.user!.id]);
    return res.status(201).json({ success: true });
  } catch (err) {
    logError("admin/avisos:create", err);
    return res.status(500).json({ message: "Erro ao criar aviso" });
  }
});

router.put("/avisos/:id", validate(avisoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    await exec("UPDATE notice SET title=?, content=? WHERE id=?", [title, content, req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/avisos:update", err);
    return res.status(500).json({ message: "Erro ao atualizar aviso" });
  }
});

router.delete("/avisos/:id", async (req: AuthRequest, res: Response) => {
  try {
    await exec("DELETE FROM notice WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/avisos:delete", err);
    return res.status(500).json({ message: "Erro ao excluir aviso" });
  }
});

// ---------- Contatos (mensagens do formulário público) ----------

router.get("/contatos", async (_req: AuthRequest, res: Response) => {
  const contatos = await query(
    "SELECT * FROM contact ORDER BY isRead ASC, createdAt DESC"
  );
  return res.json(contatos);
});

router.put("/contatos/:id/lida", async (req: AuthRequest, res: Response) => {
  try {
    await exec("UPDATE contact SET isRead = TRUE WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/contatos:lida", err);
    return res.status(500).json({ message: "Erro ao marcar como lida" });
  }
});

router.delete("/contatos/:id", async (req: AuthRequest, res: Response) => {
  try {
    await exec("DELETE FROM contact WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("admin/contatos:delete", err);
    return res.status(500).json({ message: "Erro ao excluir contato" });
  }
});

export default router;
