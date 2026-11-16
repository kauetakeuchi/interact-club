import { Router, Response } from "express";
import { query } from "../lib/db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { ah } from "../lib/asyncHandler";
import type { NoticeRow } from "../lib/types";

type AvisoComAutor = NoticeRow & { authorName: string | null; authorAvatarUrl: string | null };

const router = Router();

router.get("/", requireAuth, ah(async (_req: AuthRequest, res: Response) => {
  const rows = await query<AvisoComAutor[]>(
    "SELECT n.*, u.name as authorName, u.avatarUrl as authorAvatarUrl FROM notice n LEFT JOIN `user` u ON n.userId = u.id ORDER BY n.createdAt DESC"
  );
  return res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      userId: row.userId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: { name: row.authorName, avatarUrl: row.authorAvatarUrl },
    }))
  );
}));

export default router;
