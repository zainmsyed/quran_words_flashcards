#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function usage() {
  console.error('Usage: node scripts/add_mispronunciation.mjs --id <id> [--issue <text>] [--suggested-fix <text>] [--reporter <name>] [--date YYYY-MM-DD] [--still-wrong]');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--force') {
    args.force = true;
    continue;
  }
  if (a === '--still-wrong') {
    args.stillWrong = true;
    continue;
  }
  if (!a.startsWith('--')) continue;
  const key = a.slice(2);
  const val = argv[i + 1];
  if (typeof val === 'undefined' || val.startsWith('--')) {
    console.error(`Missing value for --${key}`);
    usage();
  }
  args[key] = val;
  i++;
}

if (!args.id) usage();

const id = args.id;
const stillWrong = !!args.stillWrong;
const issue = args.issue || (stillWrong ? 'still wrong after listening' : 'audio needs recreation');
const suggested = args['suggested-fix'] || (stillWrong ? 'regenerate gTTS and listen again' : 'recreate');
const reporter = args.reporter || 'you';
const date = args.date || new Date().toISOString().slice(0, 10);

const repoRoot = process.cwd();
const mdPath = path.resolve(repoRoot, '.context/reviews/mispronunciations.md');
const seedPath = path.resolve(repoRoot, 'src/data/seed-words.json');

let arabic = '';
let translit = '';
try {
  if (fs.existsSync(seedPath)) {
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const word = seed.find((w) => w && w.id === id);
    if (word) {
      arabic = word.arabic || '';
      translit = word.transliteration || '';
    }
  }
} catch (e) {
  // ignore seed lookup failures; the id is still the primary key for the row
}

function escapeCell(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

try {
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
} catch (e) {
  // ignore directory creation errors and let the write path report them below
}

if (!fs.existsSync(mdPath)) {
  const header = `# Mispronunciations / audio issues (running list)\n\nThis file was created automatically by scripts/add_mispronunciation.mjs\n\n| id | arabic | transliteration | audio | issue | suggested fix | reporter | date |\n|---|---:|---|---|---|---|---|---|\n`;
  try {
    fs.writeFileSync(mdPath, header, 'utf8');
  } catch (e) {
    console.error('Failed to create mispronunciations file:', e);
    process.exit(3);
  }
}

const row = `| ${escapeCell(id)} | ${escapeCell(arabic)} | ${escapeCell(translit)} | /audio/${escapeCell(id)}.mp3 | ${escapeCell(issue)} | ${escapeCell(suggested)} | ${escapeCell(reporter)} | ${date} |`;

try {
  fs.appendFileSync(mdPath, '\n' + row + '\n', 'utf8');
  console.log('Appended entry for', id, 'to', mdPath);
  console.log(row);
  process.exit(0);
} catch (e) {
  console.error('Failed to append to file:', e);
  process.exit(4);
}
