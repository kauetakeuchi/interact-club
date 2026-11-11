import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { query, getOne, exec, isDuplicateKeyError } from "../lib/db";
import { AuthRequest, requireAdmin } from "../middleware/auth";
import { validate } from "../lib/validation";
import { membroUpdateSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";
import { issueEmailVerification } from "../lib/verification";

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
  const { name, email, role, status, position, password } = req.body;
  const current = await getOne<{ email: string; name: string; role: string }>(
    "SELECT email, name, role FROM `user` WHERE id = ?",
    [req.params.id]
  );
  if (!current) return res.status(404).json({ message: "Membro não encontrado" });

  const losesAdminRole = current.role === "ADMIN" && ((role !== undefined && role !== "ADMIN") || (status !== undefined && status !== "ACTIVE"));
  if (losesAdminRole && (await countAdmins()) <= 1) {
    return res.status(403).json({ message: "Não é possível remover o último administrador" });
  }

  const fields: string[] = [];
  const values: unknown[] = [];
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
  if (password) {
    fields.push("passwordHash = ?", "passwordChangedAt = CURRENT_TIMESTAMP");
    values.push(await bcrypt.hash(password, 12));
  }

  values.push(req.params.id);
  try {
    await exec(`UPDATE \`user\` SET ${fields.join(", ")} WHERE id = ?`, values);
  } catch (err) {
    if (isDuplicateKeyError(err)) return res.status(409).json({ message: "Email já cadastrado por outro membro" });
    throw err;
  }

  const user = await getOne<any>(`SELECT ${MEMBER_FIELDS} FROM \`user\` WHERE id = ?`, [req.params.id]);
  const emailChanged = Boolean(email && email.toLowerCase() !== current.email.toLowerCase());
  let emailVerificationSent = false;
  if (emailChanged && user) {
    try {
      await issueEmailVerification({ id: user.id, name: user.name, email: user.email });
      emailVerificationSent = true;
    } catch (err) {
      logError("membros/verification-email", err);
    }
  }

  return res.json({ ...user, emailVerificationSent });
}));

router.delete("/:id", requireAdmin, ah(async (req: AuthRequest, res: Response) => {
  const alvo = await getOne<{ role: string }>("SELECT role FROM `user` WHERE id = ?", [req.params.id]);
  if (!alvo) return res.status(404).json({ message: "Membro não encontrado" });
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ message: "Você não pode excluir sua própria conta" });
  }
  if (alvo.role === "ADMIN" && (await countAdmins()) <= 1) {
    return res.status(403).json({ message: "Não é possível excluir o último administrador" });
  }

  await exec("DELETE FROM `user` WHERE id = ?", [req.params.id]);
  return res.json({ success: true });
}));

export default router;
