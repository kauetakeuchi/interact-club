import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { requireAdmin } from "../middleware/auth";
import { UPLOAD_DIR, isCloudinaryEnabled, uploadToCloudinary } from "../lib/storage";
import { imageExtension } from "../lib/image";
import { logError } from "../lib/logger";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.post("/", requireAdmin, upload.single("file"), async (req, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });
  const extension = imageExtension(req.file.buffer);
  if (!extension) return res.status(400).json({ message: "Envie uma imagem JPEG, PNG, WebP ou GIF válida" });

  const fileName = crypto.randomUUID();
  try {
    if (isCloudinaryEnabled()) {
      const { url } = await uploadToCloudinary(req.file.buffer, fileName);
      return res.json({ url });
    }

    await fs.writeFile(path.join(UPLOAD_DIR, fileName + extension), req.file.buffer, { flag: "wx" });
    return res.json({ url: `/uploads/${fileName}${extension}` });
  } catch (err) {
    logError("upload", err);
    return res.status(500).json({ message: "Erro ao fazer upload" });
  }
});

export default router;
