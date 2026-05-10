import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  BACKEND_BASE_URL,
  BACKEND_DIR,
  BACKEND_LOG_FILE,
  BACKEND_PID_FILE,
  backendEnv,
  ensureRuntimeDir,
  isProcessAlive,
  killProcessGroup,
  runChecked,
  waitForUrl,
} from './support/stack';

function ensureDockerNetwork(name: string) {
  const result = spawn('docker', ['network', 'inspect', name], { stdio: 'ignore' });

  return new Promise<void>((resolve, reject) => {
    result.on('error', reject);
    result.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      try {
        runChecked('docker', ['network', 'create', name, '-d', 'bridge']);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function ensureBackendInfra() {
  await ensureDockerNetwork('app-network');
  runChecked('docker', ['compose', '-f', 'docker-compose.yml', 'up', '-d', 'db', 'seaweedfs'], {
    cwd: BACKEND_DIR,
  });
}

function killStaleBackend() {
  if (!fs.existsSync(BACKEND_PID_FILE)) return;

  const pid = Number(fs.readFileSync(BACKEND_PID_FILE, 'utf8').trim());
  if (isProcessAlive(pid)) {
    killProcessGroup(pid);
  }
  fs.rmSync(BACKEND_PID_FILE, { force: true });
}

async function resetE2eDatabase() {
  runChecked(process.execPath, ['scripts/e2e-kariera-db.js', 'reset'], {
    cwd: BACKEND_DIR,
    env: backendEnv(),
  });
}

async function startBackend() {
  killStaleBackend();

  const readyUrl = `${BACKEND_BASE_URL}/hrbackend/ready`;
  const logFd = fs.openSync(BACKEND_LOG_FILE, 'a');
  fs.appendFileSync(BACKEND_LOG_FILE, `\n--- E2E backend start ${new Date().toISOString()} ---\n`);

  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: BACKEND_DIR,
    env: backendEnv() as NodeJS.ProcessEnv,
    detached: true,
    stdio: ['ignore', logFd, logFd] as any,
  }) as ReturnType<typeof spawn>;

  child.unref();
  fs.writeFileSync(BACKEND_PID_FILE, String(child.pid));

  await waitForUrl(readyUrl, 90_000, async (response) => {
    if (!response.ok) return false;
    const body = await response.json().catch(() => null) as { ready?: boolean } | null;
    return body?.ready === true;
  }).catch((error) => {
    const logTail = fs.existsSync(BACKEND_LOG_FILE)
      ? fs.readFileSync(BACKEND_LOG_FILE, 'utf8').split(/\r?\n/).slice(-80).join('\n')
      : '';
    throw new Error(`${error.message}\n\nBackend log tail:\n${logTail}`);
  });
}

export default async function globalSetup() {
  ensureRuntimeDir();

  if (!fs.existsSync(path.join(BACKEND_DIR, 'package.json'))) {
    throw new Error(`Backend workspace not found at ${BACKEND_DIR}. Set E2E_BACKEND_DIR if it lives elsewhere.`);
  }

  await ensureBackendInfra();
  await resetE2eDatabase();
  await startBackend();
}
