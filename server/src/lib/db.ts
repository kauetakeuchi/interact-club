import mysql from "mysql2/promise";

function parseDbUrl(): { host: string; port: number; user: string; password: string; database: string } {
  const url = new URL(process.env.DATABASE_URL || "mysql://root:@localhost:3306/interact_club");
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

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params || []);
  return rows as T;
}

export async function getOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const [rows] = await pool.execute(sql, params || []);
  const arr = rows as any[];
  return arr.length > 0 ? arr[0] : null;
}

export async function exec(sql: string, params?: any[]): Promise<any> {
  const [result] = await pool.execute(sql, params || []);
  return result;
}

export function isDuplicateKeyError(err: unknown): boolean {
  return (err as any)?.code === "ER_DUP_ENTRY";
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
