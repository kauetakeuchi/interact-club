/**
 * Aplica as migrations de server/migrations em ordem e registra cada uma na
 * tabela `schema_migrations`, para nunca rodar a mesma duas vezes.
 *
 * Uso: npm run migrate
 *
 * Convenção: 001_schema.sql sempre contém o esquema COMPLETO e atual. As
 * migrations seguintes existem para atualizar bancos criados antes delas.
 * Por isso, num banco vazio, roda-se só o 001 e as demais são marcadas
 * como aplicadas. Ao criar uma migration nova, atualize também o 001.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

// Bancos atualizados à mão antes deste script existir: cada migration
// antiga é reconhecida por uma coluna que ela criou.
const LEGACY_MARKERS: Record<string, { table: string; column: string }> = {
  "002_email_verification.sql": { table: "user", column: "emailVerifiedAt" },
  "003_email_updates_consent.sql": { table: "user", column: "emailUpdatesOptIn" },
  "004_polish.sql": { table: "user", column: "passwordResetTokenHash" },
  "005_project_updated_at.sql": { table: "project", column: "updatedAt" },
};

function connectionConfig() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não definido. Configure server/.env.");
  const url = new URL(process.env.DATABASE_URL);
  const database = url.pathname.replace("/", "");
  if (url.protocol !== "mysql:" || !database) throw new Error("DATABASE_URL deve ser uma URL MySQL válida.");
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error("Nome de banco inválido em DATABASE_URL.");
  return {
    database,
    options: {
      host: url.hostname,
      port: parseInt(url.port || "3306"),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      multipleStatements: true,
    },
  };
}

// Os arquivos trazem "CREATE DATABASE"/"USE interact_club"; aqui vale o banco do DATABASE_URL.
function stripDatabaseSelection(sql: string): string {
  return sql.replace(/^\s*(CREATE\s+DATABASE|USE)\b[^;]*;\s*$/gim, "");
}

async function main() {
  const { database, options } = connectionConfig();
  const conn = await mysql.createConnection(options);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${database}\``);
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      appliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
    const [doneRows] = await conn.query("SELECT name FROM schema_migrations");
    const done = new Set((doneRows as { name: string }[]).map((r) => r.name));
    const record = (name: string) => conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [name]);

    if (done.size === 0) {
      const [tables] = await conn.query("SHOW TABLES LIKE 'user'");
      if ((tables as unknown[]).length === 0) {
        // Banco vazio: o 001 cria tudo na versão mais recente.
        console.log(`Criando o banco a partir de ${files[0]}...`);
        await conn.query(stripDatabaseSelection(fs.readFileSync(path.join(MIGRATIONS_DIR, files[0]), "utf8")));
        for (const f of files) { await record(f); done.add(f); }
        console.log("Banco criado na versão mais recente.");
        return;
      } else {
        // Banco que já existia antes deste script: o 001 com certeza rodou.
        await record(files[0]);
        done.add(files[0]);
      }
    }

    const pending = files.filter((f) => !done.has(f));
    let applied = 0;
    for (const f of pending) {
      // Migration aplicada à mão antes deste script existir: só registra.
      const marker = LEGACY_MARKERS[f];
      if (marker) {
        const [cols] = await conn.query(`SHOW COLUMNS FROM \`${marker.table}\` LIKE ?`, [marker.column]);
        if ((cols as unknown[]).length > 0) {
          await record(f);
          console.log(`${f}: já estava aplicada (registrada agora).`);
          continue;
        }
      }
      console.log(`Aplicando ${f}...`);
      await conn.query(stripDatabaseSelection(fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")));
      await record(f);
      applied++;
    }
    console.log(applied ? `${applied} migration(s) aplicada(s).` : "Banco já está atualizado.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Falha ao migrar:", err.message || err);
  process.exit(1);
});
