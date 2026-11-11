import { Router, Response } from "express";
import crypto from "crypto";
import { exec } from "../lib/db";
import { validate } from "../lib/validation";
import { contatoSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";

const router = Router();

// Público: qualquer visitante pode enviar mensagem pelo formulário.
router.post("/", validate(contatoSchema), ah(async (req: any, res: Response) => {
  const { name, email, phone, subject, message, website } = req.body;

  // Honeypot: campo invisível que humanos não preenchem. Bots recebem sucesso e nada é gravado.
  if (website) return res.status(201).json({ success: true });

  await exec(
    "INSERT INTO contact (id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), name, email, phone ?? null, subject, message]
  );
  return res.status(201).json({ success: true });
}));

export default router;
