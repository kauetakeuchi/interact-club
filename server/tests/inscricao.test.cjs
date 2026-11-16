const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/interact_club";

const db = require("../dist/lib/db");
const { signToken } = require("../dist/lib/jwt");

const memberId = crypto.randomUUID();
const original = { getOne: db.getOne, withTransaction: db.withTransaction };

// Cenário da transação: evento encontrado, inscrições existentes, etc.
let scene;
let inserted;
db.getOne = async (sql, params = []) => {
  if (/FROM `user` WHERE id = \?/.test(sql) && params[0] === memberId) {
    return { id: memberId, role: "MEMBER", name: "Membro", email: "m@example.org", status: "ACTIVE", emailVerifiedAt: new Date(), passwordChangedAt: null };
  }
  return null;
};
db.withTransaction = async (fn) => {
  const conn = {
    async execute(sql) {
      if (/FOR UPDATE/.test(sql)) return [scene.evento ? [scene.evento] : []];
      if (/SELECT id FROM eventsignup/.test(sql)) return [scene.jaInscrito ? [{ id: "s1" }] : []];
      if (/COUNT\(\*\)/.test(sql)) return [[{ total: scene.inscritos ?? 0 }]];
      if (/INSERT INTO eventsignup/.test(sql)) { inserted = true; return [{}]; }
      throw new Error("SQL inesperado: " + sql);
    },
  };
  return fn(conn);
};

const app = express();
app.use(express.json());
app.use("/api/eventos", require("../dist/routes/eventos").default);
let server, base;

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise((r) => server.close(r));
  Object.assign(db, original);
});

async function inscrever(s) {
  scene = s;
  inserted = false;
  const res = await fetch(`${base}/api/eventos/inscrever`, {
    method: "POST",
    headers: { Authorization: `Bearer ${signToken(memberId)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ eventId: crypto.randomUUID() }),
  });
  return { status: res.status, message: (await res.json()).message };
}

const futuro = new Date(Date.now() + 86400000);

test("inscrição em evento: casos de erro e sucesso", async () => {
  assert.deepEqual(await inscrever({ evento: null }), { status: 404, message: "Evento não encontrado" });
  assert.deepEqual(await inscrever({ evento: { date: new Date(Date.now() - 86400000), maxParticipants: null } }),
    { status: 400, message: "Este evento já foi realizado" });
  assert.deepEqual(await inscrever({ evento: { date: futuro, maxParticipants: null }, jaInscrito: true }),
    { status: 409, message: "Você já está inscrito" });
  assert.deepEqual(await inscrever({ evento: { date: futuro, maxParticipants: 2 }, inscritos: 2 }),
    { status: 400, message: "Evento lotado!" });
  assert.equal(inserted, false);

  const ok = await inscrever({ evento: { date: futuro, maxParticipants: 2 }, inscritos: 1 });
  assert.equal(ok.status, 201);
  assert.equal(inserted, true);
});

test("inscrição exige login", async () => {
  const res = await fetch(`${base}/api/eventos/inscrever`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(res.status, 401);
});
