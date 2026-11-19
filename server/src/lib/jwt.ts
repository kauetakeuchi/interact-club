import jwt from "jsonwebtoken";
import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 bytes aleatórios. Configure server/.env antes de iniciar.");
  }
  return secret;
}

const SECRET = getSecret();

export interface VerifiedToken {
  userId: string;
  issuedAt: number;
  /** Identificador da sessão; tokens antigos (sem jti) vêm como null. */
  sessionId: string | null;
  expiresAt: number;
}

export function signToken(id: string): string {
  return jwt.sign({}, SECRET, { subject: id, expiresIn: "7d", algorithm: "HS256", jwtid: crypto.randomUUID() });
}

export function verifyToken(token: string): VerifiedToken {
  const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || !payload.sub || typeof payload.sub !== "string") {
    throw new Error("Token inválido");
  }
  return {
    userId: payload.sub,
    issuedAt: Number(payload.iat ?? 0) * 1000,
    sessionId: typeof payload.jti === "string" ? payload.jti : null,
    expiresAt: Number(payload.exp ?? 0) * 1000,
  };
}
