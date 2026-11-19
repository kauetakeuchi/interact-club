import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { getOne } from "../lib/db";
import { SESSION_COOKIE } from "../lib/session";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string; email: string };
}

type ActiveUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  status: string;
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  sessionRevoked?: number | boolean | null;
};

export function requestToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[SESSION_COOKIE];
  return typeof cookie === "string" && cookie.length > 0 ? cookie : null;
}

function loadActiveUser(userId: string, sessionId: string | null): Promise<ActiveUser | null> {
  // Uma única consulta traz o usuário e diz se esta sessão foi encerrada (logout).
  return getOne<ActiveUser>(
    "SELECT u.*, (r.jti IS NOT NULL) AS sessionRevoked FROM (SELECT id, role, name, email, `status`, emailVerifiedAt, passwordChangedAt FROM `user` WHERE id = ?) u LEFT JOIN revoked_session r ON r.jti = ?",
    [userId, sessionId ?? ""]
  );
}

async function resolveUser(req: Request): Promise<AuthRequest["user"] | null> {
  const token = requestToken(req);
  if (!token) return null;

  let verified;
  try {
    verified = verifyToken(token);
  } catch {
    return null;
  }

  const user = await loadActiveUser(verified.userId, verified.sessionId);
  if (!user || user.status !== "ACTIVE" || !user.emailVerifiedAt) return null;
  if (user.sessionRevoked && Number(user.sessionRevoked) === 1) return null;

  // Trocar a senha invalida sessões abertas antes da mudança.
  if (user.passwordChangedAt) {
    const changedAt = new Date(user.passwordChangedAt).getTime();
    if (verified.issuedAt > 0 && verified.issuedAt < changedAt - 1000) return null;
  }

  return { id: user.id, role: user.role, name: user.name, email: user.email };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Sessão inválida. Entre novamente." });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Staff = administração e diretoria (quem mantém o conteúdo do clube).
export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  void requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "DIRECTOR") {
      return res.status(403).json({ message: "Acesso restrito à administração e diretoria" });
    }
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  void requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }
    next();
  });
}

// Permite pré-visualizar conteúdo interno quando a sessão é de staff.
export async function optionalStaff(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (user && (user.role === "ADMIN" || user.role === "DIRECTOR")) req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
