#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { build, buildSync } from 'esbuild';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'qfc-tests-'));
const moduleCache = new Map();

async function importTs(relativePath) {
  const entry = path.resolve(repoRoot, relativePath);
  if (!moduleCache.has(entry)) {
    const result = buildSync({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      write: false,
      sourcemap: 'inline',
      logLevel: 'silent',
    });

    const outPath = path.join(
      tempRoot,
      `${moduleCache.size}-${path.basename(relativePath).replace(/\.[^.]+$/, '')}.mjs`,
    );
    writeFileSync(outPath, result.outputFiles[0].text);
    moduleCache.set(entry, outPath);
  }

  return import(`${pathToFileURL(moduleCache.get(entry)).href}?v=${Date.now()}-${Math.random()}`);
}

const svelteModuleCache = new Map();
let svelteCompilerPromise = null;
let sveltePreprocessPromise = null;

function aliasVariants(filePath) {
  const resolved = path.resolve(filePath);
  const stripped = resolved.replace(/\.[^.]+$/, '');
  return stripped === resolved ? [resolved] : [resolved, stripped];
}

function setGlobalProperty(name, value, previousValues) {
  previousValues.set(name, globalThis[name]);
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

async function withBrowserDom(fn) {
  const { parseHTML } = await import('linkedom');
  const { window } = parseHTML('<!doctype html><html><head></head><body><div id="app"></div></body></html>');
  const previousValues = new Map();
  setGlobalProperty('window', window, previousValues);
  setGlobalProperty('self', window, previousValues);
  setGlobalProperty('document', window.document, previousValues);

  const restoreNames = [
    'CustomEvent',
    'Event',
    'MouseEvent',
    'KeyboardEvent',
    'Node',
    'Element',
    'HTMLElement',
    'SVGElement',
    'Text',
    'Comment',
    'DocumentFragment',
    'navigator',
    'location',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'performance',
    'MutationObserver',
  ];

  for (const name of restoreNames) {
    if (typeof window[name] !== 'undefined') {
      setGlobalProperty(name, window[name], previousValues);
    }
  }

  if (typeof window.performance === 'undefined') {
    setGlobalProperty('performance', { now: () => Date.now() }, previousValues);
  }
  if (typeof window.getComputedStyle !== 'function') {
    setGlobalProperty('getComputedStyle', () => ({ getPropertyValue: () => '' }), previousValues);
  }
  if (typeof window.requestAnimationFrame !== 'function') {
    setGlobalProperty('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 0), previousValues);
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    setGlobalProperty('cancelAnimationFrame', (handle) => clearTimeout(handle), previousValues);
  }

  try {
    return await fn({ window, document: window.document });
  } finally {
    for (const [name, value] of previousValues.entries()) {
      if (typeof value === 'undefined') {
        delete globalThis[name];
      } else {
        Object.defineProperty(globalThis, name, {
          value,
          configurable: true,
          writable: true,
        });
      }
    }
  }
}

async function getSvelteCompiler() {
  if (!svelteCompilerPromise) {
    svelteCompilerPromise = import('svelte/compiler');
  }
  return svelteCompilerPromise;
}

async function getSveltePreprocessorFactory() {
  if (!sveltePreprocessPromise) {
    sveltePreprocessPromise = import('svelte-preprocess');
  }
  return sveltePreprocessPromise;
}

async function importSvelte(relativePath, aliases = {}) {
  const entry = path.resolve(repoRoot, relativePath);
  const aliasMap = new Map();
  for (const [source, target] of Object.entries(aliases)) {
    for (const variant of aliasVariants(source)) {
      aliasMap.set(path.resolve(variant), path.resolve(target));
    }
  }

  const cacheKey = `${entry}::${JSON.stringify([...aliasMap.entries()].sort(([a], [b]) => a.localeCompare(b)))}`;
  if (!svelteModuleCache.has(cacheKey)) {
    const workspace = mkdtempSync(path.join(tempRoot, 'svelte-'));

    const { compile, preprocess } = await getSvelteCompiler();
    const preprocessFactoryModule = await getSveltePreprocessorFactory();
    const createPreprocessor = preprocessFactoryModule.default ?? preprocessFactoryModule;
    const preprocessor = createPreprocessor({ typescript: true });

    const result = await build({
      absWorkingDir: repoRoot,
      entryPoints: [entry],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      target: 'es2020',
      nodePaths: [path.join(repoRoot, 'node_modules')],
      write: false,
      logLevel: 'silent',
      plugins: [{
        name: 'svelte-test-harness',
        setup(buildApi) {
          buildApi.onResolve({ filter: /.*/ }, (args) => {
            if (!(args.path.startsWith('.') || path.isAbsolute(args.path))) return null;
            const resolved = path.resolve(args.resolveDir, args.path);
            for (const candidate of aliasVariants(resolved)) {
              if (aliasMap.has(candidate)) {
                return { path: aliasMap.get(candidate) };
              }
            }
            return { path: resolved };
          });

          buildApi.onLoad({ filter: /\.svelte$/ }, async (args) => {
            const source = await readFile(args.path, 'utf8');
            const preprocessed = await preprocess(source, preprocessor, { filename: args.path });
            const compiled = compile(preprocessed.code, {
              filename: args.path,
              generate: 'dom',
              css: 'injected',
              dev: false,
            });

            return {
              contents: compiled.js.code,
              loader: 'js',
              resolveDir: path.dirname(args.path),
            };
          });
        },
      }],
    });

    const outPath = path.join(workspace, `${svelteModuleCache.size}-${path.basename(relativePath).replace(/\.[^.]+$/, '')}.mjs`);
    writeFileSync(outPath, result.outputFiles[0].text);
    svelteModuleCache.set(cacheKey, outPath);
  }

  return import(`${pathToFileURL(svelteModuleCache.get(cacheKey)).href}?v=${Date.now()}-${Math.random()}`);
}

function writeWorkspaceFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  return filePath;
}

function makeAudioReviewWorkspace(root, reviewIds = ['w100', 'w12']) {
  const seedWords = [
    { id: 'w12', arabic: 'لِ', transliteration: 'li', english: 'For/to' },
    { id: 'w35', arabic: 'جَعَلَ', transliteration: 'jaʿala', english: 'He made' },
    { id: 'w100', arabic: 'الدُّنْيَا', transliteration: 'al-dunyā', english: 'The world' },
  ];

  writeWorkspaceFile(root, 'src/data/seed-words.json', JSON.stringify(seedWords, null, 2));

  const reviewRows = reviewIds.map((id) => {
    const word = seedWords.find((entry) => entry.id === id) || { id, arabic: '', transliteration: '', english: '' };
    return `| ${word.id} | ${word.arabic} | ${word.transliteration} | /audio/${word.id}.mp3 | still wrong after listening | regenerate gTTS and listen again | you | 2026-04-20 |`;
  }).join('\n\n');

  writeWorkspaceFile(root, '.context/reviews/mispronunciations.md', `# Mispronunciations / audio issues (running list)\n\nThis file is a running checklist of seed words whose bundled audio sounds incorrect or unnatural.\n\n| id | arabic | transliteration | audio | issue | suggested fix | reporter | date |\n|---|---:|---|---|---|---|---|---|\n${reviewRows}\n`);
  return seedWords;
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForServer(port, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/_health`);
      if (res.ok) return;
    } catch (err) {
      // retry until the process is ready
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for preview server on port ${port}`);
}

async function startPreviewServer(workspace) {
  const port = await getFreePort();
  const proc = spawn(process.execPath, [path.resolve(repoRoot, 'scripts/preview_flag_server.mjs')], {
    cwd: workspace,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });
  proc.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  await waitForServer(port);
  return { proc, port, stdout: () => stdout, stderr: () => stderr };
}

async function stopPreviewServer(proc) {
  if (!proc || proc.exitCode !== null || proc.killed) return;
  proc.kill();
  await new Promise((resolve) => proc.once('close', resolve));
}

async function waitForFileContains(filePath, needle, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const content = await readFile(filePath, 'utf8');
      if (content.includes(needle)) return content;
    } catch (err) {
      // keep waiting until the file exists and contains the expected text
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${needle} in ${filePath}`);
}

async function waitForFileMatchCount(filePath, pattern, expectedCount, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const content = await readFile(filePath, 'utf8');
      const matches = content.match(pattern) || [];
      if (matches.length === expectedCount) return content;
    } catch (err) {
      // keep waiting until the file exists and contains the expected number of rows
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${expectedCount} match(es) of ${pattern} in ${filePath}`);
}

async function flushSvelte() {
  const { tick } = await import('svelte');
  await tick();
  await Promise.resolve();
  await tick();
}

async function waitForSelector(document, selector, timeoutMs = 3000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const element = document.querySelector(selector);
    if (element) return element;
    await flushSvelte();
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

function writeSessionIssueAuthStub(root, stateKey) {
  return writeWorkspaceFile(root, 'app-auth-stub.ts', `
    const state = globalThis[${JSON.stringify(stateKey)}] ??= {
      initializeAuthCalls: 0,
      signOutCalls: 0,
      signInCalls: 0,
    };

    export class PocketBaseAuthError extends Error {
      code;

      constructor(code, message) {
        super(message);
        this.name = 'PocketBaseAuthError';
        this.code = code;
      }
    }

    export async function initializeAuth() {
      state.initializeAuthCalls += 1;
      return {
        status: 'authenticated',
        session: {
          token: 'session-token',
          user: {
            id: 'user-1',
            email: 'user@example.com',
          },
        },
      };
    }

    export async function signInWithPassword(email) {
      state.signInCalls += 1;
      return {
        token: 'session-token',
        user: {
          id: 'user-1',
          email,
        },
      };
    }

    export async function signOut() {
      state.signOutCalls += 1;
    }

    export function describePocketBaseError(error, messages) {
      if (error instanceof PocketBaseAuthError) {
        return messages[error.code] ?? messages.fallback;
      }

      return messages.fallback;
    }
  `);
}

function writeSessionIssueTtsStub(root, stateKey) {
  return writeWorkspaceFile(root, 'tts-stub.ts', `
    const state = globalThis[${JSON.stringify(stateKey)}] ??= {
      stopCalls: 0,
    };

    export function stop() {
      state.stopCalls += 1;
    }
  `);
}

function writeStudySessionDispatchStub(root) {
  return writeWorkspaceFile(root, 'StudySession.stub.svelte', `
    <script lang="ts">
      import { createEventDispatcher } from 'svelte';

      export let authSession: { token?: string } | null = null;

      const dispatch = createEventDispatcher<{
        openSettings: undefined;
        sessionissue: {
          code: 'unauthorized' | 'unavailable';
          message: string;
        };
      }>();

      function openSettings() {
        dispatch('openSettings');
      }

      function issueUnauthorized() {
        dispatch('sessionissue', {
          code: 'unauthorized',
          message: 'Your session expired. Please sign in again.',
        });
      }
    </script>

    <div data-testid="study-stub">
      <span data-testid="study-token">{authSession?.token || 'none'}</span>
      <button type="button" data-testid="study-open-settings" on:click={openSettings}>Open settings</button>
      <button type="button" data-testid="study-unauthorized" on:click={issueUnauthorized}>Expire session</button>
    </div>
  `);
}

function writeSettingsDispatchStub(root) {
  return writeWorkspaceFile(root, 'Settings.stub.svelte', `
    <script lang="ts">
      import { createEventDispatcher } from 'svelte';

      export let authSession: { token?: string } | null = null;
      export let userEmail: string | null = null;
      export let signOutBusy = false;

      const dispatch = createEventDispatcher<{
        close: undefined;
        logout: undefined;
        sessionchange: { token: string; user: { id: string; email: string } };
        sessionissue: {
          code: 'unauthorized' | 'unavailable';
          message: string;
        };
      }>();

      function issueUnavailable() {
        dispatch('sessionissue', {
          code: 'unavailable',
          message: 'PocketBase could not be reached.',
        });
      }
    </script>

    <div data-testid="settings-stub">
      <span data-testid="settings-token">{authSession?.token || 'none'}</span>
      <span data-testid="settings-user">{userEmail || 'unknown'}</span>
      <button type="button" data-testid="settings-unavailable" on:click={issueUnavailable}>Report unavailable</button>
      <button type="button" data-testid="settings-signout-busy" disabled={signOutBusy}>busy</button>
    </div>
  `);
}

function writeAccountSettingsAuthStub(root, stateKey) {
  return writeWorkspaceFile(root, 'account-auth-stub.ts', `
    const state = globalThis[${JSON.stringify(stateKey)}] ??= {
      changePasswordCalls: 0,
      lastChangePasswordArgs: null,
    };

    export class PocketBaseAuthError extends Error {
      code;

      constructor(code, message) {
        super(message);
        this.name = 'PocketBaseAuthError';
        this.code = code;
      }
    }

    export async function changePassword(session, currentPassword, nextPassword) {
      state.changePasswordCalls += 1;
      state.lastChangePasswordArgs = {
        session,
        currentPassword,
        nextPassword,
      };
      throw new PocketBaseAuthError('unauthorized', 'PocketBase session expired.');
    }

    export function describePocketBaseError(error, messages) {
      if (error instanceof PocketBaseAuthError) {
        return messages[error.code] ?? messages.fallback;
      }

      return messages.fallback;
    }
  `);
}

function writeChangePasswordFormDispatchStub(root) {
  return writeWorkspaceFile(root, 'ChangePasswordForm.stub.svelte', `
    <script lang="ts">
      import { createEventDispatcher } from 'svelte';

      export let busy = false;
      export let error = '';
      export let success = '';

      const dispatch = createEventDispatcher<{
        submit: {
          currentPassword: string;
          nextPassword: string;
          confirmPassword: string;
        };
      }>();

      function emitSubmit() {
        dispatch('submit', {
          currentPassword: 'current-password',
          nextPassword: 'new-password',
          confirmPassword: 'new-password',
        });
      }
    </script>

    <div data-testid="change-password-stub">
      <span data-testid="change-password-busy">{busy ? 'busy' : 'idle'}</span>
      <span data-testid="change-password-error">{error}</span>
      <span data-testid="change-password-success">{success}</span>
      <button type="button" data-testid="change-password-submit" on:click={emitSubmit}>Update password</button>
    </div>
  `);
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function makeWord(id) {
  return { id, arabic: id, english: id, transliteration: id };
}

function makeCardState(id, overrides = {}) {
  return {
    id,
    interval: 0,
    ease: 2.5,
    dueDate: new Date('2026-04-09T12:00:00.000Z').toISOString(),
    reviewCount: 0,
    hardCount: 0,
    gotCount: 0,
    easyCount: 0,
    ...overrides,
  };
}

function makeMixedSessionDeck({ newCount, dueCount }) {
  const words = [];
  const states = {};

  for (let i = 1; i <= newCount; i += 1) {
    const id = `n${i}`;
    words.push(makeWord(id));
    states[id] = makeCardState(id);
  }

  for (let i = 1; i <= dueCount; i += 1) {
    const id = `r${i}`;
    words.push(makeWord(id));
    states[id] = makeCardState(id, {
      interval: 1,
      dueDate: new Date(Date.UTC(2026, 0, i, 9, 0, 0)).toISOString(),
      reviewCount: 1,
    });
  }

  return { words, states };
}

function makeLocalStorageMock({ initial = {}, failSet = false, failRemove = false } = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    storage: {
      getItem(key) {
        return entries.has(key) ? entries.get(key) : null;
      },
      setItem(key, value) {
        if (failSet) {
          throw new Error('blocked write');
        }
        entries.set(key, String(value));
      },
      removeItem(key) {
        if (failRemove) {
          throw new Error('blocked remove');
        }
        entries.delete(key);
      },
    },
  };
}


test('summarizeStudyProgress counts seen words, reviews, mastery, and due cards', async () => {
  const { summarizeStudyProgress } = await importTs('src/core/progress-summary.ts');

  const words = [makeWord('w1'), makeWord('w2'), makeWord('w3'), makeWord('w4')];
  const states = {
    w1: makeCardState('w1'),
    w2: makeCardState('w2', {
      interval: 1,
      dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(),
      reviewCount: 2,
      easyCount: 1,
    }),
    w3: makeCardState('w3', {
      interval: 4,
      dueDate: new Date('2026-04-10T09:00:00.000Z').toISOString(),
      reviewCount: 5,
      easyCount: 3,
    }),
    w4: makeCardState('w4', {
      interval: 0.25,
      dueDate: new Date('2026-04-09T09:00:00.000Z').toISOString(),
      reviewCount: 1,
      easyCount: 1,
    }),
  };

  const summary = summarizeStudyProgress(words, states, new Date('2026-04-09T12:00:00.000Z'));
  assert.equal(summary.seenWords, 3);
  assert.equal(summary.reviewCount, 8);
  assert.equal(summary.easyCount, 5);
  assert.equal(summary.masteredCount, 1);
  assert.equal(summary.dueCount, 2);
});

test('all words mastered are detected when easyCount >= MASTERED_EASY_COUNT', async () => {
  const { summarizeStudyProgress, MASTERED_EASY_COUNT } = await importTs('src/core/progress-summary.ts');

  const words = [makeWord('mw1'), makeWord('mw2'), makeWord('mw3')];
  const states = {
    mw1: makeCardState('mw1', { reviewCount: 3, easyCount: MASTERED_EASY_COUNT }),
    mw2: makeCardState('mw2', { reviewCount: 2, easyCount: MASTERED_EASY_COUNT + 1 }),
    mw3: makeCardState('mw3', { reviewCount: 1, easyCount: MASTERED_EASY_COUNT }),
  };

  const summary = summarizeStudyProgress(words, states, new Date('2026-04-09T12:00:00.000Z'));
  assert.equal(summary.masteredCount, 3);
});


test('shared study-card helpers keep mastered overdue cards out of due lists', async () => {
  const { MASTERED_EASY_COUNT, isDueCardState, isMasteredCardState } = await importTs('src/core/progress-summary.ts');

  const now = new Date('2026-04-09T12:00:00.000Z');
  const masteredOverdue = makeCardState('m1', {
    interval: 2,
    dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(),
    easyCount: MASTERED_EASY_COUNT,
    reviewCount: 5,
  });
  const learningOverdue = makeCardState('l1', {
    interval: 2,
    dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(),
    easyCount: MASTERED_EASY_COUNT - 1,
    reviewCount: 5,
  });

  assert.equal(isMasteredCardState(masteredOverdue), true);
  assert.equal(isDueCardState(masteredOverdue, now), false);
  assert.equal(isMasteredCardState(learningOverdue), false);
  assert.equal(isDueCardState(learningOverdue, now), true);
});

test('applyRatingToCard advances interval and counters', async () => {
  const { initialCardState, applyRatingToCard } = await importTs('src/core/srs.ts');

  const start = initialCardState('w1');
  const hard = applyRatingToCard(start, 'hard');
  assert.equal(hard.interval, 0.25);
  assert.equal(hard.reviewCount, 1);
  assert.equal(hard.hardCount, 1);
  assert.equal(hard.lastRating, 'hard');

  const easy = applyRatingToCard(hard, 'easy');
  assert.ok(easy.interval >= 3);
  assert.equal(easy.reviewCount, 2);
  assert.equal(easy.easyCount, 1);
  assert.equal(easy.lastRating, 'easy');
});

test('recordStudy tracks streak rollover and easy counts', async () => {
  const { initialAppStats, recordStudy } = await importTs('src/core/app-stats.ts');

  const first = recordStudy(initialAppStats(), 'easy', new Date('2026-04-09T10:00:00.000Z'));
  assert.equal(first.streak, 1);
  assert.equal(first.studied, 1);
  assert.equal(first.easy, 1);

  const sameDay = recordStudy(first, 'got', new Date('2026-04-09T18:00:00.000Z'));
  assert.equal(sameDay.streak, 1);
  assert.equal(sameDay.studied, 2);
  assert.equal(sameDay.easy, 1);

  const nextDay = recordStudy(sameDay, 'hard', new Date('2026-04-10T08:00:00.000Z'));
  assert.equal(nextDay.streak, 2);
  assert.equal(nextDay.studied, 3);

  const afterGap = recordStudy(nextDay, 'hard', new Date('2026-04-12T08:00:00.000Z'));
  assert.equal(afterGap.streak, 1);
});

test('buildSessionPlan randomizes card mode and preserves saved session mode', async () => {
  const { buildSessionPlan, isSameLocalDay } = await importTs('src/core/session.ts');

  const words = [makeWord('w1'), makeWord('w2'), makeWord('w3'), makeWord('w4')];
  const states = {
    w1: makeCardState('w1', {
      interval: 1,
      dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(),
      reviewCount: 1,
    }),
    w2: makeCardState('w2'),
    w3: makeCardState('w3', {
      interval: 2,
      dueDate: new Date('2026-04-07T09:00:00.000Z').toISOString(),
      reviewCount: 2,
    }),
    w4: makeCardState('w4'),
  };

  const sequence = [0.1, 0.9, 0.2, 0.8];
  const plan = buildSessionPlan(words, states, undefined, {
    limits: { reviewPerSession: 2, newPerSession: 2 },
    now: new Date('2026-04-09T12:00:00.000Z'),
    random: () => sequence.shift() ?? 0.1,
  });

  assert.equal(plan.currentIndex, 0);
  assert.equal(plan.newCount, 2);
  assert.equal(plan.reviewCount, 2);

  // Verify the queue contains the expected items (reviews: w3, w1 oldest-first selected; new: w2, w4)
  const ids = plan.queue.map((item) => item.id);
  assert.equal(ids.length, 4);
  // expected review ids (oldest due first)
  const expectedReviews = ['w3', 'w1'];
  for (const rid of expectedReviews) {
    assert.ok(ids.includes(rid), `expected review ${rid} to be present`);
  }
  const expectedNew = ['w2', 'w4'];
  for (const nid of expectedNew) {
    assert.ok(ids.includes(nid), `expected new ${nid} to be present`);
  }

  // Modes should be assigned and valid
  const modes = plan.queue.map((item) => item.mode);
  assert.equal(modes.length, 4);
  modes.forEach((m) => assert.ok(m === 'ar2en' || m === 'en2ar'));

  const savedPlan = buildSessionPlan(words, states, {
    queue: [
      { id: 'w2', mode: 'en2ar' },
      { id: 'missing', mode: 'ar2en' },
      { id: 'w3', mode: 'ar2en' },
    ],
    index: 5,
    createdAt: new Date('2026-04-09T12:00:00.000Z').toISOString(),
  }, {
    random: () => 0.1,
  });

  assert.equal(savedPlan.currentIndex, 2);
  assert.equal(savedPlan.newCount, 1);
  assert.equal(savedPlan.reviewCount, 1);
  assert.deepEqual(savedPlan.queue.map((item) => item.id), ['w2', 'w3']);
  assert.deepEqual(savedPlan.queue.map((item) => item.mode), ['en2ar', 'ar2en']);
  assert.equal(isSameLocalDay(new Date(2026, 3, 9, 9, 0, 0).toISOString(), new Date(2026, 3, 9, 18, 0, 0)), true);
  assert.equal(isSameLocalDay(new Date(2026, 3, 10, 9, 0, 0).toISOString(), new Date(2026, 3, 9, 18, 0, 0)), false);
});


test('buildSessionPlan fills remaining session capacity with the oldest due reviews across quota bands', async () => {
  const { buildSessionPlan } = await importTs('src/core/session.ts');

  const now = new Date('2026-04-09T12:00:00.000Z');
  const assertQuota = ({ newCount, dueCount, expectedNew, expectedReview }) => {
    const { words, states } = makeMixedSessionDeck({ newCount, dueCount });
    const plan = buildSessionPlan(words, states, undefined, {
      limits: { newPerSession: 10, reviewPerSession: 5 },
      now,
      random: () => 0.1,
    });

    assert.equal(plan.newCount, expectedNew, `expected ${expectedNew} new cards when ${newCount} new / ${dueCount} due exist`);
    assert.equal(plan.reviewCount, expectedReview, `expected ${expectedReview} review cards when ${newCount} new / ${dueCount} due exist`);
    assert.equal(plan.queue.length, expectedNew + expectedReview, 'queue length should match selected totals');
    assert.ok(plan.queue.length <= 15, 'queue should never exceed the 15-card session cap');

    const ids = plan.queue.map((item) => item.id);
    for (let i = 1; i <= expectedReview; i += 1) {
      assert.ok(ids.includes(`r${i}`), `expected oldest due review r${i} to be selected`);
    }
    if (dueCount > expectedReview) {
      assert.ok(!ids.includes(`r${expectedReview + 1}`), 'newer due reviews should be excluded once the quota is full');
    }
  };

  assertQuota({ newCount: 0, dueCount: 20, expectedNew: 0, expectedReview: 15 });
  assertQuota({ newCount: 4, dueCount: 20, expectedNew: 4, expectedReview: 11 });
  assertQuota({ newCount: 7, dueCount: 20, expectedNew: 7, expectedReview: 8 });
  assertQuota({ newCount: 10, dueCount: 20, expectedNew: 10, expectedReview: 5 });
  assertQuota({ newCount: 12, dueCount: 20, expectedNew: 10, expectedReview: 5 });

  const noReviewDeck = makeMixedSessionDeck({ newCount: 12, dueCount: 0 });
  const noReviewPlan = buildSessionPlan(noReviewDeck.words, noReviewDeck.states, undefined, {
    limits: { newPerSession: 10, reviewPerSession: 5 },
    now,
    random: () => 0.1,
  });
  assert.equal(noReviewPlan.newCount, 10);
  assert.equal(noReviewPlan.reviewCount, 0);
  assert.equal(noReviewPlan.queue.length, 10, 'sessions without due reviews should cap at 10 new cards');
});

test('pocketbase auth helpers normalize urls and parse sessions safely', async () => {
  const {
    trimTrailingSlash,
    parseAuthSession,
    sessionFromAuthResponse,
  } = await importTs('src/core/pocketbase-auth.ts');

  assert.equal(trimTrailingSlash('http://127.0.0.1:8090/'), 'http://127.0.0.1:8090');
  assert.equal(trimTrailingSlash('https://example.com///'), 'https://example.com');

  assert.deepEqual(parseAuthSession({
    token: 'token-123',
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  }), {
    token: 'token-123',
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  });

  assert.equal(parseAuthSession({ token: 'missing-user' }), null);

  assert.deepEqual(sessionFromAuthResponse({
    token: 'token-456',
    record: {
      id: 'user-2',
      email: 'friend@example.com',
    },
  }), {
    token: 'token-456',
    user: {
      id: 'user-2',
      email: 'friend@example.com',
    },
  });

});

test('storage adapter clears stale data when writes fail and tombstones removals when deletes fail', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalWarn = console.warn;
  const writeFailure = makeLocalStorageMock({
    initial: {
      qfc2_pb_auth: JSON.stringify({ token: 'old-token', user: { id: 'user-old', email: 'old@example.com' } }),
    },
    failSet: true,
  });
  const parseFailure = makeLocalStorageMock({
    initial: {
      qfc2_pb_auth: '{not-json',
    },
  });
  const removeFailure = makeLocalStorageMock({
    initial: {
      qfc2_pb_auth: JSON.stringify({ token: 'old-token', user: { id: 'user-old', email: 'old@example.com' } }),
    },
    failRemove: true,
  });

  console.warn = () => {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: writeFailure.storage,
    configurable: true,
    writable: true,
  });

  try {
    const { browserStorage } = await importTs('src/core/storage-adapter.ts');

    await browserStorage.setItem('qfc2_pb_auth', {
      token: 'fresh-token',
      user: { id: 'user-new', email: 'new@example.com' },
    });
    assert.equal(writeFailure.entries.has('qfc2_pb_auth'), false);

    Object.defineProperty(globalThis, 'localStorage', {
      value: parseFailure.storage,
      configurable: true,
      writable: true,
    });

    assert.equal(await browserStorage.getItem('qfc2_pb_auth'), null);
    assert.equal(parseFailure.entries.has('qfc2_pb_auth'), false);

    Object.defineProperty(globalThis, 'localStorage', {
      value: removeFailure.storage,
      configurable: true,
      writable: true,
    });

    await browserStorage.removeItem('qfc2_pb_auth');
    assert.equal(removeFailure.entries.get('qfc2_pb_auth'), 'null');
  } finally {
    console.warn = originalWarn;
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('initializeAuth clears malformed stored sessions before refreshing', async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = makeLocalStorageMock({
    initial: {
      qfc2_pb_auth: JSON.stringify({
        token: 'token-1',
        user: {
          id: 'user-1',
        },
      }),
    },
  });
  let refreshCalled = false;

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage.storage,
    configurable: true,
    writable: true,
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/health')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 'ok' }),
      };
    }

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      refreshCalled = true;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          token: 'token-2',
          record: {
            id: 'user-1',
            email: 'user@example.com',
          },
        }),
      };
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { initializeAuth } = await importTs('src/core/pocketbase-auth.ts');
    const result = await initializeAuth();

    assert.deepEqual(result, { status: 'signed-out' });
    assert.equal(refreshCalled, false);
    assert.equal(storage.entries.has('qfc2_pb_auth'), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('initializeAuth clears stored sessions when refresh is unauthorized', async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = makeLocalStorageMock({
    initial: {
      qfc2_pb_auth: JSON.stringify({
        token: 'token-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      }),
    },
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage.storage,
    configurable: true,
    writable: true,
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/health')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 'ok' }),
      };
    }

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return {
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Session expired' }),
      };
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { initializeAuth } = await importTs('src/core/pocketbase-auth.ts');
    const result = await initializeAuth();

    assert.deepEqual(result, { status: 'signed-out' });
    assert.equal(storage.entries.has('qfc2_pb_auth'), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('describePocketBaseError hides backend details while preserving migration guidance', async () => {
  const { PocketBaseAuthError, describePocketBaseError } = await importTs('src/core/pocketbase-auth.ts');

  const messages = {
    fallback: 'Could not sign in. Please try again.',
    'invalid-credentials': 'Invalid email or password.',
    unauthorized: 'Your session expired. Please sign in again.',
    unavailable: 'PocketBase could not be reached.',
  };

  assert.equal(
    describePocketBaseError(new PocketBaseAuthError('invalid-credentials', 'database user lookup failed'), messages),
    'Invalid email or password.',
  );
  assert.equal(
    describePocketBaseError(new PocketBaseAuthError('unauthorized', 'token leak here'), messages),
    'Your session expired. Please sign in again.',
  );
  assert.equal(
    describePocketBaseError(new PocketBaseAuthError('unavailable', 'database timeout'), messages),
    'PocketBase could not be reached.',
  );
  assert.equal(
    describePocketBaseError(
      new PocketBaseAuthError('unavailable', 'PocketBase collection "study_state" is missing. Run the PocketBase migrations and reload.'),
      messages,
    ),
    'PocketBase collection "study_state" is missing. Run the PocketBase migrations and reload.',
  );
});

test('tts support helpers distinguish speech and bundled audio availability', async () => {
  const originalWindow = globalThis.window;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    value: {},
    configurable: true,
    writable: true,
  });

  try {
    const { isSpeechSupported, canPronounceWord } = await importTs('src/core/tts-adapter.ts');

    assert.equal(isSpeechSupported(), false);
    assert.equal(canPronounceWord('w1'), true);
    assert.equal(canPronounceWord('w42'), false);
    assert.equal(canPronounceWord('w59'), false);

    Object.defineProperty(globalThis, 'window', {
      value: {
        speechSynthesis: { speak() {} },
        SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
      },
      configurable: true,
      writable: true,
    });

    assert.equal(isSpeechSupported(), true);
    assert.equal(canPronounceWord('w42'), true);
    assert.equal(canPronounceWord('w58'), true);
    assert.equal(canPronounceWord('w59'), false);
  } finally {
    if (!hadWindow) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('tts manifest loader populates bundled audio set', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    value: {},
    configurable: true,
    writable: true,
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/audio/manifest.json')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          generated_at: '2026-04-16T00:00:00Z',
          provider: 'none',
          voice: 'ar-XA-Neural-B',
          sample_rate: 24000,
          entries: [
            { id: 'w58', filename: 'w58.mp3', bytes: 1234, exists: true },
            { id: 'w59', filename: 'w59.mp3', bytes: 1234, exists: true },
            { id: 'w200', filename: 'w200.mp3', bytes: 1234, exists: true },
            { id: 'w201', filename: 'w201.mp3', bytes: 1234, exists: true },
          ],
        }),
      };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { hasBundledAudioForWordId, loadBundledAudioManifest, canPronounceWord } = await importTs('src/core/tts-adapter.ts');

    // defaults contain w1..w10
    assert.equal(hasBundledAudioForWordId('w1'), true);
    assert.equal(hasBundledAudioForWordId('w200'), false);
    assert.equal(hasBundledAudioForWordId('w58'), false);
    assert.equal(hasBundledAudioForWordId('w59'), false);

    await loadBundledAudioManifest();

    // after manifest load the new ids should be present, but blocked ids stay unavailable
    assert.equal(hasBundledAudioForWordId('w200'), true);
    assert.equal(hasBundledAudioForWordId('w58'), true);
    assert.equal(hasBundledAudioForWordId('w59'), false);
    assert.equal(canPronounceWord('w58'), true);
    assert.equal(canPronounceWord('w59'), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (!hadWindow) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  }
});


test('tts manifest loader retries after a failed response', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    value: {},
    configurable: true,
    writable: true,
  });

  let fetchCalls = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (!url.endsWith('/audio/manifest.json')) {
      throw new Error(`Unexpected fetch: ${url}`);
    }

    fetchCalls += 1;
    if (fetchCalls === 1) {
      return {
        ok: false,
        status: 503,
        json: async () => ({}),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        entries: [
          { id: 'w200', filename: 'w200.mp3', bytes: 1234, exists: true },
        ],
      }),
    };
  };

  try {
    const { hasBundledAudioForWordId, loadBundledAudioManifest } = await importTs('src/core/tts-adapter.ts');

    assert.equal(hasBundledAudioForWordId('w200'), false);

    await loadBundledAudioManifest();
    assert.equal(fetchCalls, 1, 'first manifest request should be attempted once');
    assert.equal(hasBundledAudioForWordId('w200'), false, 'failed load should keep defaults');

    await loadBundledAudioManifest();
    assert.equal(fetchCalls, 2, 'a later call should retry the manifest fetch');
    assert.equal(hasBundledAudioForWordId('w200'), true, 'successful retry should update bundled audio coverage');
  } finally {
    globalThis.fetch = originalFetch;
    if (!hadWindow) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  }
});


test('speak uses bundled audio when playback succeeds and avoids SpeechSynthesis', async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  let speechCalled = false;
  Object.defineProperty(globalThis, 'window', {
    value: {
      speechSynthesis: { speak: (u) => { speechCalled = true; if (typeof u.onend === 'function') setTimeout(u.onend, 0); } },
      SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
    },
    configurable: true,
    writable: true,
  });

  globalThis.Audio = function (src) {
    this._listeners = {};
    this.src = src;
    this.preload = '';
    this.addEventListener = (name, h) => { this._listeners[name] = this._listeners[name] || []; this._listeners[name].push(h); };
    this.removeEventListener = (name, h) => { if (!this._listeners[name]) return; this._listeners[name] = this._listeners[name].filter(x => x !== h); };
    this.play = () => {
      // simulate async playback completion
      setTimeout(() => {
        const handlers = this._listeners['ended'] || [];
        handlers.forEach((fn) => fn());
      }, 0);
      return Promise.resolve();
    };
    this.pause = () => {};
    this.currentTime = 0;
  };

  try {
    const { speak } = await importTs('src/core/tts-adapter.ts');
    await speak('مِنْ', { audioSources: ['/audio/w1.mp3'] });
    // ensure speech synthesis was not invoked
    assert.equal(speechCalled, false);
  } finally {
    if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio;
    if (!hadWindow) delete globalThis.window; else Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
  }
});


test('speak suppresses blocked bundled audio sources', async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  let speechCalled = false;
  let audioConstructed = false;
  Object.defineProperty(globalThis, 'window', {
    value: {
      speechSynthesis: { speak: (u) => { speechCalled = true; if (typeof u.onend === 'function') setTimeout(u.onend, 0); } },
      SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
    },
    configurable: true,
    writable: true,
  });

  globalThis.Audio = function (src) {
    audioConstructed = true;
    this._listeners = {};
    this.src = src;
    this.preload = '';
    this.addEventListener = (name, h) => { this._listeners[name] = this._listeners[name] || []; this._listeners[name].push(h); };
    this.removeEventListener = (name, h) => { if (!this._listeners[name]) return; this._listeners[name] = this._listeners[name].filter(x => x !== h); };
    this.play = () => Promise.resolve();
    this.pause = () => {};
    this.currentTime = 0;
  };

  try {
    const { speak } = await importTs('src/core/tts-adapter.ts');
    await speak('خَلَقَ', { audioSources: ['/audio/w59.mp3', '/audio/gcp/w59.mp3'] });
    assert.equal(speechCalled, false);
    assert.equal(audioConstructed, false);
  } finally {
    if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio;
    if (!hadWindow) delete globalThis.window; else Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
  }
});


test('speak falls back to SpeechSynthesis when audio playback fails', async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');

  let speechCalled = false;
  Object.defineProperty(globalThis, 'window', {
    value: {
      speechSynthesis: { speak: (u) => { speechCalled = true; if (typeof u.onend === 'function') setTimeout(u.onend, 0); } },
      SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
    },
    configurable: true,
    writable: true,
  });

  globalThis.Audio = function (src) {
    this._listeners = {};
    this.src = src;
    this.preload = '';
    this.addEventListener = (name, h) => { this._listeners[name] = this._listeners[name] || []; this._listeners[name].push(h); };
    this.removeEventListener = (name, h) => { if (!this._listeners[name]) return; this._listeners[name] = this._listeners[name].filter(x => x !== h); };
    this.play = () => {
      // simulate playback failure
      return Promise.reject(new Error('playback failed'));
    };
    this.pause = () => {};
    this.currentTime = 0;
  };

  try {
    const { speak } = await importTs('src/core/tts-adapter.ts');
    await speak('مِنْ', { audioSources: ['/audio/w1.mp3'] });
    // ensure speech synthesis was invoked
    assert.equal(speechCalled, true);
  } finally {
    if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio;
    if (!hadWindow) delete globalThis.window; else Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
  }
});


test('pocketbase auth helpers tolerate storage persistence failures', async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem() {
        throw new Error('blocked read');
      },
      setItem() {
        throw new Error('blocked write');
      },
      removeItem() {
        throw new Error('blocked remove');
      },
    },
    configurable: true,
    writable: true,
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/collections/users/auth-with-password')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          token: 'token-789',
          record: {
            id: 'user-3',
            email: 'persist@example.com',
          },
        }),
      };
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { signInWithPassword, signOut } = await importTs('src/core/pocketbase-auth.ts');

    const session = await signInWithPassword('persist@example.com', 'password-123');
    assert.equal(session.user.id, 'user-3');
    assert.equal(session.user.email, 'persist@example.com');

    await assert.doesNotReject(signOut());
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('account settings dispatches sessionissue when password change is unauthorized', async () => {
  const stateKey = '__qfcStory018AccountSettingsState';
  const workspace = mkdtempSync(path.join(tempRoot, 'account-settings-'));
  const authStub = writeAccountSettingsAuthStub(workspace, stateKey);
  const changeStub = writeChangePasswordFormDispatchStub(workspace);
  globalThis[stateKey] = {
    changePasswordCalls: 0,
    lastChangePasswordArgs: null,
  };

  try {
    await withBrowserDom(async ({ document }) => {
      const { default: AccountSettings } = await importSvelte('src/ui/AccountSettings.svelte', {
        [path.resolve(repoRoot, 'src/core/pocketbase-auth.ts')]: authStub,
        [path.resolve(repoRoot, 'src/ui/ChangePasswordForm.svelte')]: changeStub,
      });

      const target = document.getElementById('app');
      assert.ok(target);

      const component = new AccountSettings({
        target,
        props: {
          authSession: {
            token: 'session-token',
            user: { id: 'user-1', email: 'user@example.com' },
          },
          userEmail: 'user@example.com',
        },
      });

      let sessionIssue = null;
      component.$on('sessionissue', (event) => {
        sessionIssue = event.detail;
      });

      await waitForSelector(document, '[data-testid="change-password-submit"]');
      document.querySelector('[data-testid="change-password-submit"]')?.dispatchEvent(new window.Event('click', { bubbles: true }));
      await flushSvelte();
      await flushSvelte();

      assert.equal(globalThis[stateKey].changePasswordCalls, 1);
      assert.ok(sessionIssue);
      assert.deepEqual(sessionIssue, {
        code: 'unauthorized',
        message: 'Your session expired. Please sign in again.',
      });

      component.$destroy();
    });
  } finally {
    delete globalThis[stateKey];
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('app clears session and signs out when StudySession reports unauthorized', async () => {
  const stateKey = '__qfcStory018AppUnauthorizedState';
  const workspace = mkdtempSync(path.join(tempRoot, 'app-sessionissue-unauthorized-'));
  const authStub = writeSessionIssueAuthStub(workspace, stateKey);
  const ttsStub = writeSessionIssueTtsStub(workspace, stateKey);
  const studyStub = writeStudySessionDispatchStub(workspace);
  const settingsStub = writeSettingsDispatchStub(workspace);
  globalThis[stateKey] = {
    initializeAuthCalls: 0,
    signOutCalls: 0,
    signInCalls: 0,
    stopCalls: 0,
  };

  try {
    await withBrowserDom(async ({ document }) => {
      const { default: App } = await importSvelte('src/App.svelte', {
        [path.resolve(repoRoot, 'src/core/pocketbase-auth.ts')]: authStub,
        [path.resolve(repoRoot, 'src/core/tts-adapter.ts')]: ttsStub,
        [path.resolve(repoRoot, 'src/ui/StudySession.svelte')]: studyStub,
        [path.resolve(repoRoot, 'src/ui/Settings.svelte')]: settingsStub,
      });

      const target = document.getElementById('app');
      assert.ok(target);
      const app = new App({ target });

      await waitForSelector(document, '[data-testid="study-stub"]');
      assert.equal(globalThis[stateKey].initializeAuthCalls, 1);
      assert.equal(document.querySelector('[data-testid="study-token"]')?.textContent, 'session-token');

      document.querySelector('[data-testid="study-unauthorized"]')?.dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitForSelector(document, 'input[type="password"]');
      await flushSvelte();

      assert.equal(globalThis[stateKey].stopCalls, 1);
      assert.equal(globalThis[stateKey].signOutCalls, 1);
      assert.ok(document.querySelector('input[type="password"]'));
      assert.equal(document.querySelector('[data-testid="study-stub"]'), null);

      app.$destroy();
    });
  } finally {
    delete globalThis[stateKey];
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('app shows unavailable when Settings reports a backend outage', async () => {
  const stateKey = '__qfcStory018AppUnavailableState';
  const workspace = mkdtempSync(path.join(tempRoot, 'app-sessionissue-unavailable-'));
  const authStub = writeSessionIssueAuthStub(workspace, stateKey);
  const ttsStub = writeSessionIssueTtsStub(workspace, stateKey);
  const studyStub = writeStudySessionDispatchStub(workspace);
  const settingsStub = writeSettingsDispatchStub(workspace);
  globalThis[stateKey] = {
    initializeAuthCalls: 0,
    signOutCalls: 0,
    signInCalls: 0,
    stopCalls: 0,
  };

  try {
    await withBrowserDom(async ({ document }) => {
      const { default: App } = await importSvelte('src/App.svelte', {
        [path.resolve(repoRoot, 'src/core/pocketbase-auth.ts')]: authStub,
        [path.resolve(repoRoot, 'src/core/tts-adapter.ts')]: ttsStub,
        [path.resolve(repoRoot, 'src/ui/StudySession.svelte')]: studyStub,
        [path.resolve(repoRoot, 'src/ui/Settings.svelte')]: settingsStub,
      });

      const target = document.getElementById('app');
      assert.ok(target);
      const app = new App({ target });

      await waitForSelector(document, '[data-testid="study-open-settings"]');
      document.querySelector('[data-testid="study-open-settings"]')?.dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitForSelector(document, '[data-testid="settings-unavailable"]');
      document.querySelector('[data-testid="settings-unavailable"]')?.dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitForSelector(document, '.status-card');
      await flushSvelte();

      assert.equal(globalThis[stateKey].stopCalls, 1);
      assert.equal(globalThis[stateKey].signOutCalls, 0);
      assert.equal(document.querySelector('[data-testid="settings-stub"]'), null);
      assert.ok(document.body.textContent?.includes('Study is temporarily unavailable'));

      app.$destroy();
    });
  } finally {
    delete globalThis[stateKey];
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('study persistence helpers derive fingerprints and ignore stale snapshots', async () => {
  const { normalizeSavedSession } = await importTs('src/core/session.ts');
  const {
    createCardProgressFingerprint,
    createStoredStudyState,
    decodeStoredStudyState,
    loadAuthenticatedStudySnapshot,
  } = await importTs('src/core/pocketbase-study.ts');

  const states = {
    w1: makeCardState('w1', {
      interval: 1,
      dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(),
      reviewCount: 1,
    }),
    w2: makeCardState('w2', {
      interval: 2,
      dueDate: new Date('2026-04-07T09:00:00.000Z').toISOString(),
      reviewCount: 2,
      easyCount: 1,
    }),
  };
  const fingerprint = createCardProgressFingerprint(states);

  assert.notEqual(fingerprint, createCardProgressFingerprint({ ...states, w2: { ...states.w2, easyCount: 2 } }));

  assert.deepEqual(normalizeSavedSession({
    queue: [
      { id: 'w1', mode: 'ar2en' },
      { id: ' ', mode: 'en2ar' },
      { id: 'w2', mode: 'invalid' },
    ],
    index: 4,
    createdAt: '2026-04-09T12:00:00.000Z',
  }, () => 0.1), {
    queue: [
      { id: 'w1', mode: 'ar2en' },
      { id: 'w2', mode: 'ar2en' },
    ],
    index: 2,
    createdAt: '2026-04-09T12:00:00.000Z',
  });

  const storedState = createStoredStudyState(
    { studied: 4, easy: 2, streak: 3, lastStudyDate: '2026-04-09' },
    {
      queue: [{ id: 'w3', mode: 'en2ar' }],
      index: 1,
      createdAt: '2026-04-09T12:00:00.000Z',
    },
    fingerprint,
  );
  const decoded = decodeStoredStudyState(JSON.stringify(storedState));

  assert.deepEqual(decoded, {
    stats: { studied: 4, easy: 2, streak: 3, lastStudyDate: '2026-04-09' },
    session: {
      queue: [{ id: 'w3', mode: 'en2ar' }],
      index: 1,
      createdAt: '2026-04-09T12:00:00.000Z',
    },
    progressFingerprint: fingerprint,
  });

  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const state = {
    qfc2_pb_auth: JSON.stringify({
      token: 'token-1',
      user: { id: 'user-1', email: 'user@example.com' },
    }),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem(key) {
        return state[key] ?? null;
      },
      setItem(key, value) {
        state[key] = String(value);
      },
      removeItem(key) {
        delete state[key];
      },
    },
    configurable: true,
    writable: true,
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/collections/card_progress/records?page=1&perPage=200&filter=user%3D%22user-1%22')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          items: [
            {
              id: 'record-1',
              user: 'user-1',
              word_id: 'w1',
              interval: 1,
              ease: 2.5,
              due_date: '2026-04-10T09:00:00.000Z',
              review_count: 1,
              hard_count: 0,
              got_count: 1,
              easy_count: 0,
              last_rating: 'got',
              last_reviewed_at: '2026-04-09T09:00:00.000Z',
            },
            {
              id: 'record-2',
              user: 'user-1',
              word_id: 'w2',
              interval: 2,
              ease: 2.6,
              due_date: '2026-04-11T09:00:00.000Z',
              review_count: 2,
              hard_count: 0,
              got_count: 1,
              easy_count: 1,
              last_rating: 'easy',
              last_reviewed_at: '2026-04-09T10:00:00.000Z',
            },
          ],
          totalPages: 1,
        }),
      };
    }

    if (url.endsWith('/api/collections/study_state/records?page=1&perPage=1&filter=user%3D%22user-1%22')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          items: [{
            id: 'state-1',
            user: 'user-1',
            state_json: JSON.stringify({
              stats: { studied: 99, easy: 42, streak: 7, lastStudyDate: '2026-04-09' },
              session: { queue: [{ id: 'w1', mode: 'ar2en' }], index: 1, createdAt: '2026-04-09T12:00:00.000Z' },
              progressFingerprint: 'stale-fingerprint',
            }),
          }],
          totalPages: 1,
        }),
      };
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { loadAuthenticatedStudySnapshot } = await importTs('src/core/pocketbase-study.ts');
    const words = [
      { id: 'w1', arabic: 'word1', english: 'word1' },
      { id: 'w2', arabic: 'word2', english: 'word2' },
    ];
    const snapshot = await loadAuthenticatedStudySnapshot({ token: 'token-1', user: { id: 'user-1', email: 'user@example.com' } }, words);

    assert.equal(snapshot.session, null);
    assert.equal(snapshot.states.w1.reviewCount, 1);
    assert.equal(snapshot.states.w2.easyCount, 1);
    assert.equal(snapshot.appStats.studied, 2);
    assert.equal(snapshot.appStats.easy, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  }
});

test('pocketbase bootstrap helpers resolve binary paths and asset names', async () => {
  const {
    resolvePocketBaseBinaryPath,
    resolvePocketBaseAssetName,
  } = await importTs('scripts/pocketbase-bootstrap.mjs');

  assert.equal(
    resolvePocketBaseBinaryPath({ repoRoot: '/repo/root' }),
    process.platform === 'win32' ? '/repo/root/pocketbase.exe' : '/repo/root/pocketbase',
  );
  assert.equal(
    resolvePocketBaseBinaryPath({ repoRoot: '/repo/root', pbBin: '/tmp/custom-pocketbase' }),
    process.platform === 'win32' ? '/tmp/custom-pocketbase.exe' : '/tmp/custom-pocketbase',
  );

  const linuxAsset = resolvePocketBaseAssetName({ version: 'v1.2.3', platform: 'linux', arch: 'x64' });
  assert.equal(linuxAsset.tag, 'v1.2.3');
  assert.equal(linuxAsset.assetName, 'pocketbase_1.2.3_linux_amd64.zip');
  assert.equal(linuxAsset.binaryName, 'pocketbase');
});

test('mastered words are excluded from dueCount and review queue', async () => {
  const { summarizeStudyProgress, MASTERED_EASY_COUNT } = await importTs('src/core/progress-summary.ts');
  const { buildSessionPlan } = await importTs('src/core/session.ts');

  const now = new Date('2026-04-09T12:00:00.000Z');
  const pastDate = new Date('2026-04-08T09:00:00.000Z').toISOString(); // overdue

  // w1: mastered AND overdue — should NOT count as due, should NOT appear in review queue
  // w2: not mastered AND overdue — SHOULD count as due and appear in review queue
  const words = [makeWord('w1'), makeWord('w2')];
  const states = {
    w1: makeCardState('w1', { interval: 2, dueDate: pastDate, reviewCount: 5, easyCount: MASTERED_EASY_COUNT }),
    w2: makeCardState('w2', { interval: 1, dueDate: pastDate, reviewCount: 3, easyCount: 1 }),
  };

  // summarizeStudyProgress should exclude w1 from dueCount
  const summary = summarizeStudyProgress(words, states, now);
  assert.equal(summary.masteredCount, 1, 'w1 should be mastered');
  assert.equal(summary.dueCount, 1, 'only w2 should be due — mastered w1 excluded');

  // buildSessionPlan should not include mastered w1 in the review queue
  const plan = buildSessionPlan(words, states, undefined, {
    limits: { reviewPerSession: 5, newPerSession: 5 },
    now,
    random: () => 0.1,
  });
  const reviewIds = plan.queue.map((item) => item.id);
  assert.ok(!reviewIds.includes('w1'), 'mastered w1 should not appear in review queue');
  assert.ok(reviewIds.includes('w2'), 'non-mastered due w2 should appear in review queue');
  assert.equal(plan.reviewCount, 1, 'review count should be 1 (only w2)');
});


test('buildSessionPlan returns an empty queue when the whole deck is mastered', async () => {
  const { MASTERED_EASY_COUNT } = await importTs('src/core/progress-summary.ts');
  const { buildSessionPlan } = await importTs('src/core/session.ts');

  const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')];
  const states = {
    w1: makeCardState('w1', { interval: 3, dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(), reviewCount: 6, easyCount: MASTERED_EASY_COUNT }),
    w2: makeCardState('w2', { interval: 4, dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(), reviewCount: 6, easyCount: MASTERED_EASY_COUNT + 1 }),
    w3: makeCardState('w3', { interval: 5, dueDate: new Date('2026-04-08T09:00:00.000Z').toISOString(), reviewCount: 6, easyCount: MASTERED_EASY_COUNT }),
  };

  const plan = buildSessionPlan(words, states, undefined, {
    limits: { reviewPerSession: 5, newPerSession: 10 },
    now: new Date('2026-04-09T12:00:00.000Z'),
    random: () => 0.1,
  });

  assert.equal(plan.queue.length, 0);
  assert.equal(plan.newCount, 0);
  assert.equal(plan.reviewCount, 0);
});

test('normalizeCardState preserves all card fields and keeps lastRating/lastReviewedAt as undefined when absent', async () => {
  const { normalizeCardState, initialCardState } = await importTs('src/core/srs.ts');

  // Full state round-trip
  const full = {
    id: 'x1', interval: 4, ease: 2.3, dueDate: '2026-04-10T00:00:00.000Z',
    reviewCount: 5, hardCount: 1, gotCount: 2, easyCount: 2,
    lastRating: 'easy', lastReviewedAt: '2026-04-09T00:00:00.000Z',
  };
  const normalized = normalizeCardState(full);
  assert.equal(normalized.interval, 4);
  assert.equal(normalized.ease, 2.3);
  assert.equal(normalized.reviewCount, 5);
  assert.equal(normalized.hardCount, 1);
  assert.equal(normalized.gotCount, 2);
  assert.equal(normalized.easyCount, 2);
  assert.equal(normalized.lastRating, 'easy');

  // Partial state — missing fields should fall back to defaults
  const partial = normalizeCardState({ id: 'x2' });
  assert.equal(partial.interval, 0);
  assert.equal(partial.ease, 2.5);
  assert.equal(partial.reviewCount, 0);
  assert.equal(partial.lastRating, undefined);
  assert.equal(partial.lastReviewedAt, undefined);
});

test('gTTS script targets review ids in dry-run mode', async () => {
  const workspace = mkdtempSync(path.join(tempRoot, 'gtts-review-'));
  makeAudioReviewWorkspace(workspace, ['w100', 'w12', 'w100']);

  const stdout = execFileSync('python3', [
    path.resolve(repoRoot, 'scripts/generate_audio_gtts.py'),
    '--review-file', '.context/reviews/mispronunciations.md',
    '--dry-run',
  ], {
    cwd: workspace,
    encoding: 'utf8',
  });

  assert.match(stdout, /Dry run: 2 target id\(s\)/);
  assert.ok(stdout.includes('w100'));
  assert.ok(stdout.includes('w12'));
  assert.ok(stdout.indexOf('w100') < stdout.indexOf('w12'), 'review ids should keep file order');
  assert.equal((stdout.match(/w100/g) || []).length, 1, 'duplicate ids should be deduped in dry-run output');
});


test('generate_sample_preview.mjs writes a review-only mispronunciations preview', async () => {
  const workspace = mkdtempSync(path.join(tempRoot, 'preview-review-'));
  makeAudioReviewWorkspace(workspace, ['w100', 'w12', 'w100']);

  execFileSync('node', [
    path.resolve(repoRoot, 'scripts/generate_sample_preview.mjs'),
    '--review-file', '.context/reviews/mispronunciations.md',
    '--out', 'public/audio/mispronunciations_preview.html',
  ], {
    cwd: workspace,
    encoding: 'utf8',
  });

  const html = await readFile(path.join(workspace, 'public/audio/mispronunciations_preview.html'), 'utf8');
  assert.match(html, /Mispronunciations preview \(2 words\)/);
  assert.match(html, /data-preview-mode="review"/);
  assert.match(html, /Still wrong/);
  assert.match(html, /http:\/\/localhost:8001\/audio\/mispronunciations_preview\.html/);
  assert.ok(html.includes('w100'));
  assert.ok(html.includes('w12'));
  assert.ok(!html.includes('w35'));
  assert.ok(html.indexOf('w100') < html.indexOf('w12'), 'preview order should follow the review table');
});


test('add_mispronunciation.mjs appends a still-wrong row even when the id already exists', async () => {
  const workspace = mkdtempSync(path.join(tempRoot, 'append-still-wrong-'));
  makeAudioReviewWorkspace(workspace, ['w12']);

  execFileSync('node', [
    path.resolve(repoRoot, 'scripts/add_mispronunciation.mjs'),
    '--id', 'w12',
    '--still-wrong',
  ], {
    cwd: workspace,
    encoding: 'utf8',
  });

  const reviewFile = await readFile(path.join(workspace, '.context/reviews/mispronunciations.md'), 'utf8');
  assert.equal((reviewFile.match(/^\|\s*w12\s*\|/gm) || []).length, 2, 'the script should append duplicate review rows for the same id');
  assert.match(reviewFile, /still wrong after listening/);
  assert.match(reviewFile, /regenerate gTTS and listen again/);
});


test('review preview button appends still-wrong rows through the 8001 flag server', async () => {
  const workspace = mkdtempSync(path.join(tempRoot, 'flag-server-'));
  makeAudioReviewWorkspace(workspace, ['w12']);

  execFileSync('node', [
    path.resolve(repoRoot, 'scripts/generate_sample_preview.mjs'),
    '--review-file', '.context/reviews/mispronunciations.md',
    '--out', 'public/audio/mispronunciations_preview.html',
  ], {
    cwd: workspace,
    encoding: 'utf8',
  });

  const { proc, port } = await startPreviewServer(workspace);
  try {
    const pageResponse = await fetch(`http://127.0.0.1:${port}/audio/mispronunciations_preview.html`);
    assert.equal(pageResponse.ok, true, 'preview page should be served from the 8001 flag server');
    const pageHtml = await pageResponse.text();
    assert.match(pageHtml, /Mispronunciations preview \(1 word\)/);
    assert.match(pageHtml, /Still wrong/);
    assert.match(pageHtml, /data-preview-mode="review"/);

    await withBrowserDom(async ({ document, window }) => {
      const originalAlert = globalThis.alert;
      const originalPrompt = globalThis.prompt;
      globalThis.alert = () => {};
      globalThis.prompt = () => { throw new Error('prompt should not be used when the flag server is healthy'); };

      try {
        document.body.innerHTML = `
          <div class="word" data-word-id="w12">
            <strong>w12</strong>
            <span class="arabic">لِ</span>
            <div class="meta"><em>li</em> — For/to</div>
            <div class="word-tools">
              <button type="button" class="flag-btn">Flag</button>
            </div>
          </div>
        `;

        window.__QFC_PREVIEW_MODE__ = 'review';
        window.__QFC_FLAG_ENDPOINT__ = `http://127.0.0.1:${port}/flag`;

        const script = await readFile(path.join(repoRoot, 'public/audio/sample_preview_flag.js'), 'utf8');
        eval(script);
        document.dispatchEvent(new window.Event('DOMContentLoaded'));

        const button = document.querySelector('.flag-btn');
        assert.ok(button);
        assert.equal(button.textContent, 'Still wrong');

        button.dispatchEvent(new window.Event('click', { bubbles: true }));
        await waitForFileMatchCount(path.join(workspace, '.context/reviews/mispronunciations.md'), /^\|\s*w12\s*\|/gm, 2);

        const reviewFile = await readFile(path.join(workspace, '.context/reviews/mispronunciations.md'), 'utf8');
        assert.equal((reviewFile.match(/^\|\s*w12\s*\|/gm) || []).length, 2, 'server append should add a second still-wrong row');
        assert.match(reviewFile, /still wrong after listening/);
        assert.match(reviewFile, /regenerate gTTS and listen again/);
        assert.equal(button.disabled, true);
        assert.equal(button.textContent, 'Still wrong ✓');
      } finally {
        if (typeof originalAlert === 'undefined') {
          delete globalThis.alert;
        } else {
          globalThis.alert = originalAlert;
        }
        if (typeof originalPrompt === 'undefined') {
          delete globalThis.prompt;
        } else {
          globalThis.prompt = originalPrompt;
        }
      }
    });
  } finally {
    await stopPreviewServer(proc);
  }
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

rmSync(tempRoot, { recursive: true, force: true });

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} test(s) failed.`);
} else {
  console.log(`\n${tests.length} test(s) passed.`);
}
