import { Router, Response } from "express";
import { query, getOne, exec } from "../../lib/db";
import { AuthRequest } from "../../middleware/auth";
import { ah } from "../../lib/asyncHandler";
import type { ContactRow } from "../../lib/types";

// Mensagens enviadas pelo formulário público de contato.
const router = Router();

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const contatos = await query<ContactRow[]>("SELECT * FROM contact ORDER BY isRead ASC, createdAt DESC");
  return res.json(contatos);
}));

router.put("/:id/lida", ah(async (req: AuthRequest, res: Response) => {
  const contato = await getOne("SELECT id FROM contact WHERE id = ?", [req.params.id]);
  if (!contato) return res.status(404).json({ message: "Mensagem não encontrada" });
  await exec("UPDATE contact SET isRead = TRUE WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

router.delete("/:id", ah(async (req: AuthRequest, res: Response) => {
  const contato = await getOne("SELECT id FROM contact WHERE id = ?", [req.params.id]);
  if (!contato) return res.status(404).json({ message: "Mensagem não encontrada" });
  await exec("DELETE FROM contact WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

export default router;
