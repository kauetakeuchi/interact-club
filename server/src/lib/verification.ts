import crypto from "crypto";
import { exec } from "./db";
import { sendVerificationEmail } from "./email";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function newVerificationToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
}

/**
 * Gera um novo token, grava apenas o hash no banco e envia o link.
 * Usado no reenvio e quando um administrador troca o email de um membro.
 */
export async function issueEmailVerification(user: { id: string; name: string; email: string }): Promise<void> {
  const { token, tokenHash, expiresAt } = newVerificationToken();
  await exec(
    "UPDATE `user` SET emailVerificationTokenHash = ?, emailVerificationExpiresAt = ? WHERE id = ? AND emailVerifiedAt IS NULL",
    [tokenHash, expiresAt, user.id]
  );
  await sendVerificationEmail(user.email, user.name, token);
}
