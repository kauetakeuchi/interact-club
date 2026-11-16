import { Router, Response } from "express";
import { query, getOne, exec, withTransaction } from "../lib/db";
import { AuthRequest, requireAuth, optionalStaff } from "../middleware/auth";
import { validate } from "../lib/validation";
import { inscricaoSchema, cancelamentoSchema } from "../lib/schemas";
import { ah } from "../lib/asyncHandler";
import { logError } from "../lib/logger";
import { HttpError } from "../lib/httpError";
import type { EventRow, EventWithSignups } from "../lib/types";

type InscricaoComEvento = Pick<EventRow, "title" | "description" | "date" | "location" | "imageUrl" | "maxParticipants" | "isPublic"> & {
  id: string;
  eventId: string;
  userId: string;
  createdAt: Date;
  event_createdAt: Date;
  event_updatedAt: Date;
};

const router = Router();

const EVENTO_COM_INSCRICOES = `
  SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount
  FROM \`event\` e`;

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const sql = `${EVENTO_COM_INSCRICOES} WHERE e.isPublic = 1`;
  const [futuros, passados] = await Promise.all([
    query<EventWithSignups[]>(sql + ` AND e.\`date\` >= NOW() ORDER BY e.\`date\` ASC`),
    query<EventWithSignups[]>(sql + ` AND e.\`date\` < NOW() ORDER BY e.\`date\` DESC LIMIT 6`),
  ]);
  return res.json({ futuros, passados });
}));

router.get("/:id", optionalStaff, ah(async (req: AuthRequest, res: Response) => {
  const visibilityFilter = req.user ? "" : " AND e.isPublic = 1";
  const evento = await getOne<EventWithSignups>(`${EVENTO_COM_INSCRICOES} WHERE e.id = ?${visibilityFilter}`, [req.params.id]);
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  return res.json(evento);
}));

router.post("/inscrever", requireAuth, validate(inscricaoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;
  try {
    await withTransaction(async (conn) => {
      // Lock na linha do evento garante que vagas não sejam estouradas por inscrições simultâneas
      const [rows] = await conn.execute(
        "SELECT `date`, maxParticipants FROM `event` WHERE id = ? AND isPublic = 1 FOR UPDATE",
        [eventId]
      );
      const evento = (rows as Pick<EventRow, "date" | "maxParticipants">[])[0];
      if (!evento) throw new HttpError(404, "Evento não encontrado");
      if (new Date(evento.date) < new Date()) throw new HttpError(400, "Este evento já foi realizado");

      const [dupRows] = await conn.execute(
        "SELECT id FROM eventsignup WHERE eventId = ? AND userId = ? LIMIT 1",
        [eventId, req.user!.id]
      );
      if ((dupRows as { id: string }[]).length > 0) throw new HttpError(409, "Você já está inscrito");

      if (evento.maxParticipants != null) {
        const [countRows] = await conn.execute(
          "SELECT COUNT(*) as total FROM eventsignup WHERE eventId = ?",
          [eventId]
        );
        if (Number((countRows as { total: number }[])[0]?.total ?? 0) >= Number(evento.maxParticipants)) {
          throw new HttpError(400, "Evento lotado!");
        }
      }

      await conn.execute("INSERT INTO eventsignup (id, eventId, userId) VALUES (UUID(), ?, ?)", [
        eventId,
        req.user!.id,
      ]);
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
    logError("eventos/inscrever", err);
    return res.status(500).json({ message: "Erro ao se inscrever" });
  }
}));

router.post("/cancelar", requireAuth, validate(cancelamentoSchema), ah(async (req: AuthRequest, res: Response) => {
  try {
    const { signupId } = req.body;
    const signup = await getOne<{ userId: string }>("SELECT userId FROM eventsignup WHERE id = ?", [signupId]);
    if (!signup || signup.userId !== req.user!.id) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }
    await exec("DELETE FROM eventsignup WHERE id = ?", [signupId]);
    return res.json({ success: true });
  } catch (err) {
    logError("eventos/cancelar", err);
    return res.status(500).json({ message: "Erro ao cancelar" });
  }
}));

router.get("/user/inscricoes", requireAuth, ah(async (req: AuthRequest, res: Response) => {
  const rows = await query<InscricaoComEvento[]>(
    `SELECT es.*, e.title, e.description, e.\`date\`, e.location, e.imageUrl, e.maxParticipants, e.isPublic,
            e.createdAt as event_createdAt, e.updatedAt as event_updatedAt
     FROM eventsignup es JOIN \`event\` e ON es.eventId = e.id
     WHERE es.userId = ? ORDER BY e.\`date\` ASC`,
    [req.user!.id]
  );
  const inscricoes = rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt,
    event: {
      id: row.eventId,
      title: row.title,
      description: row.description,
      date: row.date,
      location: row.location,
      imageUrl: row.imageUrl,
      maxParticipants: row.maxParticipants,
      isPublic: row.isPublic,
      createdAt: row.event_createdAt,
      updatedAt: row.event_updatedAt,
    },
  }));
  return res.json(inscricoes);
}));

export default router;
