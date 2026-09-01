import { Router, Response } from "express";
import { query, getOne } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ah } from "../lib/asyncHandler";

interface NoticiaRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: string | null;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
}

const router = Router();

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<any[]>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id WHERE published = ? ORDER BY n.createdAt DESC",
    [true]
  );
  const noticias = rows.map(({ authorName, ...n }: any) => ({ ...n, author: { name: authorName } }));
  return res.json(noticias);
}));

router.get("/:slug", ah(async (req: AuthRequest, res: Response) => {
  const row = await getOne<NoticiaRow>(
    "SELECT n.*, u.name as authorName FROM newsarticle n LEFT JOIN `user` u ON n.authorId = u.id WHERE slug = ? AND published = ?",
    [req.params.slug, true]
  );
  if (!row) return res.status(404).json({ message: "Notícia não encontrada" });
  const { authorName, ...n } = row;
  return res.json({ ...n, author: { name: authorName } });
}));

export default router;
