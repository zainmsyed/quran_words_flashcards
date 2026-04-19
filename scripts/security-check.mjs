#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TEXT_FILE_MATCHERS = [
  /(^|\/)(?:Dockerfile|README(?:\.[^/]+)?|AGENTS\.md|package\.json|package-lock\.json|\.env\.example|\.gitignore|\.dockerignore)$/i,
  /(^|\/)\.github\/workflows\/.*\.ya?ml$/i,
  /(^|\/)pb_migrations\/.*\.js$/i,
  /(^|\/)scripts\/.*\.(?:mjs|js|py|sh)$/i,
  /(^|\/)src\/.*\.(?:ts|tsx|js|mjs|svelte|json|css|html)$/i,
  /(^|\/)docs\/.*\.(?:md|txt|ya?ml|json)$/i,
  /\.md$/i,
  /\.ya?ml$/i,
  /\.json$/i,
  /\.txt$/i,
  /\.svelte$/i,
  /\.css$/i,
  /\.html$/i,
  /\.ts$/i,
  /\.js$/i,
  /\.mjs$/i,
  /\.py$/i,
  /\.sh$/i,
];

const SKIP_PATH_PREFIXES = [
  'dist/',
  'node_modules/',
  'pb_data/',
  '.git/',
  'public/audio/',
];

const DIRECT_SECRET_PATTERNS = [
  { name: 'private-key-block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'github-token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: 'slack-token', regex: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'aws-access-key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'aws-session-key', regex: /ASIA[0-9A-Z]{16}/ },
  { name: 'google-api-key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'stripe-secret-key', regex: /sk_live_[0-9A-Za-z]{16,}/ },
  { name: 'stripe-publishable-key', regex: /pk_live_[0-9A-Za-z]{16,}/ },
  { name: 'generic-secret-assignment', regex: /\b(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|GITHUB_TOKEN|GH_TOKEN|SLACK_TOKEN|STRIPE_SECRET_KEY|PRIVATE_KEY|SECRET_KEY|API_KEY|ACCESS_TOKEN|ID_TOKEN|REFRESH_TOKEN|PASSWORD|PASSWD|PB_ADMIN_PASSWORD)\b\s*(?:=|:)\s*(.+)$/i },
  { name: 'bearer-token', regex: /Bearer\s+([A-Za-z0-9._-]{20,})/i, capture: 1 },
];

function shouldSkipPath(filePath) {
  return SKIP_PATH_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function isTextFile(filePath) {
  return TEXT_FILE_MATCHERS.some((matcher) => matcher.test(filePath));
}

function truncate(input, max = 140) {
  return input.length <= max ? input : `${input.slice(0, max - 1)}…`;
}

function normalizeValue(value) {
  return value.trim().replace(/^['"`]/, '').replace(/['"`]$/, '').trim();
}

function looksLikePlaceholder(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return [
    'changeme',
    'example',
    'placeholder',
    'sample',
    'demo',
    'dummy',
    'replace',
    'smoketest',
  ].some((fragment) => normalized.includes(fragment));
}

function extractDirectLiteral(remainder) {
  const trimmed = remainder.trim();
  if (!trimmed) return null;

  const first = trimmed[0];
  if (first === '"' || first === '\'' || first === '`') {
    const end = trimmed.indexOf(first, 1);
    if (end <= 0) return null;
    const value = trimmed.slice(1, end);
    const tail = trimmed.slice(end + 1).trim();
    if (tail && !/^[,;#}\]]/.test(tail)) return null;
    return value;
  }

  const bare = trimmed.match(/^([A-Za-z0-9_\/-]{12,})(?:\s*(?:[,;#}\]]|$))/);
  return bare?.[1] ?? null;
}

function looksLikeSecretValue(rawValue) {
  const value = normalizeValue(rawValue);
  if (!value || value.length < 12) return false;
  if (looksLikePlaceholder(value)) return false;

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((regex) => regex.test(value)).length;
  if (classes >= 3) return true;

  if (/^[A-Fa-f0-9]{24,}$/.test(value)) return true;
  if (/^[A-Za-z0-9+/=]{32,}$/.test(value) && /[A-Za-z]/.test(value) && /\d/.test(value)) return true;

  return false;
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function findSecretFindings(filePath, content) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    for (const pattern of DIRECT_SECRET_PATTERNS) {
      const match = line.match(pattern.regex);
      if (!match) continue;

      if (pattern.name === 'generic-secret-assignment') {
        const remainder = match[1] ?? '';
        if (/[().?]|process\.env|document\.|window\.|authSession|adminPassword|submittedPassword|currentPassword|nextPassword|sessionToken|token\s*:\s*|password\s*:\s*/i.test(remainder)) {
          continue;
        }

        const literal = extractDirectLiteral(remainder);
        if (!literal || !looksLikeSecretValue(literal)) continue;
      } else if (pattern.name === 'bearer-token') {
        const captured = match[pattern.capture ?? 0] ?? match[0];
        if (!looksLikeSecretValue(captured)) continue;
      }

      findings.push({
        filePath,
        lineNumber: lineIndex + 1,
        category: pattern.name,
        line: truncate(line.trim()),
      });
    }
  }

  // Catch obvious multi-line private key blocks even if the header line is split from the payload.
  const keyBlockRegex = /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g;
  for (const match of content.matchAll(keyBlockRegex)) {
    findings.push({
      filePath,
      lineNumber: lineNumberFor(content, match.index ?? 0),
      category: 'private-key-block',
      line: '-----BEGIN … PRIVATE KEY-----',
    });
  }

  return findings;
}

async function runNpmAuditGate() {
  process.stdout.write('[security-check] Running npm audit gate…\n');
  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const result = await execFileAsync('npm', ['audit', '--json', '--audit-level=high'], {
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
    stdout = result.stdout ?? '';
    stderr = result.stderr ?? '';
  } catch (error) {
    stdout = error.stdout ?? '';
    stderr = error.stderr ?? '';
    exitCode = typeof error.code === 'number' ? error.code : 1;
  }

  let report = null;
  try {
    report = stdout ? JSON.parse(stdout) : null;
  } catch (error) {
    throw new Error(`Unable to parse npm audit output: ${error instanceof Error ? error.message : String(error)}`);
  }

  const vulnerabilities = report?.metadata?.vulnerabilities ?? {};
  const high = Number(vulnerabilities.high ?? 0);
  const critical = Number(vulnerabilities.critical ?? 0);
  const moderate = Number(vulnerabilities.moderate ?? 0);

  if (high > 0 || critical > 0 || exitCode !== 0) {
    const lines = [
      `npm audit found ${high} high and ${critical} critical vulnerabilities.`,
      'Review `npm audit` output, update the affected packages, and regenerate the lockfile.',
    ];
    if (stderr.trim()) {
      lines.push(stderr.trim());
    }
    throw new Error(lines.join('\n'));
  }

  if (moderate > 0) {
    console.warn(`[security-check] npm audit reported ${moderate} moderate advisory/advisories. Gate passes because only high/critical findings fail this check.`);
  } else {
    console.log('[security-check] npm audit passed without high/critical findings.');
  }
}

async function runSecretScan() {
  process.stdout.write('[security-check] Scanning tracked text files for obvious secrets…\n');
  const { stdout } = await execFileAsync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    maxBuffer: 10 * 1024 * 1024,
  });

  const trackedFiles = stdout
    .split('\0')
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .filter((filePath) => !shouldSkipPath(filePath) && isTextFile(filePath));

  const findings = [];
  for (const filePath of trackedFiles) {
    const fullPath = path.resolve(repoRoot, filePath);
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      continue;
    }

    if (content.includes('\u0000')) continue;
    findings.push(...findSecretFindings(filePath, content));
  }

  if (findings.length > 0) {
    const lines = ['Potential secret leak(s) found:'];
    for (const finding of findings) {
      lines.push(`- ${finding.filePath}:${finding.lineNumber} [${finding.category}] ${finding.line}`);
    }
    throw new Error(lines.join('\n'));
  }

  console.log('[security-check] No obvious secret leaks found in tracked text files.');
}

async function main() {
  await runNpmAuditGate();
  await runSecretScan();
  console.log('[security-check] Security checks passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
