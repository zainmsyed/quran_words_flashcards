#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    out: 'public/audio/sample_preview.html',
    seed: 'src/data/seed-words.json',
    reviewFile: '',
    reviewOnly: false,
    mode: 'full',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--review-only') {
      args.reviewOnly = true;
      continue;
    }
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (typeof next === 'undefined' || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    if (key === 'review-file') {
      args.reviewFile = next;
    } else if (key === 'out') {
      args.out = next;
    } else if (key === 'seed') {
      args.seed = next;
    } else if (key === 'mode') {
      args.mode = next;
    } else {
      args[key] = next;
    }
    i++;
  }

  return args;
}

async function loadSeedWords(seedPath) {
  let seed;
  try {
    const raw = await fs.readFile(seedPath, 'utf8');
    seed = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read seed file', seedPath, err);
    process.exit(2);
  }

  if (!Array.isArray(seed)) {
    console.error('Seed file must be a JSON array');
    process.exit(2);
  }

  return seed;
}

async function loadReviewIds(reviewPath) {
  let raw;
  try {
    raw = await fs.readFile(reviewPath, 'utf8');
  } catch (err) {
    console.error('Failed to read review file', reviewPath, err);
    process.exit(2);
  }

  const ids = [];
  const seen = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(w\d+)\s*\|/i);
    if (!match) continue;
    const id = match[1].trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function buildWordLookup(words) {
  const lookup = new Map();
  for (const word of words) {
    if (!word || typeof word !== 'object') continue;
    const id = String(word.id || '').trim();
    if (!id || lookup.has(id)) continue;
    lookup.set(id, word);
  }
  return lookup;
}

function selectWords(words, reviewIds) {
  if (!reviewIds) return words;
  const lookup = buildWordLookup(words);
  const selected = [];
  const missing = [];

  for (const id of reviewIds) {
    const word = lookup.get(id);
    if (word) {
      selected.push(word);
    } else {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    console.warn(`Skipping ${missing.length} reviewed id(s) missing from the seed deck: ${missing.join(', ')}`);
  }

  return selected;
}

function renderWord(word, buttonLabel) {
  const id = escapeHtml(word.id || '');
  const arabic = escapeHtml(word.arabic || '');
  const transliteration = escapeHtml(word.transliteration || '');
  const english = escapeHtml(word.english || '');

  return [
    `<div class="word" data-word-id="${id}">`,
    `  <strong>${id}</strong> — <span class="arabic">${arabic}</span>`,
    `  <div class="meta"><em>${transliteration}</em> — ${english}</div>`,
    `  <div class="word-tools">`,
    `    <button type="button" class="flag-btn" data-word-id="${id}">${escapeHtml(buttonLabel)}</button>`,
    `    <audio controls preload="none"><source src="/audio/${id}.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>`,
    `  </div>`,
    `</div>`,
  ].join('\n');
}

function formatWordCount(count) {
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}

function renderHtml(words, { title, heading, introHtml, reviewMode }) {
  const count = words.length;
  const buttonLabel = reviewMode ? 'Still wrong' : 'Flag';
  const previewMode = reviewMode ? 'review' : 'full';
  const rows = words.map((word) => renderWord(word, buttonLabel)).join('\n');
  const emptyState = reviewMode
    ? `<p class="empty-state">No reviewed words were found in <code>.context/reviews/mispronunciations.md</code>.</p>`
    : `<p class="empty-state">No words were found in the seed deck.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:system-ui,Arial,Helvetica,sans-serif;max-width:980px;margin:2rem auto;padding:1rem;line-height:1.45}
  .word{border:1px solid #eee;padding:0.75rem;margin-bottom:0.5rem;border-radius:6px}
  .arabic{font-family:"Noto Naskh Arabic",serif;font-size:1.6rem;direction:rtl;text-align:right}
  .meta{margin-top:0.25rem;font-size:0.95rem;color:#333}
  .word-tools{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-top:0.6rem}
  .flag-btn{padding:0.22rem 0.7rem;border:0;border-radius:6px;background:#d84315;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.12)}
  .flag-btn:hover{background:#bf3d14}
  .flag-btn:focus-visible{outline:2px solid #d84315;outline-offset:2px}
  .flag-btn:disabled{opacity:0.7;cursor:default}
  .empty-state{padding:0.85rem 1rem;border:1px dashed #d0d0d0;border-radius:6px;background:#fafafa}
  .preview-note{padding:0.75rem 1rem;border-radius:6px;background:#fff7df;border:1px solid #f0d36b;margin-bottom:1rem}
  audio{display:block;max-width:100%;margin-top:0.05rem}
</style>
</head>
<body data-preview-mode="${previewMode}">
<h1>${escapeHtml(heading)}</h1>
<p>Click the play controls to listen. Files are referenced at <code>/audio/&lt;id&gt;.mp3</code>.</p>
${introHtml}
${reviewMode ? `<div class="preview-note">This page only lists the word IDs found in <code>.context/reviews/mispronunciations.md</code>. Use the <strong>Still wrong</strong> button to append another row if a regenerated file still sounds off.</div>` : ''}
${rows || emptyState}

<script>window.__QFC_PREVIEW_MODE__ = ${JSON.stringify(previewMode)};</script>
<script src="/audio/sample_preview_flag.js"></script>
</body>
</html>
`;
}

async function main() {
  const args = parseArgs();
  const repoRoot = process.cwd();
  const seedPath = path.resolve(repoRoot, args.seed);
  const outPath = path.resolve(repoRoot, args.out);
  const reviewMode = args.reviewOnly || args.mode === 'review' || !!args.reviewFile;

  const seed = await loadSeedWords(seedPath);
  const selectedWords = reviewMode ? selectWords(seed, await loadReviewIds(path.resolve(repoRoot, args.reviewFile || '.context/reviews/mispronunciations.md'))) : seed;

  const reviewCountLabel = formatWordCount(selectedWords.length);
  const title = reviewMode
    ? `Mispronunciations preview (${reviewCountLabel})`
    : `Audio sample preview (full ${reviewCountLabel})`;
  const heading = reviewMode
    ? `Mispronunciations preview (${reviewCountLabel})`
    : `Audio sample preview (${reviewCountLabel})`;
  const introHtml = reviewMode
    ? `<p><strong>Review mode:</strong> This page is centered on <code>http://localhost:8001/audio/mispronunciations_preview.html</code> and lists only the words referenced in <code>.context/reviews/mispronunciations.md</code>.</p>`
    : `<p><strong>Flagging:</strong> If the local flag server is running at <code>http://localhost:8001</code>, the Flag button will append entries directly to <code>.context/reviews/mispronunciations.md</code>. Otherwise the page will copy a CLI command you can run locally.</p>`;

  const html = renderHtml(selectedWords, { title, heading, introHtml, reviewMode });

  try {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, 'utf8');
    console.log('Wrote sample preview:', outPath, 'entries:', selectedWords.length, 'mode:', reviewMode ? 'review' : 'full');
  } catch (err) {
    console.error('Failed to write preview', err);
    process.exit(3);
  }
}

main();
