import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { requireStaff } from "../middleware/auth";
import { UPLOAD_DIR, isCloudinaryEnabled, uploadToCloudinary } from "../lib/storage";
import { imageExtension } from "../lib/image";
import { ah } from "../lib/asyncHandler";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.post("/", requireStaff, upload.single("file"), ah(async (req, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });
  const extension = imageExtension(req.file.buffer);
  if (!extension) return res.status(400).json({ message: "Envie uma imagem JPEG, PNG, WebP ou GIF válida" });

  const fileName = crypto.randomUUID();
  if (isCloudinaryEnabled()) {
    const { url } = await uploadToCloudinary(req.file.buffer, fileName);
    return res.json({ url });
  }

  await fs.writeFile(path.join(UPLOAD_DIR, fileName + extension), req.file.buffer, { flag: "wx" });
  return res.json({ url: `/uploads/${fileName}${extension}` });
}));

export default router;
