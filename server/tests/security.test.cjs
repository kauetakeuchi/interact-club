const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/interact_club";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";

const { imageExtension } = require("../dist/lib/image");
const { signToken } = require("../dist/lib/jwt");
const db = require("../dist/lib/db");
const { requireAuth, requireAdmin } = require("../dist/middleware/auth");
const storage = require("../dist/lib/storage");
const { loginSchema, registerSchema, membroUpdateSchema, projetoSchema } = require("../dist/lib/schemas");

test("servidor rejeita JWT_SECRET ausente", () => {
  const result = spawnSync(process.execPath, ["-e", "require('./dist/lib/jwt')"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, JWT_SECRET: "" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET deve ter pelo menos 32 bytes/);
});

test("seed de contas com senhas conhecidas exige autorização local", () => {
  for (const env of [
    { ALLOW_DEMO_SEED: "", NODE_ENV: "development" },
    { ALLOW_DEMO_SEED: "true", NODE_ENV: "production" },
  ]) {
    const result = spawnSync(process.execPath, ["dist/seed.js"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, ...env },
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Seed de demonstração bloqueado/);
  }
});

test("novas senhas exigem 8 caracteres, maiúscula, minúscula, número e especial", () => {
  const registration = { name: "Pessoa Teste", email: "teste@example.org", password: "Abcdef1!" };
  assert.equal(registerSchema.safeParse(registration).success, true);
  assert.equal(registerSchema.safeParse({ ...registration, password: "Ábcdef1!" }).success, true);
  for (const password of ["Abcde1!", "abcdef1!", "ABCDEF1!", "Abcdefg!", "Abcdef12", "Abcde 12"]) {
    assert.equal(registerSchema.safeParse({ ...registration, password }).success, false, password);
    assert.equal(membroUpdateSchema.safeParse({ password }).success, false, password);
  }
  assert.equal(membroUpdateSchema.safeParse({ password: registration.password }).success, true);
  assert.equal(loginSchema.safeParse({ email: registration.email, password: "senhaantiga" }).success, true);
});

test("datas de projeto permanecem no dia informado", () => {
  const base = { title: "Projeto de teste", description: "Descrição do projeto" };
  const parsed = projetoSchema.parse({ ...base, startDate: "2026-11-10", endDate: "" });
  assert.equal(parsed.startDate, "2026-11-10");
  assert.equal(parsed.endDate, null);
  assert.equal(projetoSchema.safeParse({ ...base, startDate: "2026-02-31" }).success, false);
  assert.equal(projetoSchema.safeParse({ ...base, endDate: "10/11/2026" }).success, false);
});

test("conta desativada ou rebaixada perde acesso imediatamente", async () => {
  const id = crypto.randomUUID();
  const token = signToken(id);
  const originalGetOne = db.getOne;
  let account = { id, role: "ADMIN", name: "Teste", email: "teste@example.org", status: "ACTIVE", emailVerifiedAt: new Date() };
  db.getOne = async () => account;
  try {
    const invoke = (middleware) => new Promise((resolve) => {
      const req = { headers: { authorization: `Bearer ${token}` } };
      const result = { req, status: null, next: false };
      const res = { status(code) { result.status = code; return this; }, json() { resolve(result); } };
      middleware(req, res, () => { result.next = true; resolve(result); });
    });
    assert.equal((await invoke(requireAdmin)).next, true);
    account = { ...account, role: "MEMBER" };
    assert.equal((await invoke(requireAdmin)).status, 403);
    account = { ...account, status: "INACTIVE" };
    assert.equal((await invoke(requireAuth)).status, 401);
    account = null;
    assert.equal((await invoke(requireAuth)).status, 401);
  } finally {
    db.getOne = originalGetOne;
  }
});

test("API pública não consulta projetos e eventos internos nem expõe avisos", async () => {
  const originalQuery = db.query;
  const originalGetOne = db.getOne;
  const sqlSeen = [];
  db.query = async (sql) => { sqlSeen.push(sql); return []; };
  db.getOne = async (sql) => { sqlSeen.push(sql); return null; };
  const app = express();
  app.use("/api/projetos", require("../dist/routes/projetos").default);
  app.use("/api/eventos", require("../dist/routes/eventos").default);
  app.use("/api/avisos", require("../dist/routes/avisos").default);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.on("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(`${base}/api/projetos`)).status, 200);
    assert.equal((await fetch(`${base}/api/projetos/secret`)).status, 404);
    assert.equal((await fetch(`${base}/api/eventos/secret`)).status, 404);
    assert.equal((await fetch(`${base}/api/avisos`)).status, 401);
    assert.equal(sqlSeen.length, 3);
    for (const sql of sqlSeen) assert.match(sql, /isPublic\s*=\s*1/);

    const adminId = crypto.randomUUID();
    const token = signToken(adminId);
    let role = "ADMIN";
    db.getOne = async (sql) => {
      if (sql.includes("FROM `user`")) {
        return { id: adminId, role, name: "Teste", email: "teste@example.org", status: "ACTIVE", emailVerifiedAt: new Date() };
      }
      return /isPublic\s*=\s*1/.test(sql) ? null : { id: "secret", isPublic: false };
    };
    const headers = { Authorization: `Bearer ${token}` };
    assert.equal((await fetch(`${base}/api/projetos/secret`, { headers })).status, 200);
    assert.equal((await fetch(`${base}/api/eventos/secret`, { headers })).status, 200);
    role = "MEMBER";
    assert.equal((await fetch(`${base}/api/projetos/secret`, { headers })).status, 404);
    assert.equal((await fetch(`${base}/api/eventos/secret`, { headers })).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.query = originalQuery;
    db.getOne = originalGetOne;
  }
});

test("upload aceita assinaturas de imagem e rejeita conteúdo falso", () => {
  assert.equal(imageExtension(Buffer.from([0xff, 0xd8, 0xff, 0x00])), ".jpg");
  assert.equal(imageExtension(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), ".png");
  assert.equal(imageExtension(Buffer.from("GIF89a")), ".gif");
  assert.equal(imageExtension(Buffer.from("RIFF0000WEBP")), ".webp");
  assert.equal(imageExtension(Buffer.from("<script>alert(1)</script>")), null);
});

test("remoção de imagens fica restrita à pasta de uploads e à conta Cloudinary", () => {
  const name = crypto.randomUUID();
  const canary = path.join(__dirname, "../../public", `${name}.txt`);
  const image = path.join(storage.UPLOAD_DIR, `${name}.png`);
  fs.writeFileSync(canary, "não apagar");
  fs.writeFileSync(image, "imagem de teste");
  try {
    storage.deleteLocalFile(`/uploads/../${name}.txt`);
    assert.equal(fs.existsSync(canary), true);
    storage.deleteLocalFile(`/uploads/${name}.png`);
    assert.equal(fs.existsSync(image), false);
    assert.equal(storage.extractCloudinaryPublicId(`https://res.cloudinary.com/test-cloud/image/upload/v1/interact-club/${name}.png`), `interact-club/${name}`);
    assert.equal(storage.extractCloudinaryPublicId(`https://res.cloudinary.com/other-cloud/image/upload/v1/interact-club/${name}.png`), null);
    assert.equal(storage.extractCloudinaryPublicId(`https://res.cloudinary.com/test-cloud/image/upload/v1/other-folder/${name}.png`), null);
  } finally {
    fs.rmSync(canary, { force: true });
    fs.rmSync(image, { force: true });
  }
});
