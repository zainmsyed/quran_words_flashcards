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
            { id: 'w200', filename: 'w200.mp3', bytes: 1234, exists: true },
            { id: 'w201', filename: 'w201.mp3', bytes: 1234, exists: true },
          ],
        }),
      };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { hasBundledAudioForWordId, loadBundledAudioManifest } = await importTs('src/core/tts-adapter.ts');

    // defaults contain w1..w10
    assert.equal(hasBundledAudioForWordId('w1'), true);
    assert.equal(hasBundledAudioForWordId('w200'), false);

    await loadBundledAudioManifest();

    // after manifest load the new ids should be present
    assert.equal(hasBundledAudioForWordId('w200'), true);
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
