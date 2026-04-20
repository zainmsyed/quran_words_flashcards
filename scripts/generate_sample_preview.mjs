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

async function main() {
  const repoRoot = process.cwd();
  const seedPath = path.join(repoRoot, 'src', 'data', 'seed-words.json');
  const outPath = path.join(repoRoot, 'public', 'audio', 'sample_preview.html');

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

  const count = seed.length;
  const css = [
    'body{font-family:system-ui,Arial,Helvetica,sans-serif;max-width:980px;margin:2rem auto;padding:1rem}',
    '.word{border:1px solid #eee;padding:0.75rem;margin-bottom:0.5rem;border-radius:6px}',
    '.arabic{font-family:"Noto Naskh Arabic",serif;font-size:1.6rem;direction:rtl;text-align:right}',
    '.meta{margin-top:0.25rem;font-size:0.95rem;color:#333}',
    '.word-tools{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-top:0.6rem}',
    '.flag-btn{padding:0.22rem 0.7rem;border:0;border-radius:6px;background:#d84315;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.12)}',
    '.flag-btn:hover{background:#bf3d14}',
    '.flag-btn:focus-visible{outline:2px solid #d84315;outline-offset:2px}',
    '.flag-btn:disabled{opacity:0.7;cursor:default}',
    'audio{display:block;max-width:100%;margin-top:0.05rem}'
  ].join(' ');

  const rows = seed.map((w) => {
    const id = String(w.id || '');
    const arabic = escapeHtml(w.arabic || '');
    const translit = escapeHtml(w.transliteration || '');
    const english = escapeHtml(w.english || '');
    const safeId = escapeHtml(id);

    return [
      `<div class="word" data-word-id="${safeId}">`,
      `  <strong>${safeId}</strong> — <span class="arabic">${arabic}</span>`,
      `  <div class="meta"><em>${translit}</em> — ${english}</div>`,
      `  <div class="word-tools">`,
      `    <button type="button" class="flag-btn" data-word-id="${safeId}">Flag</button>`,
      `    <audio controls preload="none"><source src="/audio/${safeId}.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>`,
      `  </div>`,
      `</div>`
    ].join('\n');
  }).join('\n');

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Audio sample preview (full ${count} words)</title>
<style>${css}</style>
<h1>Audio sample preview (${count} words)</h1>
<p>Click the play controls to listen. Files are referenced at <code>/audio/&lt;id&gt;.mp3</code>.</p>
<p><strong>Flagging:</strong> If the local flag server is running at <code>http://localhost:8001</code>, the Flag button will append entries directly to <code>.context/reviews/mispronunciations.md</code>. Otherwise the page will copy a CLI command you can run locally.</p>

${rows}

<script src="/audio/sample_preview_flag.js"></script>
`;

  try {
    await fs.writeFile(outPath, html, 'utf8');
    console.log('Wrote sample preview:', outPath, 'entries:', count);
  } catch (err) {
    console.error('Failed to write preview', err);
    process.exit(3);
  }
}

main();
