#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.cwd(), 'public', 'audio', 'sample_preview.html');
let s = fs.readFileSync(file, 'utf8');
const start = s.lastIndexOf('<script>');
const end = s.indexOf('</script>', start);
if (start === -1 || end === -1) {
  console.error('Script block not found');
  process.exit(2);
}
const before = s.slice(0, start + '<script>'.length);
const inner = s.slice(start + '<script>'.length, end);
const after = s.slice(end);
// replace literal backslash-n sequences with actual newline characters
const fixedInner = inner.replace(/\\n/g, '\n');
// also replace literal \t with tab if present
const finalInner = fixedInner.replace(/\\t/g, '\t');
fs.writeFileSync(file, before + finalInner + after, 'utf8');
console.log('fixed script block in', file);
