import { Router, Response } from "express";
import { query, getOne } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ah } from "../lib/asyncHandler";

const router = Router();

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const projetos = await query("SELECT * FROM `project` ORDER BY createdAt DESC");
  return res.json(projetos);
}));

router.get("/:id", ah(async (req: AuthRequest, res: Response) => {
    const projeto = await getOne<Record<string, unknown>>("SELECT * FROM `project` WHERE id = ?", [req.params.id]);
  if (!projeto) return res.status(404).json({ message: "Projeto não encontrado" });
  return res.json(projeto);
}));

export default router;
