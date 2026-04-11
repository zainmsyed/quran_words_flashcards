#!/usr/bin/env node
import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { bootstrapPocketBaseSuperuser, ensurePocketBaseBinary, runPocketBaseMigrations } from './pocketbase-bootstrap.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pocketBaseDataDir = path.resolve(repoRoot, 'pb_data');
const pocketBaseHttp = '127.0.0.1:8090';
const viteCli = path.resolve(repoRoot, 'node_modules/vite/bin/vite.js');
const vitePort = '5180';

let pocketBaseProc = null;
let viteProc = null;
let shuttingDown = false;

process.on('SIGINT', () => {
  void shutdown(0, 'SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown(0, 'SIGTERM');
});

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseEnvText(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separator = normalized.indexOf('=');
    if (separator === -1) continue;

    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
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

async function loadEnvFile(filePath) {
  if (!(await fileExists(filePath))) return {};
  return parseEnvText(await readFile(filePath, 'utf8'));
}

async function loadDevEnv() {
  const dotEnv = await loadEnvFile(path.resolve(repoRoot, '.env'));
  const dotEnvLocal = await loadEnvFile(path.resolve(repoRoot, '.env.local'));
  return {
    ...dotEnv,
    ...dotEnvLocal,
    ...process.env,
  };
}

async function waitForReady(url, timeoutMs = 30_000) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`received ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(250);
  }

  const detail = lastError instanceof Error ? ` (${lastError.message})` : '';
  throw new Error(`PocketBase did not become ready at ${url} within ${timeoutMs}ms${detail}`);
}

function streamWithPrefix(stream, prefix, target = process.stdout) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer) {
      target.write(`[${prefix}] ${buffer}\n`);
      buffer = '';
    }
  });
}

async function shutdown(exitCode = 0, reason = 'shutdown') {
  if (shuttingDown) return;
  shuttingDown = true;

  if (reason && reason !== 'shutdown') {
    console.log(`[dev] Stopping because ${reason}…`);
  }

  for (const proc of [viteProc, pocketBaseProc]) {
    if (proc && proc.exitCode === null) {
      proc.kill('SIGTERM');
    }
  }

  await sleep(750);

  for (const proc of [viteProc, pocketBaseProc]) {
    if (proc && proc.exitCode === null) {
      proc.kill('SIGKILL');
    }
  }

  process.exit(exitCode);
}

function handleUnexpectedExit(label, code, signal) {
  const suffix = signal ? `signal ${signal}` : `code ${code ?? 0}`;
  console.error(`[dev] ${label} exited unexpectedly with ${suffix}.`);
  void shutdown(code ?? 1, `${label} exit`);
}

async function main() {
  let devEnv = await loadDevEnv();
  const pocketBaseBin = await ensurePocketBaseBinary({
    repoRoot,
    pbBin: devEnv.PB_BIN,
    version: devEnv.PB_VERSION,
  });

  if (!(await fileExists(viteCli))) {
    throw new Error('Vite CLI not found. Run npm install before using npm run dev:full.');
  }

  await mkdir(pocketBaseDataDir, { recursive: true });
  const existingDb = await fileExists(path.join(pocketBaseDataDir, 'data.db'));
  if (!existingDb) {
    const adminEmail = String(devEnv.PB_ADMIN_EMAIL ?? '').trim() || 'admin@example.com';
    const adminPassword = String(devEnv.PB_ADMIN_PASSWORD ?? '').trim() || 'change-this-before-first-run';

    if (!String(devEnv.PB_ADMIN_EMAIL ?? '').trim() || !String(devEnv.PB_ADMIN_PASSWORD ?? '').trim()) {
      console.log('[dev] Using the default PocketBase bootstrap credentials from .env.example for this local first run.');
    }

    devEnv = {
      ...devEnv,
      PB_ADMIN_EMAIL: adminEmail,
      PB_ADMIN_PASSWORD: adminPassword,
    };

    await bootstrapPocketBaseSuperuser({
      repoRoot,
      pbBin: pocketBaseBin,
      dataDir: pocketBaseDataDir,
      email: adminEmail,
      password: adminPassword,
    });
  }

  await runPocketBaseMigrations({
    repoRoot,
    pbBin: pocketBaseBin,
    dataDir: pocketBaseDataDir,
    env: devEnv,
  });

  console.log('[dev] Starting PocketBase on http://127.0.0.1:8090…');
  pocketBaseProc = spawn(
    pocketBaseBin,
    ['serve', `--http=${pocketBaseHttp}`, `--dir=${pocketBaseDataDir}`],
    {
      cwd: repoRoot,
      env: devEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  streamWithPrefix(pocketBaseProc.stdout, 'pocketbase');
  streamWithPrefix(pocketBaseProc.stderr, 'pocketbase', process.stderr);

  pocketBaseProc.on('exit', (code, signal) => {
    if (!shuttingDown) {
      handleUnexpectedExit('PocketBase', code, signal);
    }
  });

  await waitForReady(`http://${pocketBaseHttp}/api/health`);
  console.log('[dev] PocketBase is ready. Starting Vite on http://127.0.0.1:5180…');

  viteProc = spawn(process.execPath, [viteCli, '--port', vitePort], {
    cwd: repoRoot,
    env: devEnv,
    stdio: 'inherit',
  });

  const viteExit = new Promise((resolve) => {
    viteProc.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });

  const { code, signal } = await viteExit;
  await shutdown(code ?? 0, signal ? `Vite ${signal}` : 'Vite exit');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  void shutdown(1, 'startup failure');
});
