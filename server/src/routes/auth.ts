import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getOne, exec, isDuplicateKeyError } from "../lib/db";
import { signToken } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { validate } from "../lib/validation";
import {
  loginSchema,
  registerSchema,
  perfilSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";
import { setSessionCookie, clearSessionCookie } from "../lib/session";
import { issueEmailVerification } from "../lib/verification";
import type { UserRow } from "../lib/types";

const router = Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Respostas de autenticação nunca devem ser cacheadas por proxies ou navegador.
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

router.post("/login", validate(loginSchema), ah(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getOne<UserRow>("SELECT * FROM `user` WHERE email = ?", [email]);
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

  // A sessão fica em cookie HttpOnly; o token nunca é exposto ao JavaScript da página.
  setSessionCookie(res, signToken(user.id));
  return res.json({
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, status: user.status,
      avatarUrl: user.avatarUrl, position: user.position,
      emailUpdatesOptIn: Boolean(user.emailUpdatesOptIn),
    },
  });
}));

router.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  return res.json({ success: true });
});

router.post("/register", validate(registerSchema), ah(async (req: Request, res: Response) => {
  const { name, email, password, phone, birthDate, emailUpdatesOptIn } = req.body;

  const exists = await getOne<Pick<UserRow, "id" | "emailVerifiedAt">>("SELECT id, emailVerifiedAt FROM `user` WHERE email = ?", [email]);
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
  const verificationTokenHash = hashToken(verificationToken);
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    await exec(
      "INSERT INTO `user` (id, name, email, passwordHash, role, `status`, phone, birthDate, emailVerificationTokenHash, emailVerificationExpiresAt, emailUpdatesOptIn, emailUpdatesOptInAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, passwordHash, "MEMBER", "PENDING", phone ?? null, birthDate ?? null, verificationTokenHash, verificationExpiresAt, emailUpdatesOptIn, emailUpdatesOptIn ? new Date() : null]
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
  const tokenHash = hashToken(req.body.token);
  const user = await getOne<Pick<UserRow, "id" | "emailVerifiedAt" | "emailVerificationExpiresAt">>(
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
  const user = await getOne<Pick<UserRow, "id" | "name" | "email" | "emailVerifiedAt">>(
    "SELECT id, name, email, emailVerifiedAt FROM `user` WHERE email = ?",
    [req.body.email]
  );
  if (!user || user.emailVerifiedAt) return res.json(genericResponse);

  try {
    await issueEmailVerification(user);
  } catch (err) {
    logError("auth/resend-verification", err);
  }
  return res.json(genericResponse);
}));

router.post("/forgot-password", validate(forgotPasswordSchema), ah(async (req: Request, res: Response) => {
  const genericResponse = {
    message: "Se houver uma conta ativa com esse email, enviaremos um link para redefinir a senha.",
  };
  const user = await getOne<{ id: string; name: string; email: string }>(
    "SELECT id, name, email FROM `user` WHERE email = ? AND emailVerifiedAt IS NOT NULL AND `status` = 'ACTIVE'",
    [req.body.email]
  );
  if (!user) return res.json(genericResponse);

  const token = crypto.randomBytes(32).toString("hex");
  await exec(
    "UPDATE `user` SET passwordResetTokenHash = ?, passwordResetExpiresAt = ? WHERE id = ?",
    [hashToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS), user.id]
  );

  try {
    await sendPasswordResetEmail(user.email, user.name, token);
  } catch (err) {
    // Não revela falha de envio: a resposta é a mesma para qualquer email.
    logError("auth/forgot-password-email", err);
  }
  return res.json(genericResponse);
}));

router.post("/reset-password", validate(resetPasswordSchema), ah(async (req: Request, res: Response) => {
  const user = await getOne<{ id: string }>(
    "SELECT id FROM `user` WHERE passwordResetTokenHash = ? AND passwordResetExpiresAt > NOW() LIMIT 1",
    [hashToken(req.body.token)]
  );
  if (!user) {
    return res.status(400).json({ message: "Link de redefinição inválido ou expirado. Solicite um novo." });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await exec(
    "UPDATE `user` SET passwordHash = ?, passwordChangedAt = CURRENT_TIMESTAMP, passwordResetTokenHash = NULL, passwordResetExpiresAt = NULL WHERE id = ?",
    [passwordHash, user.id]
  );
  clearSessionCookie(res);
  return res.json({ message: "Senha redefinida! Agora você já pode entrar com a nova senha." });
}));

router.get("/me", requireAuth, ah(async (req: AuthRequest, res: Response) => {
  const user = await getOne(
    "SELECT id, name, email, role, `status`, avatarUrl, `position`, bio, phone, birthDate, emailUpdatesOptIn FROM `user` WHERE id = ?",
    [req.user!.id]
  );
  return res.json(user);
}));

router.put("/perfil", requireAuth, validate(perfilSchema), ah(async (req: AuthRequest, res: Response) => {
  const { name, bio = null, phone = null, position = null, avatarUrl = null, emailUpdatesOptIn } = req.body;
  const preference = emailUpdatesOptIn ?? null;
  await exec(
    "UPDATE `user` SET name = ?, bio = ?, phone = ?, `position` = ?, avatarUrl = ?, emailUpdatesOptIn = COALESCE(?, emailUpdatesOptIn), emailUpdatesOptInAt = CASE WHEN ? IS NULL THEN emailUpdatesOptInAt WHEN ? = 1 THEN COALESCE(emailUpdatesOptInAt, CURRENT_TIMESTAMP) ELSE NULL END WHERE id = ?",
    [name, bio, phone, position, avatarUrl, preference, preference, preference, req.user!.id]
  );
  const user = await getOne<UserRow>("SELECT * FROM `user` WHERE id = ?", [req.user!.id]);
  return res.json({
    id: user!.id, name: user!.name, email: user!.email, role: user!.role, status: user!.status,
    avatarUrl: user!.avatarUrl, position: user!.position, bio: user!.bio, phone: user!.phone,
    emailUpdatesOptIn: Boolean(user!.emailUpdatesOptIn),
  });
}));

export default router;
