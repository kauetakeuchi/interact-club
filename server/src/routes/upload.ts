import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../middleware/auth";
import { UPLOAD_DIR, isCloudinaryEnabled, uploadToCloudinary } from "../lib/storage";
import { logError } from "../lib/logger";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Apenas imagens JPEG, PNG, WebP ou GIF são permitidas"));
  },
});

router.post("/", requireAdmin, upload.single("file"), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });

    if (isCloudinaryEnabled()) {
      const buffer = fs.readFileSync(req.file.path);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        const { url } = await uploadToCloudinary(buffer, fileName);
        return res.json({ url });
      } finally {
        fs.unlinkSync(req.file.path);
      }
    }

    return res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) {
    logError("upload", err);
    return res.status(500).json({ message: "Erro ao fazer upload" });
  }
});

export default router;