import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { getOne } from "../lib/db";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string; email: string };
}

async function loadActiveUser(userId: string): Promise<AuthRequest["user"] | null> {
  const user = await getOne<{ id: string; role: string; name: string; email: string; status: string; emailVerifiedAt: Date | null }>(
    "SELECT id, role, name, email, `status`, emailVerifiedAt FROM `user` WHERE id = ?",
    [userId]
  );
  if (!user || user.status !== "ACTIVE" || !user.emailVerifiedAt) return null;
  return { id: user.id, role: user.role, name: user.name, email: user.email };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  let userId: string;
  try {
    userId = verifyToken(header.slice(7));
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
  try {
    const user = await loadActiveUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Sessão inválida. Entre novamente." });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Permite visualizar itens internos no link de prévia quando um administrador está autenticado.
export async function optionalAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  let userId: string;
  try {
    userId = verifyToken(header.slice(7));
  } catch {
    return next();
  }
  try {
    const user = await loadActiveUser(userId);
    if (user?.role === "ADMIN") req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  void requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }
    next();
  });
}
