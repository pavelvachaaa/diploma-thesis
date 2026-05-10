import fs from 'node:fs';
import { BACKEND_PID_FILE, killProcessGroup } from './support/stack';

export default async function globalTeardown() {
  if (!fs.existsSync(BACKEND_PID_FILE)) return;

  const pid = Number(fs.readFileSync(BACKEND_PID_FILE, 'utf8').trim());
  killProcessGroup(pid);
  fs.rmSync(BACKEND_PID_FILE, { force: true });
}
