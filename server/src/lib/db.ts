import mysql, { type ResultSetHeader } from "mysql2/promise";

/** Valores aceitos nos placeholders `?` das consultas. */
export type SqlParam = string | number | boolean | Date | null;

function parseDbUrl(): { host: string; port: number; user: string; password: string; database: string } {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definido. Configure server/.env antes de iniciar.");
  }
  const url = new URL(process.env.DATABASE_URL);
  if (url.protocol !== "mysql:" || !url.hostname || !url.pathname.slice(1)) {
    throw new Error("DATABASE_URL deve ser uma URL MySQL válida.");
  }
  return {
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
  };
}

const db = parseDbUrl();
const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/** Lista de linhas. Informe o formato: `query<EventRow[]>(...)`. */
export async function query<T = unknown[]>(sql: string, params?: SqlParam[]): Promise<T> {
  const [rows] = await pool.execute(sql, params || []);
  return rows as T;
}

/** Primeira linha do resultado, ou null. */
export async function getOne<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T | null> {
  const [rows] = await pool.execute(sql, params || []);
  const arr = rows as T[];
  return arr.length > 0 ? arr[0] : null;
}

/** INSERT/UPDATE/DELETE: devolve linhas afetadas, id inserido etc. */
export async function exec(sql: string, params?: SqlParam[]): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params || []);
  return result;
}

export function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "ER_DUP_ENTRY";
}

export async function closePool() {
  await pool.end();
}

export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
