import { Router, Response } from "express";
import { query, getOne, exec, type SqlParam } from "../lib/db";
import { AuthRequest, requireAdmin } from "../middleware/auth";
import { validate } from "../lib/validation";
import { membroUpdateSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { discardImage } from "../lib/storage";

const router = Router();

const MEMBER_FIELDS = "id, name, email, role, `status`, `position`, avatarUrl, emailVerifiedAt, createdAt";

async function countAdmins(): Promise<number> {
  const total = await getOne<{ total: number }>("SELECT COUNT(*) as total FROM `user` WHERE role = 'ADMIN'");
  return Number(total?.total ?? 0);
}

router.get("/", requireAdmin, ah(async (_req: AuthRequest, res: Response) => {
  const membros = await query(`SELECT ${MEMBER_FIELDS} FROM \`user\` ORDER BY createdAt DESC`);
  return res.json(membros);
}));

router.put("/:id", requireAdmin, validate(membroUpdateSchema), ah(async (req: AuthRequest, res: Response) => {
  // Nome, email, telefone e senha são do próprio membro: ele altera pelo perfil
  // (ou pelo "esqueci a senha"). O admin só mexe em função, status e cargo.
  const { role, status, position } = req.body;
  const current = await getOne<{ role: string }>(
    "SELECT role FROM `user` WHERE id = ?",
    [req.params.id]
  );
  if (!current) return res.status(404).json({ message: "Membro não encontrado" });

  const losesAdminRole = current.role === "ADMIN" && ((role !== undefined && role !== "ADMIN") || (status !== undefined && status !== "ACTIVE"));
  if (losesAdminRole && (await countAdmins()) <= 1) {
    return res.status(403).json({ message: "Não é possível remover o último administrador" });
  }

  const fields: string[] = [];
  const values: SqlParam[] = [];
  if (role !== undefined) { fields.push("role = ?"); values.push(role); }
  if (status !== undefined) { fields.push("`status` = ?"); values.push(status); }
  if (position !== undefined) { fields.push("`position` = ?"); values.push(position); }

  values.push(req.params.id);
  await exec(`UPDATE \`user\` SET ${fields.join(", ")} WHERE id = ?`, values);

  const user = await getOne(`SELECT ${MEMBER_FIELDS} FROM \`user\` WHERE id = ?`, [req.params.id]);
  return res.json(user);
}));

router.delete("/:id", requireAdmin, ah(async (req: AuthRequest, res: Response) => {
  const alvo = await getOne<{ role: string; avatarUrl: string | null }>("SELECT role, avatarUrl FROM `user` WHERE id = ?", [req.params.id]);
  if (!alvo) return res.status(404).json({ message: "Membro não encontrado" });
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ message: "Você não pode excluir sua própria conta" });
  }
  if (alvo.role === "ADMIN" && (await countAdmins()) <= 1) {
    return res.status(403).json({ message: "Não é possível excluir o último administrador" });
  }

  await exec("DELETE FROM `user` WHERE id = ?", [req.params.id]);
  await discardImage(alvo.avatarUrl, "membros/avatar");
  return res.json({ success: true });
}));

export default router;
