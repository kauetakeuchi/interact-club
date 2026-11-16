import { Router, Response } from "express";
import { query, getOne } from "../lib/db";
import { AuthRequest, optionalStaff } from "../middleware/auth";
import { ah } from "../lib/asyncHandler";
import { type NewsRow, type WithAuthorName, withAuthor } from "../lib/types";

const router = Router();

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<WithAuthorName<NewsRow>[]>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id WHERE published = ? ORDER BY n.createdAt DESC",
    [true]
  );
  return res.json(rows.map(withAuthor));
}));

// Staff pode abrir a prévia de uma notícia ainda não publicada.
router.get("/:slug", optionalStaff, ah(async (req: AuthRequest, res: Response) => {
  const staffFilter = req.user ? "" : " AND n.published = 1";
  const row = await getOne<WithAuthorName<NewsRow>>(
    `SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN \`user\` u ON n.authorId = u.id WHERE n.slug = ?${staffFilter}`,
    [req.params.slug]
  );
  if (!row) return res.status(404).json({ message: "Notícia não encontrada" });
  return res.json(withAuthor(row));
}));

export default router;
