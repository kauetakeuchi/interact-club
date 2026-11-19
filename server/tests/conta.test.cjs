const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const cookieParser = require("cookie-parser");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/interact_club";

const db = require("../dist/lib/db");
const email = require("../dist/lib/email");
const { signToken, verifyToken } = require("../dist/lib/jwt");
const { requireAuth } = require("../dist/middleware/auth");
const authRouter = require("../dist/routes/auth").default;
const { registerSchema } = require("../dist/lib/schemas");

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.on("listening", resolve));
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function postJson(url, body, headers = {}) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
}

const cadastro = { name: "Dono do Email", email: "dono@example.org", password: "Abcdef1!" };

test("cadastro não confirmado é substituído pelo novo, sem reservar o email", async () => {
  const original = { getOne: db.getOne, exec: db.exec, send: email.sendVerificationEmail };
  const execs = [];
  const sent = [];
  db.getOne = async () => ({ id: "conta-pendente", emailVerifiedAt: null });
  db.exec = async (sql, params) => { execs.push({ sql, params }); return { affectedRows: 1 }; };
  email.sendVerificationEmail = async (to, name, token) => { sent.push({ to, name, token }); };
  try {
    await withServer(async (base) => {
      const res = await postJson(`${base}/api/auth/register`, cadastro);
      assert.equal(res.status, 201);
      assert.equal(execs.length, 1);
      assert.match(execs[0].sql, /^UPDATE `user` SET name = \?, passwordHash = \?/);
      assert.match(execs[0].sql, /WHERE id = \? AND emailVerifiedAt IS NULL$/);
      assert.equal(execs[0].params[0], "Dono do Email");
      assert.equal(execs[0].params.at(-1), "conta-pendente");
      // O link novo é gerado de novo e vai para o email cadastrado.
      assert.equal(sent.length, 1);
      assert.equal(sent[0].to, "dono@example.org");
      assert.equal(execs[0].params[4], crypto.createHash("sha256").update(sent[0].token).digest("hex"));
    });
  } finally {
    db.getOne = original.getOne;
    db.exec = original.exec;
    email.sendVerificationEmail = original.send;
  }
});

test("cadastro com email já confirmado continua recusado", async () => {
  const original = { getOne: db.getOne, exec: db.exec };
  const execs = [];
  db.getOne = async () => ({ id: "conta-ativa", emailVerifiedAt: new Date() });
  db.exec = async (sql) => { execs.push(sql); return { affectedRows: 1 }; };
  try {
    await withServer(async (base) => {
      const res = await postJson(`${base}/api/auth/register`, cadastro);
      assert.equal(res.status, 409);
      assert.equal((await res.json()).code, "EMAIL_ALREADY_REGISTERED");
      assert.equal(execs.length, 0);
    });
  } finally {
    db.getOne = original.getOne;
    db.exec = original.exec;
  }
});

test("data de nascimento fica no dia digitado e não aceita datas impossíveis", () => {
  assert.equal(registerSchema.parse({ ...cadastro, birthDate: "2005-03-10" }).birthDate, "2005-03-10");
  assert.equal(registerSchema.parse({ ...cadastro, birthDate: "" }).birthDate, null);
  for (const invalida of ["2005-02-30", "1899-12-31", "3000-01-01", "10/03/2005"]) {
    assert.equal(registerSchema.safeParse({ ...cadastro, birthDate: invalida }).success, false, invalida);
  }
});

test("sair encerra a sessão no servidor", async () => {
  const userId = crypto.randomUUID();
  const token = signToken(userId);
  const { sessionId } = verifyToken(token);
  assert.ok(sessionId, "cada sessão nova tem identificador");

  const original = { getOne: db.getOne, exec: db.exec };
  const revoked = new Set();
  db.exec = async (sql, params) => {
    if (/INSERT IGNORE INTO revoked_session/.test(sql)) revoked.add(params[0]);
    return { affectedRows: 1 };
  };
  db.getOne = async (sql, params) => ({
    id: userId, role: "MEMBER", name: "Membro", email: "m@example.org", status: "ACTIVE",
    emailVerifiedAt: new Date(), passwordChangedAt: null,
    sessionRevoked: /revoked_session/.test(sql) && revoked.has(params[1]) ? 1 : 0,
  });
  const invoke = () => new Promise((resolve) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status(code) { resolve(code); return this; }, json() {} };
    requireAuth(req, res, () => resolve("ok"));
  });
  try {
    assert.equal(await invoke(), "ok");
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: `interact_session=${token}` } });
      assert.equal(res.status, 200);
    });
    assert.ok(revoked.has(sessionId));
    assert.equal(await invoke(), 401);
  } finally {
    db.getOne = original.getOne;
    db.exec = original.exec;
  }
});

