import { Router, Response } from "express";
import { getOne } from "../../lib/db";
import { requireStaff, AuthRequest } from "../../middleware/auth";
import { ah } from "../../lib/asyncHandler";
import eventosRoutes from "./eventos";
import projetosRoutes from "./projetos";
import noticiasRoutes from "./noticias";
import avisosRoutes from "./avisos";
import contatosRoutes from "./contatos";

const router = Router();

// Administração e diretoria mantêm o conteúdo do clube.
router.use(requireStaff);

async function count(table: string): Promise<number> {
  const row = await getOne<{ total: number }>(`SELECT COUNT(*) as total FROM ${table}`);
  return Number(row?.total ?? 0);
}

router.get("/stats", ah(async (_req: AuthRequest, res: Response) => {
  const [membros, eventos, projetos, noticias, avisos] = await Promise.all([
    count("`user`"),
    count("`event`"),
    count("`project`"),
    count("newsarticle"),
    count("notice"),
  ]);
  return res.json({ membros, eventos, projetos, noticias, avisos });
}));

router.use("/eventos", eventosRoutes);
router.use("/projetos", projetosRoutes);
router.use("/noticias", noticiasRoutes);
router.use("/avisos", avisosRoutes);
router.use("/contatos", contatosRoutes);

export default router;
