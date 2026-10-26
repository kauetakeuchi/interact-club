const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/interact_club";

const db = require("../dist/lib/db");
const email = require("../dist/lib/email");
const { signToken } = require("../dist/lib/jwt");
const { getNotificationRecipients } = require("../dist/lib/notify");
const authRouter = require("../dist/routes/auth").default;
const { registerSchema } = require("../dist/lib/schemas");

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.on("listening", resolve));
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("cadastro salva a escolha antes do email de confirmação e assume não por padrão", async () => {
  const originalGetOne = db.getOne;
  const originalExec = db.exec;
  const originalSend = email.sendVerificationEmail;
  const events = [];
  db.getOne = async () => null;
  db.exec = async (sql, params) => { events.push({ type: "insert", sql, params }); };
  email.sendVerificationEmail = async () => { events.push({ type: "verification" }); };
  const body = { name: "Pessoa Teste", email: "teste@example.org", password: "Abcdef1!" };
  try {
    assert.equal(registerSchema.parse(body).emailUpdatesOptIn, false);
    await withServer(async (base) => {
      for (const [choice, expected] of [[undefined, false], [false, false], [true, true]]) {
        events.length = 0;
        const response = await fetch(`${base}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, emailUpdatesOptIn: choice }),
        });
        assert.equal(response.status, 201);
        assert.deepEqual(events.map((event) => event.type), ["insert", "verification"]);
        assert.match(events[0].sql, /emailUpdatesOptIn, emailUpdatesOptInAt/);
        assert.equal(events[0].params[10], expected);
        assert.equal(events[0].params[11] instanceof Date, expected);
      }
    });
  } finally {
    db.getOne = originalGetOne;
    db.exec = originalExec;
    email.sendVerificationEmail = originalSend;
  }
});

test("novidades consultam apenas contas ativas, verificadas e com escolha positiva", async () => {
  const originalQuery = db.query;
  let sql;
  db.query = async (statement) => { sql = statement; return [{ email: "sim@example.org" }]; };
  try {
    assert.deepEqual(await getNotificationRecipients(), ["sim@example.org"]);
    assert.match(sql, /`status`\s*=\s*'ACTIVE'/);
    assert.match(sql, /emailVerifiedAt IS NOT NULL/);
    assert.match(sql, /emailUpdatesOptIn\s*=\s*1/);
  } finally {
    db.query = originalQuery;
  }
});

test("desativar no perfil grava a revogação da preferência", async () => {
  const originalGetOne = db.getOne;
  const originalExec = db.exec;
  const user = {
    id: crypto.randomUUID(), name: "Pessoa Teste", email: "teste@example.org",
    role: "MEMBER", status: "ACTIVE", emailVerifiedAt: new Date(), emailUpdatesOptIn: 1,
  };
  let update;
  db.getOne = async () => user;
  db.exec = async (sql, params) => {
    update = { sql, params };
    user.emailUpdatesOptIn = params[5];
  };
  try {
    await withServer(async (base) => {
      const response = await fetch(`${base}/api/auth/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${signToken(user.id)}` },
        body: JSON.stringify({ name: user.name, emailUpdatesOptIn: false }),
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).emailUpdatesOptIn, false);
      assert.deepEqual(update.params.slice(5, 8), [false, false, false]);
      assert.match(update.sql, /ELSE NULL END/);
    });
  } finally {
    db.getOne = originalGetOne;
    db.exec = originalExec;
  }
});
