import { Router, Response } from "express";
import crypto from "crypto";
import { query, getOne, exec } from "../../lib/db";
import { AuthRequest } from "../../middleware/auth";
import { validate } from "../../lib/validation";
import { eventoSchema } from "../../lib/schemas";
import { deleteImage } from "../../lib/storage";
import { ah } from "../../lib/asyncHandler";
import { notifyContentPublishedAsync, buildContentUrl } from "../../lib/notify";
import type { EventRow, EventWithSignups } from "../../lib/types";

const router = Router();

const EVENTO_COM_INSCRICOES =
  "SELECT e.*, (SELECT COUNT(*) FROM eventsignup WHERE eventId = e.id) as signupCount FROM `event` e";

router.get("/", ah(async (_req: AuthRequest, res: Response) => {
  const eventos = await query<EventWithSignups[]>(`${EVENTO_COM_INSCRICOES} ORDER BY e.\`date\` DESC`);
  return res.json(eventos);
}));

router.get("/:id", ah(async (req: AuthRequest, res: Response) => {
  const evento = await getOne<EventWithSignups>(`${EVENTO_COM_INSCRICOES} WHERE e.id = ?`, [req.params.id]);
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  return res.json(evento);
}));

router.post("/", validate(eventoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
  const id = crypto.randomUUID();
  await exec(
    "INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null]
  );
  const evento = await getOne<EventWithSignups>(`${EVENTO_COM_INSCRICOES} WHERE e.id = ?`, [id]);
  if (isPublic ?? true) {
    notifyContentPublishedAsync("evento", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("evento", id),
    });
  }
  return res.status(201).json(evento);
}));

router.put("/:id", validate(eventoSchema), ah(async (req: AuthRequest, res: Response) => {
  const { title, description, date, location, imageUrl, isPublic, maxParticipants } = req.body;
  const antigo = await getOne<{ imageUrl: string | null; isPublic: number | boolean | null }>(
    "SELECT imageUrl, isPublic FROM `event` WHERE id = ?",
    [req.params.id]
  );
  if (!antigo) return res.status(404).json({ message: "Evento não encontrado" });

  await exec(
    "UPDATE `event` SET title=?, description=?, `date`=?, location=?, imageUrl=?, isPublic=?, maxParticipants=? WHERE id=?",
    [title, description, date, location ?? null, imageUrl ?? null, isPublic ?? true, maxParticipants ?? null, req.params.id]
  );
  if (antigo.imageUrl && antigo.imageUrl !== imageUrl) await deleteImage(antigo.imageUrl);
  if (!antigo.isPublic && (isPublic ?? true)) {
    notifyContentPublishedAsync("evento", {
      title,
      summary: description,
      imageUrl,
      url: buildContentUrl("evento", req.params.id),
    });
  }
  const evento = await getOne<EventRow>("SELECT * FROM `event` WHERE id = ?", [req.params.id]);
  return res.json(evento);
}));

router.delete("/:id", ah(async (req: AuthRequest, res: Response) => {
  const evento = await getOne<{ imageUrl: string | null }>("SELECT imageUrl FROM `event` WHERE id = ?", [req.params.id]);
  if (!evento) return res.status(404).json({ message: "Evento não encontrado" });
  await exec("DELETE FROM `event` WHERE id = ?", [req.params.id]);
  if (evento.imageUrl) await deleteImage(evento.imageUrl);
  return res.json({ success: true });
}));

export default router;
