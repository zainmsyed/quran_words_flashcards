#!/usr/bin/env node
import { buildSync } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'qfc-srs-'));
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

(async () => {
  try {
    const { initialCardState, applyRatingToCard } = await importTs('src/core/srs.ts');

    console.log('--- New card ratings ---');
    const start = initialCardState('new1');
    console.log('start:', start);

    const hard = applyRatingToCard(start, 'hard');
    console.log('\nhard result:', JSON.stringify(hard, null, 2));

    const got = applyRatingToCard(start, 'got');
    console.log('\ngot result:', JSON.stringify(got, null, 2));

    const easy = applyRatingToCard(start, 'easy');
    console.log('\neasy result:', JSON.stringify(easy, null, 2));

    console.log('\n--- Existing card (interval=4, ease=2.5) ---');
    const existing = { id: 'r1', interval: 4, ease: 2.5, dueDate: new Date().toISOString(), reviewCount: 0, hardCount: 0, gotCount: 0, easyCount: 0 };
    console.log('existing:', existing);

    const hard2 = applyRatingToCard(existing, 'hard');
    console.log('\nhard result:', JSON.stringify(hard2, null, 2));

    const got2 = applyRatingToCard(existing, 'got');
    console.log('\ngot result:', JSON.stringify(got2, null, 2));

    const easy2 = applyRatingToCard(existing, 'easy');
    console.log('\neasy result:', JSON.stringify(easy2, null, 2));

    console.log('\n--- Edge case: small interval (0.1) ---');
    const small = { id: 's1', interval: 0.1, ease: 1.4, dueDate: new Date().toISOString(), reviewCount: 5, hardCount: 0, gotCount: 0, easyCount: 0 };
    console.log('small:', small);
    const hard3 = applyRatingToCard(small, 'hard');
    console.log('\nhard result:', JSON.stringify(hard3, null, 2));

  } catch (err) {
    console.error('error:', err);
  } finally {
    try { rmSync(tempRoot, { recursive: true }); } catch {}
  }
})();
