import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "interact-club-jwt-secret-2026";

if (!process.env.JWT_SECRET) {
  console.warn("[interact-club] JWT_SECRET não definido no .env — usando segredo padrão (NÃO use em produção)");
}

export function signToken(payload: { id: string; role: string; name: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { id: string; role: string; name: string; email: string };
}
