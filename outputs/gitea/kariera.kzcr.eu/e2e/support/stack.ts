import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const FRONTEND_DIR = process.cwd();
export const BACKEND_DIR = process.env.E2E_BACKEND_DIR || path.resolve(FRONTEND_DIR, '../hiring_backend');
export const RUNTIME_DIR = path.join(FRONTEND_DIR, '.e2e-runtime');
export const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 3323);
export const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || 3002);
export const E2E_DB_NAME = process.env.E2E_POSTGRES_DB || 'hrdb_e2e';
export const BACKEND_BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
export const FRONTEND_BASE_URL = `http://localhost:${FRONTEND_PORT}`;
export const BACKEND_PID_FILE = path.join(RUNTIME_DIR, 'backend.pid');
export const BACKEND_LOG_FILE = path.join(RUNTIME_DIR, 'backend.log');

export type EnvMap = Record<string, string>;

export function ensureRuntimeDir() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

export function parseDotEnv(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) return {};

  const env: EnvMap = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

export function backendEnv(overrides: EnvMap = {}): EnvMap {
  const envFromFiles = {
    ...parseDotEnv(path.join(BACKEND_DIR, '.env')),
    ...parseDotEnv(path.join(BACKEND_DIR, '.env.local')),
  };

  const rawEnv: Record<string, string | undefined> = {
    ...envFromFiles,
    ...process.env,
    NODE_ENV: 'test',
    APP_ENV: 'test',
    INTERNAL_PORT: String(BACKEND_PORT),
    PORT: String(BACKEND_PORT),
    POSTGRES_HOST: process.env.E2E_POSTGRES_HOST || 'localhost',
    POSTGRES_PORT: process.env.E2E_POSTGRES_PORT || envFromFiles.POSTGRES_PORT || '5432',
    POSTGRES_DB: E2E_DB_NAME,
    S3_ENDPOINT: process.env.E2E_S3_ENDPOINT || 'http://localhost:8444',
    PUBLIC_S3_BASE_URL: process.env.E2E_PUBLIC_S3_BASE_URL || 'http://localhost:8444',
    LOG_LEVEL: process.env.E2E_BACKEND_LOG_LEVEL || 'warn',
    LOG_QUERY: 'false',
    AUDIT_ENABLED: 'false',
    RABBITMQ_URL: '',
    RABBIT_CONSUMERS_REQUIRED: 'false',
    SIDE_EFFECT_OUTBOX_ENABLED: 'true',
    SIDE_EFFECT_OUTBOX_WORKER_ENABLED: 'true',
    SIDE_EFFECT_OUTBOX_POLL_INTERVAL_MS: '600000',
    COMMAND_IDEMPOTENCY_CLEANUP_INTERVAL_MS: '600000',
    ...overrides,
  };

  return Object.fromEntries(
    Object.entries(rawEnv).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

export function runChecked(command: string, args: string[], options: { cwd?: string; env?: EnvMap } = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function killProcessGroup(pid: number) {
  if (!Number.isFinite(pid) || pid <= 0) return;

  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      return;
    }
  }
}

export async function waitForUrl(url: string, timeoutMs: number, isReady: (response: Response) => Promise<boolean>) {
  const startedAt = Date.now();
  let lastError: unknown = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (await isReady(response)) {
        return;
      }
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
