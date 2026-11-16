import { Router, Response } from "express";
import { query, getOne, exec } from "../../lib/db";
import { AuthRequest } from "../../middleware/auth";
import { validate } from "../../lib/validation";
import { avisoSchema } from "../../lib/schemas";
import { ah } from "../../lib/asyncHandler";
import { type NoticeRow, type WithAuthorName, withAuthor } from "../../lib/types";

const router = Router();

const AVISO_COM_AUTOR = "SELECT n.*, u.name as authorName FROM notice n LEFT JOIN `user` u ON n.userId = u.id";

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<WithAuthorName<NoticeRow>[]>(`${AVISO_COM_AUTOR} ORDER BY n.createdAt DESC`);
  return res.json(rows.map(withAuthor));
}));

router.get("/:id", ah(async (req: AuthRequest, res: Response) => {
  const row = await getOne<WithAuthorName<NoticeRow>>(`${AVISO_COM_AUTOR} WHERE n.id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ message: "Aviso não encontrado" });
  return res.json(withAuthor(row));
}));

router.post("/", validate(avisoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  await exec("INSERT INTO notice (id, title, content, userId) VALUES (UUID(), ?, ?, ?)", [title, content, req.user!.id]);
  return res.status(201).json({ success: true });
}));

router.put("/:id", validate(avisoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  const aviso = await getOne("SELECT id FROM notice WHERE id = ?", [req.params.id]);
  if (!aviso) return res.status(404).json({ message: "Aviso não encontrado" });
  await exec("UPDATE notice SET title=?, content=? WHERE id=?", [title, content, req.params.id]);
  return res.json({ success: true });
}));

router.delete("/:id", ah(async (req: AuthRequest, res: Response) => {
  const aviso = await getOne("SELECT id FROM notice WHERE id = ?", [req.params.id]);
  if (!aviso) return res.status(404).json({ message: "Aviso não encontrado" });
  await exec("DELETE FROM notice WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

export default router;
