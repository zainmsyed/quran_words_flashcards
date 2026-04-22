#!/usr/bin/env python3
"""
Regenerate flagged mispronunciation MP3s using an automatic diacritizer (if available) + gTTS.

- Creates diacritized text for the target words (best-effort) using camel_tools if installed.
- Generates MP3s via gTTS and writes them to public/audio/<id>.mp3
- Refreshes public/audio/manifest.json and regenerates the review preview page.

Usage:
  python3 scripts/regenerate_review_gtts.py --review-file .context/reviews/mispronunciations.md --count 6 --force
  python3 scripts/regenerate_review_gtts.py --ids w12,w100 --force

This script is intended to be run inside a venv where camel-tools and gTTS are installed.
"""

from __future__ import annotations
import argparse
import importlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional


def parse_args():
    p = argparse.ArgumentParser(description='Regenerate review IDs with optional diacritization + gTTS')
    p.add_argument('--review-file', default='.context/reviews/mispronunciations.md', help='Markdown review table to read ids from')
    p.add_argument('--ids', default=None, help='Comma-separated ids to regenerate (e.g. w12,w100)')
    p.add_argument('--count', default=6, type=int, help='How many IDs from the review file to select (default 6)')
    p.add_argument('--out', default='public/audio', help='Output audio dir')
    p.add_argument('--seed', default='src/data/seed-words.json', help='Path to seed words JSON')
    p.add_argument('--force', action='store_true', help='Overwrite existing files')
    return p.parse_args()


def load_seed(seed_path: Path):
    if not seed_path.exists():
        print('seed file not found:', seed_path)
        sys.exit(2)
    try:
        with seed_path.open('r', encoding='utf-8') as fh:
            return json.load(fh)
    except Exception as e:
        print('failed to read seed file:', e)
        sys.exit(2)


def parse_review_ids(review_path: Path) -> List[str]:
    if not review_path.exists():
        print('review file not found:', review_path)
        return []
    raw = review_path.read_text(encoding='utf-8')
    ids = []
    seen = set()
    for line in raw.splitlines():
        m = re.match(r'^\|\s*(w\d+)\s*\|', line, flags=re.IGNORECASE)
        if not m:
            continue
        wid = m.group(1).strip()
        if wid and wid not in seen:
            seen.add(wid)
            ids.append(wid)
    return ids


# Best-effort dynamic diacritizer discovery. Attempts to find a camel_tools diacritizer
# or other accessible diacritization callable. Returns diacritized string or None.
def try_diacritize_with_camel_tools(text: str) -> Optional[str]:
    try:
        import camel_tools
    except Exception:
        return None

    # Search submodules for names containing 'diacrit'
    try:
        import pkgutil
        pkg_path = camel_tools.__path__
        for finder, name, ispkg in pkgutil.iter_modules(pkg_path):
            lname = name.lower()
            if 'diacrit' in lname or 'diac' in lname:
                mod_name = f'camel_tools.{name}'
                try:
                    mod = importlib.import_module(mod_name)
                except Exception:
                    continue
                # common candidate function names
                if hasattr(mod, 'diacritize') and callable(getattr(mod, 'diacritize')):
                    try:
                        return mod.diacritize(text)
                    except Exception:
                        continue
                # search for any callable member with diacrit in name
                for attr in dir(mod):
                    if 'diacrit' in attr.lower() or 'diac' in attr.lower():
                        obj = getattr(mod, attr)
                        if callable(obj):
                            try:
                                out = obj(text)
                                if isinstance(out, str) and out.strip():
                                    return out
                            except Exception:
                                pass
                        # class candidate
                        if isinstance(obj, type):
                            try:
                                inst = obj()
                                if hasattr(inst, 'diacritize') and callable(getattr(inst, 'diacritize')):
                                    try:
                                        out = inst.diacritize(text)
                                        if isinstance(out, str) and out.strip():
                                            return out
                                    except Exception:
                                        pass
                            except Exception:
                                pass
    except Exception:
        return None

    # fallback: try top-level camel_tools.diacritize if present
    try:
        if hasattr(camel_tools, 'diacritize') and callable(getattr(camel_tools, 'diacritize')):
            return camel_tools.diacritize(text)
    except Exception:
        pass

    return None


def simple_best_effort_diacritize(text: str) -> str:
    # Very small heuristic: fill common short particles and mark final short vowels for short tokens.
    # This is a very imperfect fallback but helps TTS a little on tiny words like 'li', 'fi', 'min'.
    tokens = text.split()
    out_tokens = []
    mapping = {
        'لِ': 'لِ',
        'مِنْ': 'مِنْ',
        'مِن': 'مِنْ',
        'فِي': 'فِي',
        'في': 'فِي',
        'لا': 'لَا',
        'لاْ': 'لَا',
    }
    for t in tokens:
        if t in mapping:
            out_tokens.append(mapping[t])
        else:
            out_tokens.append(t)
    return ' '.join(out_tokens)


def generate_mp3(arabic_text: str, out_path: Path, force: bool):
    try:
        from gtts import gTTS
    except Exception as e:
        print('gTTS not installed in the venv. Install with: pip install gTTS')
        sys.exit(3)

    if out_path.exists() and not force:
        print(out_path, 'already exists — skipping')
        return False

    try:
        tts = gTTS(arabic_text, lang='ar')
        out_path.parent.mkdir(parents=True, exist_ok=True)
        tts.save(str(out_path))
        print('Wrote', out_path)
        return True
    except Exception as e:
        print('Failed to generate', out_path, e)
        return False


def main():
    args = parse_args()
    repo = Path.cwd()
    seed = load_seed(repo / args.seed)
    seed_lookup = {str(w.get('id')): w for w in seed if isinstance(w, dict) and w.get('id')}

    if args.ids:
        ids = [i.strip() for i in args.ids.split(',') if i.strip()]
    else:
        review_ids = parse_review_ids(Path(args.review_file))
        ids = review_ids[: args.count]

    if not ids:
        print('No target ids found. Exiting.')
        sys.exit(0)

    print('Target ids:', ', '.join(ids))

    # attempt to load a diacritizer
    diacritizer_available = False
    try:
        import camel_tools  # type: ignore
        diacritizer_available = True
        print('camel_tools detected — will attempt automatic diacritization')
    except Exception:
        diacritizer_available = False
        print('camel_tools not available — falling back to a small heuristic diacritizer')

    out_dir = Path(args.out)
    generated = []
    for wid in ids:
        w = seed_lookup.get(wid)
        if not w:
            print('Missing seed entry for', wid)
            continue
        arabic = str(w.get('arabic') or '').strip()
        if not arabic:
            print('No Arabic text for', wid, '- skipping')
            continue

        text_to_say = arabic
        diacritized = None
        if diacritizer_available:
            try:
                diacritized = try_diacritize_with_camel_tools(arabic)
                if diacritized:
                    text_to_say = diacritized
                    print(f'{wid}: diacritized via camel_tools -> {diacritized}')
                else:
                    print(f'{wid}: camel_tools present but no diacritizer callable found; using heuristic')
            except Exception as e:
                print('diacritizer error for', wid, e)
                diacritized = None

        if not diacritized:
            text_to_say = simple_best_effort_diacritize(arabic)
            print(f'{wid}: using heuristic diacritization -> {text_to_say}')

        out_path = out_dir / f'{wid}.mp3'
        ok = generate_mp3(text_to_say, out_path, args.force)
        if ok:
            generated.append(wid)

    # refresh manifest using the manifest-only mode of the main generator
    try:
        subprocess.check_call([sys.executable, str(Path('scripts/generate_audio_gtts.py')), '--manifest-only'], cwd=repo)
        print('Manifest refreshed')
    except Exception as e:
        print('Failed to refresh manifest:', e)

    # regenerate the review preview page
    try:
        subprocess.check_call(['node', str(Path('scripts/generate_sample_preview.mjs')), '--review-file', args.review_file, '--out', 'public/audio/mispronunciations_preview.html'], cwd=repo)
        print('Preview regenerated: public/audio/mispronunciations_preview.html')
    except Exception as e:
        print('Failed to regenerate preview page:', e)

    print('Done. Generated ids:', ', '.join(generated))


if __name__ == '__main__':
    main()
