#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  const { buildSessionPlan, retrySessionItem, isSameLocalDay } = await importTs('src/core/session.ts');

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
  assert.deepEqual(plan.queue.map((item) => item.id), ['w3', 'w1', 'w2', 'w4']);
  assert.deepEqual(plan.queue.map((item) => item.mode), ['ar2en', 'en2ar', 'ar2en', 'en2ar']);

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
  assert.deepEqual(retrySessionItem({ id: 'w2', mode: 'en2ar' }), { id: 'w2', mode: 'en2ar' });
  assert.equal(isSameLocalDay(new Date(2026, 3, 9, 9, 0, 0).toISOString(), new Date(2026, 3, 9, 18, 0, 0)), true);
  assert.equal(isSameLocalDay(new Date(2026, 3, 10, 9, 0, 0).toISOString(), new Date(2026, 3, 9, 18, 0, 0)), false);
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

test('study persistence helpers normalize saved session and stored state blobs', async () => {
  const { normalizeSavedSession } = await importTs('src/core/session.ts');
  const { decodeStoredStudyState } = await importTs('src/core/pocketbase-study.ts');

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

  const decoded = decodeStoredStudyState(JSON.stringify({
    stats: { studied: 4, easy: 2, streak: 3, lastStudyDate: '2026-04-09' },
    session: {
      queue: [{ id: 'w3', mode: 'en2ar' }],
      index: 1,
      createdAt: '2026-04-09T12:00:00.000Z',
    },
  }));

  assert.deepEqual(decoded, {
    stats: { studied: 4, easy: 2, streak: 3, lastStudyDate: '2026-04-09' },
    session: {
      queue: [{ id: 'w3', mode: 'en2ar' }],
      index: 1,
      createdAt: '2026-04-09T12:00:00.000Z',
    },
  });
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
