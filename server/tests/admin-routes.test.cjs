const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/interact_club";

const db = require("../dist/lib/db");
const storage = require("../dist/lib/storage");
const notify = require("../dist/lib/notify");
const { signToken } = require("../dist/lib/jwt");

// Banco falso: cada teste define como responder; tudo que roda fica registrado.
const fake = { rows: () => null, list: () => [], calls: [], deleted: [], notified: [] };
const original = { query: db.query, getOne: db.getOne, exec: db.exec, deleteImage: storage.deleteImage, notify: notify.notifyContentPublishedAsync };

const staffId = crypto.randomUUID();
let role = "ADMIN";

db.getOne = async (sql, params = []) => {
  fake.calls.push({ fn: "getOne", sql, params });
  if (/FROM `user` WHERE id = \?/.test(sql) && params[0] === staffId) {
    return { id: staffId, role, name: "Equipe", email: "equipe@example.org", status: "ACTIVE", emailVerifiedAt: new Date(), passwordChangedAt: null };
  }
  return fake.rows(sql, params);
};
db.query = async (sql, params = []) => { fake.calls.push({ fn: "query", sql, params }); return fake.list(sql, params); };
db.exec = async (sql, params = []) => { fake.calls.push({ fn: "exec", sql, params }); return { affectedRows: 1 }; };
storage.deleteImage = async (url) => { fake.deleted.push(url); };
notify.notifyContentPublishedAsync = (kind, content) => { fake.notified.push({ kind, ...content }); };

const app = express();
app.use(express.json());
app.use("/api/admin", require("../dist/routes/admin").default);
let server, base;
const auth = () => ({ Authorization: `Bearer ${signToken(staffId)}`, "Content-Type": "application/json" });

function reset({ rows = () => null, list = () => [] } = {}) {
  Object.assign(fake, { rows, list, calls: [], deleted: [], notified: [] });
  role = "ADMIN";
}
const execs = () => fake.calls.filter((c) => c.fn === "exec");
const call = (method, path, body) =>
  fetch(`${base}/api/admin${path}`, { method, headers: auth(), body: body && JSON.stringify(body) });

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise((r) => server.close(r));
  Object.assign(db, { query: original.query, getOne: original.getOne, exec: original.exec });
  storage.deleteImage = original.deleteImage;
  notify.notifyContentPublishedAsync = original.notify;
});

test("admin exige login e cargo de equipe", async () => {
  reset();
  assert.equal((await fetch(`${base}/api/admin/stats`)).status, 401);
  role = "MEMBER";
  assert.equal((await call("GET", "/stats")).status, 403);
  role = "DIRECTOR";
  assert.equal((await call("GET", "/stats")).status, 200);
});

test("painel soma os totais de cada tabela", async () => {
  const totals = { "`user`": 7, "`event`": 3, "`project`": 4, newsarticle: 2, notice: 1 };
  reset({ rows: (sql) => ({ total: Object.entries(totals).find(([t]) => sql.includes(`FROM ${t}`))[1] }) });
  const res = await call("GET", "/stats");
  assert.deepEqual(await res.json(), { membros: 7, eventos: 3, projetos: 4, noticias: 2, avisos: 1 });
});

test("eventos: listar, abrir, criar, editar e excluir", async () => {
  reset({ list: () => [{ id: "e1" }] });
  assert.deepEqual(await (await call("GET", "/eventos")).json(), [{ id: "e1" }]);

  reset();
  assert.equal((await call("GET", "/eventos/nao-existe")).status, 404);

  const evento = { title: "Mutirão", description: "Ação na praça", date: "2026-12-01T10:00", imageUrl: "/uploads/novo.png" };
  reset({ rows: (sql, p) => ({ id: p[0], title: "Mutirão" }) });
  let res = await call("POST", "/eventos", evento);
  assert.equal(res.status, 201);
  assert.match(execs()[0].sql, /INSERT INTO `event`/);
  assert.equal(fake.notified.length, 1, "evento público avisa por email");
  assert.equal(fake.notified[0].kind, "evento");

  reset();
  await call("POST", "/eventos", { ...evento, isPublic: false });
  assert.equal(fake.notified.length, 0, "evento interno não avisa");

  reset({ rows: (sql) => (/SELECT imageUrl, isPublic/.test(sql) ? { imageUrl: "/uploads/velho.png", isPublic: 0 } : { id: "e1" }) });
  res = await call("PUT", "/eventos/e1", evento);
  assert.equal(res.status, 200);
  assert.match(execs()[0].sql, /UPDATE `event`/);
  assert.deepEqual(fake.deleted, ["/uploads/velho.png"], "troca de imagem apaga a antiga");
  assert.equal(fake.notified.length, 1, "evento que passou a ser público avisa");

  reset();
  assert.equal((await call("PUT", "/eventos/e1", evento)).status, 404);
  assert.equal((await call("POST", "/eventos", { ...evento, title: "" })).status, 400);

  reset({ rows: () => ({ imageUrl: "/uploads/x.png" }) });
  assert.equal((await call("DELETE", "/eventos/e1")).status, 200);
  assert.match(execs()[0].sql, /DELETE FROM `event`/);
  assert.deepEqual(fake.deleted, ["/uploads/x.png"]);
  reset();
  assert.equal((await call("DELETE", "/eventos/e1")).status, 404);
});

test("projetos: criar, editar e excluir", async () => {
  const projeto = { title: "Horta", description: "Horta comunitária", status: "IN_PROGRESS", startDate: "2026-11-10" };
  reset();
  let res = await call("POST", "/projetos", projeto);
  assert.equal(res.status, 201);
  assert.equal(typeof (await res.json()).id, "string");
  assert.match(execs()[0].sql, /INSERT INTO `project`/);
  assert.equal(fake.notified[0]?.kind, "projeto");

  reset({ rows: () => ({ imageUrl: null, isPublic: 1 }) });
  assert.equal((await call("PUT", "/projetos/p1", projeto)).status, 200);
  assert.equal(fake.notified.length, 0, "projeto que já era público não avisa de novo");
  assert.equal(fake.deleted.length, 0);

  reset();
  assert.equal((await call("GET", "/projetos/p1")).status, 404);
  assert.equal((await call("DELETE", "/projetos/p1")).status, 404);
  assert.equal((await call("POST", "/projetos", { ...projeto, status: "X" })).status, 400);
});

test("notícias: slug único, autor e aviso só quando publicada", async () => {
  const noticia = { title: "Nova diretoria", slug: "nova-diretoria", content: "Texto completo da notícia." };
  reset({ list: () => [{ id: "n1", authorName: "Ana" }] });
  assert.deepEqual(await (await call("GET", "/noticias")).json(), [{ id: "n1", author: { name: "Ana" } }]);

  reset({ rows: (sql) => (/WHERE slug = \?/.test(sql) ? { id: "outra" } : null) });
  assert.equal((await call("POST", "/noticias", noticia)).status, 409);

  reset();
  assert.equal((await call("POST", "/noticias", noticia)).status, 201);
  assert.equal(execs()[0].params.at(-1), staffId, "autor é quem publicou");
  assert.equal(fake.notified.length, 0, "rascunho não avisa");

  reset();
  await call("POST", "/noticias", { ...noticia, published: true });
  assert.equal(fake.notified[0]?.kind, "noticia");

  reset({ rows: (sql) => (/SELECT imageUrl, published/.test(sql) ? { imageUrl: "/uploads/a.png", published: 0 } : null) });
  assert.equal((await call("PUT", "/noticias/n1", { ...noticia, published: true, imageUrl: "/uploads/b.png" })).status, 200);
  assert.deepEqual(fake.deleted, ["/uploads/a.png"]);
  assert.equal(fake.notified.length, 1);

  reset({ rows: (sql) => (/AND id != \?/.test(sql) ? { id: "outra" } : null) });
  assert.equal((await call("PUT", "/noticias/n1", noticia)).status, 409);
  reset();
  assert.equal((await call("GET", "/noticias/n1")).status, 404);
  assert.equal((await call("DELETE", "/noticias/n1")).status, 404);
});

test("avisos e mensagens de contato", async () => {
  reset({ list: () => [{ id: "a1", authorName: "Bia" }] });
  assert.deepEqual(await (await call("GET", "/avisos")).json(), [{ id: "a1", author: { name: "Bia" } }]);

  reset();
  assert.equal((await call("POST", "/avisos", { title: "Reunião", content: "Sábado às 10h." })).status, 201);
  assert.equal(execs()[0].params.at(-1), staffId);
  assert.equal((await call("PUT", "/avisos/a1", { title: "Reunião", content: "Sábado às 10h." })).status, 404);
  assert.equal((await call("DELETE", "/avisos/a1")).status, 404);

  reset({ rows: () => ({ id: "c1" }) });
  assert.equal((await call("PUT", "/contatos/c1/lida")).status, 200);
  assert.match(execs()[0].sql, /UPDATE contact SET isRead = TRUE/);
  assert.equal((await call("DELETE", "/contatos/c1")).status, 200);
  reset();
  assert.equal((await call("PUT", "/contatos/c1/lida")).status, 404);
});
