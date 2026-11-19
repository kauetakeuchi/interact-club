import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { AuthRequest, requireAuth, requireStaff } from "../middleware/auth";
import { UPLOAD_DIR, discardImage, isCloudinaryEnabled, uploadToCloudinary } from "../lib/storage";
import { imageExtension } from "../lib/image";
import { ah } from "../lib/asyncHandler";
import { getOne, exec } from "../lib/db";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

async function saveImage(buffer: Buffer, extension: string): Promise<string> {
  const fileName = crypto.randomUUID();
  if (isCloudinaryEnabled()) {
    const { url } = await uploadToCloudinary(buffer, fileName);
    return url;
  }
  await fs.writeFile(path.join(UPLOAD_DIR, fileName + extension), buffer, { flag: "wx" });
  return `/uploads/${fileName}${extension}`;
}

router.post("/", requireStaff, upload.single("file"), ah(async (req, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });
  const extension = imageExtension(req.file.buffer);
  if (!extension) return res.status(400).json({ message: "Envie uma imagem JPEG, PNG, WebP ou GIF válida" });
  return res.json({ url: await saveImage(req.file.buffer, extension) });
}));

// Foto de perfil do próprio usuário: o link é gerado aqui, nunca vem do cliente.
router.post("/avatar", requireAuth, avatarUpload.single("file"), ah(async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });
  const extension = imageExtension(req.file.buffer);
  if (!extension || extension === ".gif") {
    return res.status(400).json({ message: "Envie uma imagem JPEG, PNG ou WebP válida" });
  }

  const current = await getOne<{ avatarUrl: string | null }>("SELECT avatarUrl FROM `user` WHERE id = ?", [req.user!.id]);
  const avatarUrl = await saveImage(req.file.buffer, extension);
  await exec("UPDATE `user` SET avatarUrl = ? WHERE id = ?", [avatarUrl, req.user!.id]);
  await discardImage(current?.avatarUrl, "avatar");
  return res.json({ avatarUrl });
}));

router.delete("/avatar", requireAuth, ah(async (req: AuthRequest, res: Response) => {
  const current = await getOne<{ avatarUrl: string | null }>("SELECT avatarUrl FROM `user` WHERE id = ?", [req.user!.id]);
  await exec("UPDATE `user` SET avatarUrl = NULL WHERE id = ?", [req.user!.id]);
  await discardImage(current?.avatarUrl, "avatar");
  return res.json({ avatarUrl: null });
}));

export default router;
