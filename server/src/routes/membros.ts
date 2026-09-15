import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { query, getOne, exec, isDuplicateKeyError } from "../lib/db";
import { AuthRequest, requireAdmin } from "../middleware/auth";
import { validate } from "../lib/validation";
import { membroUpdateSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";

const router = Router();

router.get("/", requireAdmin, ah(async (_req: AuthRequest, res: Response) => {
  const membros = await query(
    "SELECT id, name, email, role, `status`, `position`, avatarUrl, emailVerifiedAt, createdAt FROM `user` ORDER BY createdAt DESC"
  );
  return res.json(membros);
}));

router.put("/:id", requireAdmin, validate(membroUpdateSchema), ah(async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, status, position, password } = req.body;
    const current = await getOne<{ email: string }>("SELECT email FROM `user` WHERE id = ?", [req.params.id]);
    if (!current) return res.status(404).json({ message: "Membro não encontrado" });
    const fields: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
      if (email.toLowerCase() !== current.email.toLowerCase()) {
        fields.push("emailVerifiedAt = NULL", "emailVerificationTokenHash = NULL", "emailVerificationExpiresAt = NULL");
      }
    }
    if (role !== undefined) { fields.push("role = ?"); values.push(role); }
    if (status !== undefined) { fields.push("`status` = ?"); values.push(status); }
    if (position !== undefined) { fields.push("`position` = ?"); values.push(position); }
    if (password) { fields.push("passwordHash = ?"); values.push(await bcrypt.hash(password, 12)); }
    values.push(req.params.id);
    try {
      await exec(`UPDATE \`user\` SET ${fields.join(", ")} WHERE id = ?`, values);
    } catch (err) {
      if (isDuplicateKeyError(err)) return res.status(409).json({ message: "Email já cadastrado por outro membro" });
      throw err;
    }
    const user = await getOne(
      "SELECT id, name, email, role, `status`, `position`, avatarUrl, emailVerifiedAt, createdAt FROM `user` WHERE id = ?",
      [req.params.id]
    );
    return res.json(user);
  } catch (err) {
    logError("membros/update", err);
    return res.status(500).json({ message: "Erro ao atualizar membro" });
  }
}));

router.delete("/:id", requireAdmin, ah(async (req: AuthRequest, res: Response) => {
  try {
    const alvo = await getOne<{ role: string }>("SELECT role FROM `user` WHERE id = ?", [req.params.id]);
    if (!alvo) return res.status(404).json({ message: "Membro não encontrado" });
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ message: "Você não pode excluir sua própria conta" });
    }
    if (alvo.role === "ADMIN") {
      const total = await getOne<{ total: number }>("SELECT COUNT(*) as total FROM `user` WHERE role = 'ADMIN'");
      if (Number(total?.total ?? 0) <= 1) {
        return res.status(403).json({ message: "Não é possível excluir o último administrador" });
      }
    }
    await exec("DELETE FROM `user` WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logError("membros/delete", err);
    return res.status(500).json({ message: "Erro ao excluir membro" });
  }
}));

export default router;
