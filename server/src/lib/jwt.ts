import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 bytes aleatórios. Configure server/.env antes de iniciar.");
  }
  return secret;
}
const SECRET = getSecret();

export function signToken(id: string) {
  return jwt.sign({}, SECRET, { subject: id, expiresIn: "7d", algorithm: "HS256" });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || !payload.sub || typeof payload.sub !== "string") {
    throw new Error("Token inválido");
  }
  return payload.sub;
}
