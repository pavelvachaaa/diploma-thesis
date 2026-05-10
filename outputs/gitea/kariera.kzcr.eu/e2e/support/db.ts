import { Pool } from 'pg';
import path from 'node:path';
import { BACKEND_DIR, E2E_DB_NAME, parseDotEnv } from './stack';

const backendEnv = {
  ...parseDotEnv(path.join(BACKEND_DIR, '.env')),
  ...parseDotEnv(path.join(BACKEND_DIR, '.env.local')),
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: process.env.E2E_POSTGRES_USER || backendEnv.POSTGRES_USER || 'admin',
      password: process.env.E2E_POSTGRES_PASSWORD || backendEnv.POSTGRES_PASSWORD || 'pavel123',
      host: process.env.E2E_POSTGRES_HOST || 'localhost',
      port: Number(process.env.E2E_POSTGRES_PORT || backendEnv.POSTGRES_PORT || 5432),
      database: E2E_DB_NAME,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000,
    });
  }

  return pool;
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const result = await getPool().query(sql, params);
  return (result.rows[0] as T) ?? null;
}

export async function queryMany<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

export async function closeDb() {
  if (!pool) return;
  await pool.end();
  pool = null;
}
