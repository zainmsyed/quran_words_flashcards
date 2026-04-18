#!/usr/bin/env node
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectName = `qfc-coolify-smoke-${Date.now()}`;
const smokeEnv = {
  ...process.env,
  PB_ADMIN_EMAIL: process.env.PB_ADMIN_EMAIL?.trim() || 'smoke@example.com',
  PB_ADMIN_PASSWORD: process.env.PB_ADMIN_PASSWORD?.trim() || 'Smoke-Test-12345',
  PB_VERSION: process.env.PB_VERSION?.trim() || 'latest',
  POCKETBASE_BIND: process.env.POCKETBASE_BIND?.trim() || '0.0.0.0:8090',
  POCKETBASE_DATA_DIR: process.env.POCKETBASE_DATA_DIR?.trim() || '/pb/data',
  VITE_POCKETBASE_URL: process.env.VITE_POCKETBASE_URL?.trim() || '',
};

function runDocker(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', args, {
      cwd: repoRoot,
      env: smokeEnv,
      stdio: 'inherit',
    });

    proc.on('error', reject);
    proc.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const suffix = signal ? `signal ${signal}` : `code ${code ?? 0}`;
      reject(new Error(`docker ${args.join(' ')} failed with ${suffix}.`));
    });
  });
}

async function cleanup() {
  try {
    await runDocker(['compose', '-p', projectName, 'down', '-v', '--remove-orphans']);
  } catch (error) {
    console.warn(`[smoke] Cleanup warning: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log(`[smoke] Starting Coolify compose smoke project ${projectName}…`);
  await runDocker(['compose', '-p', projectName, 'up', '-d', '--build', '--wait', '--wait-timeout', '180']);

  try {
    await runDocker([
      'compose',
      '-p', projectName,
      'exec',
      '-T',
      'web',
      'sh',
      '-ec',
      'wget -qO- http://127.0.0.1/healthz >/dev/null && wget -qO- http://pocketbase:8090/api/health >/dev/null && wget -qO- http://127.0.0.1/api/health >/dev/null',
    ]);

    console.log('[smoke] Coolify compose smoke test passed.');
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
