#!/usr/bin/env python3
"""
Generate short Arabic pronunciation MP3 files with gTTS.

This script is the free / quick regeneration path for the bundled audio deck.
It can:
- regenerate a legacy first-N sample
- regenerate explicit ids
- regenerate the ids listed in .context/reviews/mispronunciations.md
- refresh public/audio/manifest.json after a regeneration pass

Usage examples:
  # legacy sample path (first 10 words by default)
  python3 scripts/generate_audio_gtts.py
  python3 scripts/generate_audio_gtts.py 300

  # regenerate only the ids listed in the review table
  python3 scripts/generate_audio_gtts.py --review-file .context/reviews/mispronunciations.md --force

  # inspect the target ids without generating audio
  python3 scripts/generate_audio_gtts.py --review-file .context/reviews/mispronunciations.md --dry-run

Notes:
- gTTS is an unofficial/free path and is intentionally lightweight for quick remediations.
- The script rewrites public/audio/manifest.json after a real regeneration pass so the deck stays in sync.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

DEFAULT_COUNT = 10
DEFAULT_SAMPLE_RATE = 24000
DEFAULT_VOICE = 'gtts-ar'


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate Arabic audio MP3s with gTTS')
    parser.add_argument('count', nargs='?', type=int, default=DEFAULT_COUNT, help='Legacy sample size (default: 10)')
    parser.add_argument('--out', default='public/audio', help='Output directory for MP3 files')
    parser.add_argument('--seed', default='src/data/seed-words.json', help='Path to the seed words JSON file')
    parser.add_argument('--ids', default=None, help='Comma-separated list of ids to regenerate (e.g. w12,w100)')
    parser.add_argument('--review-file', default=None, help='Markdown review table whose ids should be regenerated')
    parser.add_argument('--force', action='store_true', help='Overwrite existing files')
    parser.add_argument('--dry-run', action='store_true', help='Print the selected ids and exit without generating audio')
    parser.add_argument('--manifest-only', action='store_true', help='Refresh manifest.json from the current audio files without generating audio')
    parser.add_argument('--sample-rate', default=DEFAULT_SAMPLE_RATE, type=int, help='Manifest sample rate metadata (default 24000)')
    parser.add_argument('--add-final-sukun', action='store_true', help='Append Arabic SUKUN (U+0652) to the final letter if it has no diacritic; only used for TTS text (does not modify the seed file)')
    return parser.parse_args()


def load_seed(seed_path: Path) -> List[Dict]:
    if not seed_path.exists():
        print(f'Seed file not found: {seed_path}')
        sys.exit(2)
    try:
        with seed_path.open('r', encoding='utf-8') as fh:
            data = json.load(fh)
            if not isinstance(data, list):
                raise ValueError('seed file must be a JSON array')
            return data
    except Exception as exc:
        print('Failed to read seed file:', exc)
        sys.exit(2)


def load_review_ids(review_path: Path) -> List[str]:
    if not review_path.exists():
        print(f'Review file not found: {review_path}')
        sys.exit(2)

    try:
        raw = review_path.read_text(encoding='utf-8')
    except Exception as exc:
        print('Failed to read review file:', exc)
        sys.exit(2)

    ids: List[str] = []
    seen = set()
    for line in raw.splitlines():
        match = re.match(r'^\|\s*(w\d+)\s*\|', line, flags=re.IGNORECASE)
        if not match:
            continue
        wid = match.group(1).strip()
        if not wid or wid in seen:
            continue
        seen.add(wid)
        ids.append(wid)
    return ids


def build_lookup(words: Iterable[Dict]) -> Dict[str, Dict]:
    lookup: Dict[str, Dict] = {}
    for word in words:
        if not isinstance(word, dict):
            continue
        wid = str(word.get('id') or '').strip()
        if not wid or wid in lookup:
            continue
        lookup[wid] = word
    return lookup


def select_words(words: List[Dict], args: argparse.Namespace) -> List[Dict]:
    lookup = build_lookup(words)

    if args.ids:
        selected_ids = [item.strip() for item in args.ids.split(',') if item.strip()]
    elif args.review_file:
        selected_ids = load_review_ids(Path(args.review_file))
    else:
        selected_ids = [str(word.get('id') or '').strip() for word in words[: max(args.count, 0)]]
        selected_ids = [wid for wid in selected_ids if wid]

    selected: List[Dict] = []
    missing: List[str] = []
    for wid in selected_ids:
        word = lookup.get(wid)
        if word is None:
            missing.append(wid)
            continue
        selected.append(word)

    if missing:
        print('Skipping ids missing from seed deck:', ', '.join(missing))

    return selected


def scan_existing(out_dir: Path, words: Iterable[Dict]) -> List[Dict]:
    entries: List[Dict] = []
    for word in words:
        wid = str(word.get('id') or '').strip()
        if not wid:
            continue
        fname = f'{wid}.mp3'
        fpath = out_dir / fname
        exists = fpath.exists()
        size = None
        if exists:
            try:
                size = fpath.stat().st_size
            except Exception:
                size = None
        entries.append({
            'id': wid,
            'filename': fname,
            'bytes': size,
            'exists': exists,
        })
    return entries


def write_manifest(out_dir: Path, entries: List[Dict], sample_rate: int) -> None:
    manifest = {
        'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'provider': 'gtts',
        'voice': DEFAULT_VOICE,
        'sample_rate': sample_rate,
        'entries': entries,
    }
    dst = out_dir / 'manifest.json'
    try:
        with dst.open('w', encoding='utf-8') as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)
        print('Wrote manifest:', dst)
    except Exception as exc:
        print('Failed to write manifest:', exc)
        sys.exit(3)


def _is_combining(cp: int) -> bool:
    return (0x0610 <= cp <= 0x061A) or (0x064B <= cp <= 0x065F) or (0x06D6 <= cp <= 0x06ED)


def _ensure_final_sukun(text: str) -> str:
    """Return text with a trailing SUKUN (U+0652) appended if the final grapheme cluster has no diacritic."""
    if not text:
        return text
    s = text.rstrip()
    clusters = []
    cur = ''
    for ch in s:
        if cur == '' or not _is_combining(ord(ch)):
            if cur != '':
                clusters.append(cur)
            cur = ch
        else:
            cur += ch
    if cur != '':
        clusters.append(cur)
    if not clusters:
        return s
    last = clusters[-1]
    # if the last cluster already contains any combining mark, do nothing
    for ch in last:
        if _is_combining(ord(ch)):
            return s
    # otherwise append SUKUN
    return s + '\u0652'


def generate_with_gtts(out_dir: Path, words: List[Dict], force: bool, add_final_sukun: bool) -> None:
    try:
        from gtts import gTTS
    except Exception:
        print('gTTS not installed. Install with: pip install gTTS')
        sys.exit(3)

    out_dir.mkdir(parents=True, exist_ok=True)
    generated = 0
    for word in words:
        wid = str(word.get('id') or '').strip()
        text_ar = str(word.get('arabic') or '').strip()
        if not wid or not text_ar:
            continue

        tts_text = _ensure_final_sukun(text_ar) if add_final_sukun else text_ar

        out_path = out_dir / f'{wid}.mp3'
        if out_path.exists() and not force:
            print(out_path, 'already exists — skipping')
            continue

        print(f'Generating {out_path} for: {text_ar} (tts_text: {tts_text})')
        try:
            tts = gTTS(tts_text, lang='ar')
            tts.save(str(out_path))
            generated += 1
        except Exception as exc:
            print(f'Failed to generate {wid}:', exc)
        time.sleep(0.06)

    print(f'Generated {generated} file(s)')


def main() -> None:
    args = parse_args()
    out_dir = Path(args.out)
    seed_path = Path(args.seed)

    words = load_seed(seed_path)

    if args.dry_run:
        selected = select_words(words, args)
        print(f'Dry run: {len(selected)} target id(s)')
        for word in selected:
            print(word.get('id'))
        sys.exit(0)

    if args.manifest_only:
        out_dir.mkdir(parents=True, exist_ok=True)
        entries = scan_existing(out_dir, words)
        write_manifest(out_dir, entries, args.sample_rate)
        sys.exit(0)

    selected = select_words(words, args)
    if not selected:
        print('No target ids selected; nothing to generate.')
        out_dir.mkdir(parents=True, exist_ok=True)
        write_manifest(out_dir, scan_existing(out_dir, words), args.sample_rate)
        sys.exit(0)

    generate_with_gtts(out_dir, selected, args.force, getattr(args, 'add_final_sukun', False))
    out_dir.mkdir(parents=True, exist_ok=True)
    write_manifest(out_dir, scan_existing(out_dir, words), args.sample_rate)


if __name__ == '__main__':
    main()
