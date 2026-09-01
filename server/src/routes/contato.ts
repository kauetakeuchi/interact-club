import { Router, Response } from "express";
import crypto from "crypto";
import { exec } from "../lib/db";
import { validate } from "../lib/validation";
import { contatoSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";

const router = Router();

// Público: qualquer visitante pode enviar mensagem pelo formulário
router.post("/", validate(contatoSchema), ah(async (req: any, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    await exec(
      "INSERT INTO contact (id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), name, email, phone ?? null, subject, message]
    );
    return res.status(201).json({ success: true });
  } catch (err) {
    logError("contato/create", err);
    return res.status(500).json({ message: "Erro ao enviar mensagem. Tente novamente." });
  }
}));

export default router;
