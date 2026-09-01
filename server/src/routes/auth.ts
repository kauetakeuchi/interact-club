import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getOne, exec, isDuplicateKeyError } from "../lib/db";
import { signToken } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { validate } from "../lib/validation";
import { loginSchema, registerSchema, perfilSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";

const router = Router();

router.post("/login", validate(loginSchema), ah(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getOne<any>("SELECT * FROM `user` WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Email ou senha inválidos" });

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

  const exists = await getOne("SELECT id FROM `user` WHERE email = ?", [email]);
  if (exists) return res.status(409).json({ message: "Email já cadastrado" });

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  try {
    await exec(
      "INSERT INTO `user` (id, name, email, passwordHash, role, `status`, phone, birthDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, passwordHash, "MEMBER", "ACTIVE", phone ?? null, birthDate ?? null]
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) return res.status(409).json({ message: "Email já cadastrado" });
    throw err;
  }

  const user = await getOne("SELECT * FROM `user` WHERE id = ?", [id]);

  const token = signToken({ id: user!.id, role: user!.role, name: user!.name, email: user!.email });
  return res.status(201).json({
    token,
    user: {
      id: user!.id, name: user!.name, email: user!.email,
      role: user!.role, status: user!.status,
      avatarUrl: user!.avatarUrl, position: user!.position,
      phone: user!.phone, birthDate: user!.birthDate,
    },
  });
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
