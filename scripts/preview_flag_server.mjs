#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import url from 'url';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SEED_PATH = path.resolve(process.cwd(), 'src/data/seed-words.json');
const MD_DIR = path.resolve(process.cwd(), '.context', 'reviews');
const MD_PATH = path.resolve(MD_DIR, 'mispronunciations.md');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

const FLAG_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function escapeCell(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function ensureMdHeader() {
  try {
    await fsp.mkdir(MD_DIR, { recursive: true });
    const exists = await fsp.stat(MD_PATH).then(() => true).catch(() => false);
    if (!exists) {
      const header = `# Mispronunciations / audio issues (running list)\n\nThis file tracks flagged audio issues added from the local preview server.\n\n| id | arabic | transliteration | audio | issue | suggested fix | reporter | date |\n|---|---:|---|---|---|---|---|---|\n`;
      await fsp.writeFile(MD_PATH, header, 'utf8');
    }
  } catch (e) {
    console.error('Failed to ensure MD header:', e);
  }
}

async function appendRow(row) {
  try {
    await ensureMdHeader();
    await fsp.appendFile(MD_PATH, '\n' + row + '\n', 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to append row:', e);
    return false;
  }
}

async function handleFlag(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');

    let payload = null;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', ...FLAG_CORS_HEADERS });
      return res.end('invalid json');
    }

    const id = String(payload?.id || '').trim();
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', ...FLAG_CORS_HEADERS });
      return res.end('missing id');
    }

    const stillWrong = payload?.stillWrong === true || payload?.stillWrong === 'true' || payload?.stillWrong === 1;
    const issue = String(payload?.issue || (stillWrong ? 'still wrong after listening' : 'audio needs recreation')).trim() || (stillWrong ? 'still wrong after listening' : 'audio needs recreation');
    const suggested = String(payload?.suggested || (stillWrong ? 'regenerate gTTS and listen again' : 'recreate')).trim() || (stillWrong ? 'regenerate gTTS and listen again' : 'recreate');
    const reporter = String(payload?.reporter || 'you').trim() || 'you';
    const date = String(payload?.date || new Date().toISOString().slice(0, 10)).trim();

    let arabic = '';
    let transliteration = '';
    try {
      const seedRaw = await fsp.readFile(SEED_PATH, 'utf8');
      const seed = JSON.parse(seedRaw);
      const w = Array.isArray(seed) && seed.find((x) => x && x.id === id);
      if (w) {
        arabic = w.arabic || '';
        transliteration = w.transliteration || '';
      }
    } catch (e) {
      // ignore if seed can't be read — use provided values
    }

    const mdRow = `| ${escapeCell(id)} | ${escapeCell(arabic)} | ${escapeCell(transliteration)} | /audio/${escapeCell(id)}.mp3 | ${escapeCell(issue)} | ${escapeCell(suggested)} | ${escapeCell(reporter)} | ${escapeCell(date)} |`;

    const ok = await appendRow(mdRow);
    if (!ok) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...FLAG_CORS_HEADERS });
      return res.end('failed to write');
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, row: mdRow }));
    console.log('Appended flag for', id);
  } catch (e) {
    console.error('handleFlag exception', e);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...FLAG_CORS_HEADERS });
      res.end('server error');
    } catch (err) {
      // ignore
    }
  }
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

async function serveStatic(req, res, pathname) {
  try {
    let rel = pathname.replace(/^\/+/, '');
    if (!rel) rel = 'index.html';
    const filePath = path.join(PUBLIC_DIR, rel);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('forbidden');
    }

    let stat;
    try {
      stat = await fsp.stat(resolved);
    } catch (e) {
      stat = null;
    }
    if (!stat) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('not found');
    }

    if (stat.isDirectory()) {
      const indexPath = path.join(resolved, 'index.html');
      try {
        const idxStat = await fsp.stat(indexPath);
        stat = idxStat;
        rel = path.join(rel, 'index.html');
      } catch (e) {
        // keep original stat if there is no index file
      }
    }

    const total = stat.size;
    const range = req.headers.range;
    const contentType = contentTypeFor(resolved);

    if (range && contentType.startsWith('audio/')) {
      const m = /bytes=(\d+)-(\d+)?/.exec(range);
      if (m) {
        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : total - 1;
        if (start >= total || end >= total) {
          res.writeHead(416, { 'Content-Range': `bytes */${total}` });
          return res.end();
        }
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Content-Type': contentType,
        });
        const stream = fs.createReadStream(resolved, { start, end });
        stream.pipe(res);
        return;
      }
    }

    res.writeHead(200, { 'Content-Length': String(total), 'Content-Type': contentType });
    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
  } catch (e) {
    console.error('serveStatic error', e);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('server error');
    } catch (err) {
      // ignore
    }
  }
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url || '/', true);
  const pathname = parsed.pathname || '/';

  if (pathname === '/_health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, now: new Date().toISOString() }));
  }

  if (pathname === '/flag') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, FLAG_CORS_HEADERS);
      return res.end();
    }
    if (req.method === 'POST') return handleFlag(req, res);
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', ...FLAG_CORS_HEADERS });
    return res.end('method not allowed');
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('method not allowed');
});

server.listen(PORT, () => {
  console.log(`Preview+flag server listening on http://localhost:${PORT}`);
  console.log(`Serving files from ${PUBLIC_DIR}`);
  console.log(`POST flags to http://localhost:${PORT}/flag`);
});
