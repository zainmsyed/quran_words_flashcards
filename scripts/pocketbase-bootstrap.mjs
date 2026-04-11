#!/usr/bin/env node
import { access, chmod, copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const GITHUB_REPO = 'pocketbase/pocketbase';
const DEFAULT_BINARY_NAME = process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';

function resolveBinaryName(platform = process.platform) {
  return platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
}

function normalizeVersion(version) {
  const trimmed = (version || '').trim();
  if (!trimmed || trimmed === 'latest') return 'latest';
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
}

function resolvePlatformSuffix(platform = process.platform, arch = process.arch) {
  const matrix = {
    linux: {
      x64: 'linux_amd64',
      arm64: 'linux_arm64',
    },
    darwin: {
      x64: 'darwin_amd64',
      arm64: 'darwin_arm64',
    },
    win32: {
      x64: 'windows_amd64',
      arm64: 'windows_arm64',
    },
  };

  const suffix = matrix[platform]?.[arch];
  if (!suffix) {
    throw new Error(`PocketBase downloads are not available for ${platform}/${arch}.`);
  }
  return suffix;
}

export function resolvePocketBaseBinaryPath({ repoRoot, pbBin } = {}) {
  const root = repoRoot ? path.resolve(repoRoot) : process.cwd();
  const rawPath = pbBin && pbBin.trim() ? path.resolve(pbBin.trim()) : path.resolve(root, DEFAULT_BINARY_NAME);

  if (process.platform === 'win32') {
    return rawPath.endsWith('.exe') ? rawPath : `${rawPath}.exe`;
  }

  return rawPath;
}

export function resolvePocketBaseAssetName({ version, platform = process.platform, arch = process.arch } = {}) {
  const tag = normalizeVersion(version);
  const suffix = resolvePlatformSuffix(platform, arch);
  const filenameVersion = tag.startsWith('v') ? tag.slice(1) : tag;
  return {
    tag,
    assetName: `pocketbase_${filenameVersion}_${suffix}.zip`,
    binaryName: resolveBinaryName(platform),
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchLatestTag() {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'quranic-flashcards-pocketbase-bootstrap',
    },
  });

  if (!response.ok) {
    throw new Error(`Could not read the latest PocketBase release from GitHub (${response.status} ${response.statusText}).`);
  }

  const payload = await response.json();
  if (typeof payload?.tag_name !== 'string' || !payload.tag_name.trim()) {
    throw new Error('PocketBase release metadata did not include a tag name.');
  }

  return payload.tag_name.trim();
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'quranic-flashcards-pocketbase-bootstrap',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download PocketBase from ${url} (${response.status} ${response.statusText}).`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
}

function runCommand(command, args, { cwd, env } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed${stderr ? `: ${stderr.trim()}` : ''}`));
      }
    });
  });
}

async function unzipArchive(zipPath, extractDir) {
  await runCommand('unzip', ['-oq', zipPath, '-d', extractDir]);
}

async function findFileRecursive(startDir, fileName) {
  const entries = await readdir(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const nested = await findFileRecursive(fullPath, fileName);
      if (nested) return nested;
    }
  }
  return null;
}

export async function ensurePocketBaseBinary({ repoRoot, pbBin, version, allowDownload = true } = {}) {
  const targetPath = resolvePocketBaseBinaryPath({ repoRoot, pbBin });
  if (await fileExists(targetPath)) {
    return targetPath;
  }

  if (!allowDownload) {
    throw new Error(`PocketBase binary not found at ${targetPath}.`);
  }

  let releaseTag = normalizeVersion(version);
  if (releaseTag === 'latest') {
    releaseTag = await fetchLatestTag();
  }

  const { assetName, binaryName } = resolvePocketBaseAssetName({
    version: releaseTag,
  });
  const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${releaseTag}/${assetName}`;

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'qfc-pocketbase-'));
  const zipPath = path.join(tempRoot, assetName);
  const extractDir = path.join(tempRoot, 'extract');

  try {
    console.log(`[dev] Downloading PocketBase ${releaseTag}…`);
    await mkdir(extractDir, { recursive: true });
    await downloadFile(downloadUrl, zipPath);
    await unzipArchive(zipPath, extractDir);

    const extractedBinary = await findFileRecursive(extractDir, binaryName);
    if (!extractedBinary) {
      throw new Error(`PocketBase archive did not contain ${binaryName}.`);
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(extractedBinary, targetPath);
    if (process.platform !== 'win32') {
      await chmod(targetPath, 0o755);
    }

    console.log(`[dev] PocketBase ready at ${targetPath}`);
    return targetPath;
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export async function bootstrapPocketBaseSuperuser({ repoRoot, pbBin, dataDir, email, password } = {}) {
  const binaryPath = resolvePocketBaseBinaryPath({ repoRoot, pbBin });
  if (!(await fileExists(binaryPath))) {
    throw new Error(`PocketBase binary not found at ${binaryPath}.`);
  }

  const adminEmail = String(email ?? '').trim();
  const adminPassword = String(password ?? '').trim();
  if (!adminEmail || !adminPassword) {
    throw new Error('PocketBase superuser bootstrap requires both an email and a password.');
  }

  const resolvedDataDir = dataDir ? path.resolve(dataDir) : path.resolve(process.cwd(), 'pb_data');
  await mkdir(resolvedDataDir, { recursive: true });

  console.log(`[dev] Ensuring PocketBase superuser ${adminEmail}…`);
  await runCommand(binaryPath, [
    'superuser',
    'upsert',
    adminEmail,
    adminPassword,
    '--dir',
    resolvedDataDir,
  ]);
}

export async function runPocketBaseMigrations({ repoRoot, pbBin, dataDir, env } = {}) {
  const binaryPath = resolvePocketBaseBinaryPath({ repoRoot, pbBin });
  if (!(await fileExists(binaryPath))) {
    throw new Error(`PocketBase binary not found at ${binaryPath}.`);
  }

  const resolvedDataDir = dataDir ? path.resolve(dataDir) : path.resolve(process.cwd(), 'pb_data');
  await mkdir(resolvedDataDir, { recursive: true });

  const resolvedMigrationsDir = repoRoot ? path.resolve(repoRoot, 'pb_migrations') : path.resolve(process.cwd(), 'pb_migrations');
  console.log('[dev] Applying PocketBase migrations…');
  await runCommand(binaryPath, [
    'migrate',
    'up',
    '--dir',
    resolvedDataDir,
    '--migrationsDir',
    resolvedMigrationsDir,
  ], {
    env,
  });
}
