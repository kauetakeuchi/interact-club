import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getOne, exec, isDuplicateKeyError } from "../lib/db";
import { signToken } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { validate } from "../lib/validation";
import { loginSchema, registerSchema, perfilSchema, verifyEmailSchema, resendVerificationSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";
import { sendVerificationEmail } from "../lib/email";

const router = Router();

router.post("/login", validate(loginSchema), ah(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getOne<any>("SELECT * FROM `user` WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Email ou senha inválidos" });

  if (!user.emailVerifiedAt) {
    return res.status(403).json({
      code: "EMAIL_NOT_VERIFIED",
      message: "Confirme seu email antes de entrar. Você pode solicitar um novo link de verificação.",
    });
  }

  if (user.status !== "ACTIVE") {
    return res.status(403).json({
      message: user.status === "PENDING"
        ? "Sua conta ainda está aguardando aprovação"
        : "Sua conta está inativa. Fale com um administrador",
    });
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });
  return res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, status: user.status,
      avatarUrl: user.avatarUrl, position: user.position,
    },
  });
}));

router.post("/register", validate(registerSchema), ah(async (req: Request, res: Response) => {
  const { name, email, password, phone, birthDate } = req.body;

  const exists = await getOne<any>("SELECT id, emailVerifiedAt FROM `user` WHERE email = ?", [email]);
  if (exists) {
    return res.status(409).json({
      code: exists.emailVerifiedAt ? "EMAIL_ALREADY_REGISTERED" : "EMAIL_NOT_VERIFIED",
      message: exists.emailVerifiedAt
        ? "Email já cadastrado"
        : "Este email já iniciou um cadastro. Solicite um novo link de verificação.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    await exec(
      "INSERT INTO `user` (id, name, email, passwordHash, role, `status`, phone, birthDate, emailVerificationTokenHash, emailVerificationExpiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, passwordHash, "MEMBER", "PENDING", phone ?? null, birthDate ?? null, verificationTokenHash, verificationExpiresAt]
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) return res.status(409).json({ message: "Email já cadastrado" });
    throw err;
  }

  try {
    await sendVerificationEmail(email, name, verificationToken);
  } catch (err) {
    logError("auth/register-email", err);
    await exec("DELETE FROM `user` WHERE id = ? AND emailVerifiedAt IS NULL", [id]).catch(() => {});
    return res.status(503).json({
      message: "Não foi possível enviar o email de verificação. Tente novamente em alguns minutos.",
    });
  }

  return res.status(201).json({
    message: "Cadastro iniciado. Confira seu email para ativar a conta.",
    email,
    requiresEmailVerification: true,
  });
}));

router.post("/verify-email", validate(verifyEmailSchema), ah(async (req: Request, res: Response) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await getOne<any>(
    "SELECT id, emailVerifiedAt, emailVerificationExpiresAt FROM `user` WHERE emailVerificationTokenHash = ?",
    [tokenHash]
  );

  if (!user) return res.status(400).json({ message: "Link de verificação inválido ou já utilizado." });
  if (user.emailVerifiedAt) return res.json({ message: "Seu email já foi confirmado." });
  if (!user.emailVerificationExpiresAt || new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({
      code: "VERIFICATION_EXPIRED",
      message: "Este link expirou. Solicite um novo email de verificação.",
    });
  }

  await exec(
    "UPDATE `user` SET emailVerifiedAt = CURRENT_TIMESTAMP, emailVerificationTokenHash = NULL, emailVerificationExpiresAt = NULL, `status` = IF(`status` = 'PENDING', 'ACTIVE', `status`) WHERE id = ? AND emailVerifiedAt IS NULL",
    [user.id]
  );
  return res.json({ message: "Email confirmado! Agora você já pode entrar." });
}));

router.post("/resend-verification", validate(resendVerificationSchema), ah(async (req: Request, res: Response) => {
  const genericResponse = {
    message: "Se houver um cadastro pendente para esse email, um novo link será enviado.",
  };
  const user = await getOne<any>(
    "SELECT id, name, email, emailVerifiedAt FROM `user` WHERE email = ?",
    [req.body.email]
  );
  if (!user || user.emailVerifiedAt) return res.json(genericResponse);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await exec(
    "UPDATE `user` SET emailVerificationTokenHash = ?, emailVerificationExpiresAt = ? WHERE id = ? AND emailVerifiedAt IS NULL",
    [verificationTokenHash, verificationExpiresAt, user.id]
  );
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (err) {
    logError("auth/resend-verification", err);
    return res.status(503).json({ message: "Não foi possível enviar o email agora. Tente novamente mais tarde." });
  }
  return res.json(genericResponse);
}));

router.get("/me", requireAuth, ah(async (req: AuthRequest, res: Response) => {
  const user = await getOne(
    "SELECT id, name, email, role, `status`, avatarUrl, `position`, bio, phone, birthDate FROM `user` WHERE id = ?",
    [req.user!.id]
  );
  return res.json(user);
}));

router.put("/perfil", requireAuth, validate(perfilSchema), ah(async (req: AuthRequest, res: Response) => {
  const { name, bio = null, phone = null, position = null, avatarUrl = null } = req.body;
  try {
    await exec(
      "UPDATE `user` SET name = ?, bio = ?, phone = ?, `position` = ?, avatarUrl = ? WHERE id = ?",
      [name, bio, phone, position, avatarUrl, req.user!.id]
    );
  } catch (err) {
    logError("auth/perfil", err);
    return res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
  const user = await getOne("SELECT * FROM `user` WHERE id = ?", [req.user!.id]);
  return res.json({
    id: user!.id, name: user!.name, email: user!.email, role: user!.role, status: user!.status,
    avatarUrl: user!.avatarUrl, position: user!.position, bio: user!.bio, phone: user!.phone,
  });
}));

export default router;
