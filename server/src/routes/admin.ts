import { Router, Response } from "express";
import crypto from "crypto";
import { query, getOne, exec } from "../lib/db";
import { requireStaff, AuthRequest } from "../middleware/auth";
import { validate } from "../lib/validation";
import { eventoSchema, projetoSchema, noticiaSchema, avisoSchema } from "../lib/schemas";
import { deleteImage } from "../lib/storage";
import { ah } from "../lib/asyncHandler";
import { notifyContentPublishedAsync, buildContentUrl } from "../lib/notify";

const router = Router();

// Administração e diretoria mantêm o conteúdo do clube.
router.use(requireStaff);

// ---------- Painel ----------

router.get("/stats", ah(async (_req: AuthRequest, res: Response) => {
  const [membros, eventos, projetos, noticias, avisos] = await Promise.all([
    getOne<{ total: number }>("SELECT COUNT(*) as total FROM `user`").then((r) => Number(r?.total ?? 0)),
    getOne<{ total: number }>("SELECT COUNT(*) as total FROM `event`").then((r) => Number(r?.total ?? 0)),
    getOne<{ total: number }>("SELECT COUNT(*) as total FROM `project`").then((r) => Number(r?.total ?? 0)),
    getOne<{ total: number }>("SELECT COUNT(*) as total FROM newsarticle").then((r) => Number(r?.total ?? 0)),
    getOne<{ total: number }>("SELECT COUNT(*) as total FROM notice").then((r) => Number(r?.total ?? 0)),
  ]);
  return res.json({ membros, eventos, projetos, noticias, avisos });
}));

// ---------- Eventos ----------

router.get("/eventos", ah(async (_req: AuthRequest, res: Response) => {
  const eventos = await query(
    "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e ORDER BY e.`date` DESC"
  );
  return res.json(eventos);
}));

router.get("/eventos/:id", ah(async (req: AuthRequest, res: Response) => {
  const evento = await getOne(
    "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e WHERE e.id = ?",
    [req.params.id]
  );
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  return res.json(evento);
}));

router.post("/eventos", validate(eventoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
  const id = crypto.randomUUID();
  await exec(
    "INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null]
  );
  const evento = await getOne(
    "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e WHERE e.id = ?",
    [id]
  );
  if (isPublic ?? true) {
    notifyContentPublishedAsync("evento", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("evento", id),
    });
  }
  return res.status(201).json(evento);
}));

router.put("/eventos/:id", validate(eventoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
  const antigo = await getOne<{ imageUrl: string | null; isPublic: number | boolean | null }>(
    "SELECT imageUrl, isPublic FROM `event` WHERE id = ?",
    [req.params.id]
  );
  if (!antigo) return res.status(404).json({ message: "Evento não encontrado" });

  await exec(
    "UPDATE `event` SET title=?, description=?, `date`=?, location=?, imageUrl=?, isPublic=?, maxParticipants=? WHERE id=?",
    [title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null, req.params.id]
  );
  if (antigo.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
  if (!antigo.isPublic && (isPublic ?? true)) {
    notifyContentPublishedAsync("evento", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("evento", req.params.id),
    });
  }
  const evento = await getOne("SELECT * FROM `event` WHERE id = ?", [req.params.id]);
  return res.json(evento);
}));

router.delete("/eventos/:id", ah(async (req: AuthRequest, res: Response) => {
  const evento = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `event` WHERE id = ?", [req.params.id]);
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  await exec("DELETE FROM `event` WHERE id = ?", [req.params.id]);
  if (evento.imageUrl) await deleteImage(evento.imageUrl);
  return res.json({ success: true });
}));

// ---------- Projetos ----------

router.get("/projetos", ah(async (_req: AuthRequest, res: Response) => {
  const projetos = await query("SELECT * FROM `project` ORDER BY createdAt DESC");
  return res.json(projetos);
}));

router.get("/projetos/:id", ah(async (req: AuthRequest, res: Response) => {
  const projeto = await getOne("SELECT * FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  return res.json(projeto);
}));

router.post("/projetos", validate(projetoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
  const id = crypto.randomUUID();
  await exec(
    "INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true]
  );
  if (isPublic ?? true) {
    notifyContentPublishedAsync("projeto", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("projeto", id),
    });
  }
  return res.status(201).json({ success: true, id });
}));

router.put("/projetos/:id", validate(projetoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
  const antigo = await getOne<{ imageUrl: string | null; isPublic: number | boolean | null }>(
    "SELECT imageUrl, isPublic FROM `project` WHERE id = ?",
    [req.params.id]
  );
  if (!antigo) return res.status(404).json({ message: "Projeto não encontrado" });

  await exec(
    "UPDATE `project` SET title=?, description=?, `status`=?, startDate=?, endDate=?, imageUrl=?, isPublic=? WHERE id=?",
    [title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true, req.params.id]
  );
  if (antigo.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
  if (!antigo.isPublic && (isPublic ?? true)) {
    notifyContentPublishedAsync("projeto", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("projeto", req.params.id),
    });
  }
  return res.json({ success: true });
}));

router.delete("/projetos/:id", ah(async (req: AuthRequest, res: Response) => {
  const projeto = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  await exec("DELETE FROM `project` WHERE id = ?", [req.params.id]);
  if (projeto.imageUrl) await deleteImage(projeto.imageUrl);
  return res.json({ success: true });
}));

// ---------- Notícias ----------

router.get("/noticias", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<any[]>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id ORDER BY n.createdAt DESC"
  );
  return res.json(rows.map(({ authorName, ...n }: any) => ({ ...n, author: { name: authorName } })));
}));

router.get("/noticias/:id", ah(async (req: AuthRequest, res: Response) => {
  const row = await getOne<any>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id WHERE n.id = ?",
    [req.params.id]
  );
  if (!row) return res.status(404).json({ message: "Notícia não encontrada" });
  const { authorName, ...n } = row;
  return res.json({ ...n, author: { name: authorName } });
}));

router.post("/noticias", validate(noticiaSchema), ah(async (req: AuthRequest, res: Response) => {
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

router.put("/noticias/:id", validate(noticiaSchema), ah(async (req: AuthRequest, res: Response) => {
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

router.delete("/noticias/:id", ah(async (req: AuthRequest, res: Response) => {
  const noticia = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM newsarticle WHERE id = ?", [req.params.id]);
  if (!noticia) return res.status(404).json({ message: "Notícia não encontrada" });
  await exec("DELETE FROM newsarticle WHERE id = ?", [req.params.id]);
  if (noticia.imageUrl) await deleteImage(noticia.imageUrl);
  return res.json({ success: true });
}));

// ---------- Avisos ----------

router.get("/avisos", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<any[]>(
    "SELECT n.*, u.name as authorName FROM notice n LEFT JOIN `user` u ON n.userId = u.id ORDER BY n.createdAt DESC"
  );
  return res.json(rows.map(({ authorName, ...n }: any) => ({ ...n, author: { name: authorName } })));
}));

router.get("/avisos/:id", ah(async (req: AuthRequest, res: Response) => {
  const row = await getOne<any>(
    "SELECT n.*, u.name as authorName FROM notice n LEFT JOIN `user` u ON n.userId = u.id WHERE n.id = ?",
    [req.params.id]
  );
  if (!row) return res.status(404).json({ message: "Aviso não encontrado" });
  const { authorName, ...n } = row;
  return res.json({ ...n, author: { name: authorName } });
}));

router.post("/avisos", validate(avisoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  await exec("INSERT INTO notice (id, title, content, userId) VALUES (UUID(), ?, ?, ?)", [title, content, req.user!.id]);
  return res.status(201).json({ success: true });
}));

router.put("/avisos/:id", validate(avisoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  const aviso = await getOne("SELECT id FROM notice WHERE id = ?", [req.params.id]);
  if (!aviso) return res.status(404).json({ message: "Aviso não encontrado" });
  await exec("UPDATE notice SET title=?, content=? WHERE id=?", [title, content, req.params.id]);
  return res.json({ success: true });
}));

router.delete("/avisos/:id", ah(async (req: AuthRequest, res: Response) => {
  const aviso = await getOne("SELECT id FROM notice WHERE id = ?", [req.params.id]);
  if (!aviso) return res.status(404).json({ message: "Aviso não encontrado" });
  await exec("DELETE FROM notice WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

// ---------- Contatos (mensagens do formulário público) ----------

router.get("/contatos", ah(async (_req: AuthRequest, res: Response) => {
  const contatos = await query("SELECT * FROM contact ORDER BY isRead ASC, createdAt DESC");
  return res.json(contatos);
}));

router.put("/contatos/:id/lida", ah(async (req: AuthRequest, res: Response) => {
  const contato = await getOne("SELECT id FROM contact WHERE id = ?", [req.params.id]);
  if (!contato) return res.status(404).json({ message: "Mensagem não encontrada" });
  await exec("UPDATE contact SET isRead = TRUE WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

router.delete("/contatos/:id", ah(async (req: AuthRequest, res: Response) => {
  const contato = await getOne("SELECT id FROM contact WHERE id = ?", [req.params.id]);
  if (!contato) return res.status(404).json({ message: "Mensagem não encontrada" });
  await exec("DELETE FROM contact WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

export default router;
