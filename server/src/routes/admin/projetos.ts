import { Router, Response } from "express";
import crypto from "crypto";
import { query, getOne, exec } from "../../lib/db";
import { AuthRequest } from "../../middleware/auth";
import { validate } from "../../lib/validation";
import { projetoSchema } from "../../lib/schemas";
import { deleteImage } from "../../lib/storage";
import { ah } from "../../lib/asyncHandler";
import { notifyContentPublishedAsync, buildContentUrl } from "../../lib/notify";
import type { ProjectRow } from "../../lib/types";

const router = Router();

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const projetos = await query<ProjectRow[]>("SELECT * FROM `project` ORDER BY createdAt DESC");
  return res.json(projetos);
}));

router.get("/:id", ah(async (req: AuthRequest, res: Response) => {
  const projeto = await getOne<ProjectRow>("SELECT * FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  return res.json(projeto);
}));

router.post("/", validate(projetoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
  const id = crypto.randomUUID();
  await exec(
    "INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true]
  );
  if (isPublic ?? true) {
    notifyContentPublishedAsync("projeto", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("projeto", id),
    });
  }
  return res.status(201).json({ success: true, id });
}));

router.put("/:id", validate(projetoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, status, startDate, endDate, imageUrl, isPublic } = req.body;
  const antigo = await getOne<{ imageUrl: string | null; isPublic: number | boolean | null }>(
    "SELECT imageUrl, isPublic FROM `project` WHERE id = ?",
    [req.params.id]
  );
  if (!antigo) return res.status(404).json({ message: "Projeto não encontrado" });

  await exec(
    "UPDATE `project` SET title=?, description=?, `status`=?, startDate=?, endDate=?, imageUrl=?, isPublic=? WHERE id=?",
    [title, description, status, startDate ?? null, endDate ?? null, imageUrl ?? null, isPublic ?? true, req.params.id]
  );
  if (antigo.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
  if (!antigo.isPublic && (isPublic ?? true)) {
    notifyContentPublishedAsync("projeto", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("projeto", req.params.id),
    });
  }
  return res.json({ success: true });
}));

router.delete("/:id", ah(async (req: AuthRequest, res: Response) => {
  const projeto = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  await exec("DELETE FROM `project` WHERE id = ?", [req.params.id]);
  if (projeto.imageUrl) await deleteImage(projeto.imageUrl);
  return res.json({ success: true });
}));

export default router;
