#!/usr/bin/env python3
"""
Check that every seed word from src/data/seed-words.json has a corresponding
bundled audio file according to public/audio/manifest.json (or by file presence).

Usage:
  python3 scripts/check_audio_coverage.py
  python3 scripts/check_audio_coverage.py --manifest public/audio/manifest.json --seed src/data/seed-words.json

Exit codes:
  0 = all audio files present
  2 = invalid input / missing seed file
  3 = missing audio files detected
"""

import argparse
import json
import sys
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description="Check audio coverage for seed deck")
    p.add_argument("--manifest", default="public/audio/manifest.json", help="Path to audio manifest (optional)")
    p.add_argument("--seed", default="src/data/seed-words.json", help="Path to seed words JSON file")
    p.add_argument("--audio-dir", default="public/audio", help="Directory where audio files live (used as fallback)")
    p.add_argument("--quiet", action="store_true", help="Only return exit code, minimal output")
    return p.parse_args()


def load_seed_ids(seed_path: Path):
    if not seed_path.exists():
        print(f"Seed file not found: {seed_path}")
        sys.exit(2)
    try:
        with seed_path.open('r', encoding='utf-8') as fh:
            data = json.load(fh)
            if not isinstance(data, list):
                print("Seed file must be a JSON array of words")
                sys.exit(2)
            ids = [w.get('id') for w in data if isinstance(w, dict) and w.get('id')]
            return ids
    except Exception as e:
        print("Failed to read seed file:", e)
        sys.exit(2)


def load_manifest(manifest_path: Path):
    if not manifest_path.exists():
        return None
    try:
        with manifest_path.open('r', encoding='utf-8') as fh:
            m = json.load(fh)
            if m and isinstance(m, dict) and isinstance(m.get('entries'), list):
                entries = {e.get('id'): e for e in m.get('entries') if isinstance(e, dict) and e.get('id')}
                return entries
            return None
    except Exception:
        return None


def main():
    args = parse_args()
    seed_path = Path(args.seed)
    manifest_path = Path(args.manifest)
    audio_dir = Path(args.audio_dir)

    seed_ids = load_seed_ids(seed_path)
    total = len(seed_ids)

    manifest_entries = load_manifest(manifest_path)

    missing = []
    present = []

    for wid in seed_ids:
        expected_file = audio_dir / f"{wid}.mp3"
        ok = False
        # Prefer manifest if available
        if manifest_entries is not None:
            entry = manifest_entries.get(wid)
            if entry and entry.get('exists'):
                # double-check file exists when possible
                if expected_file.exists():
                    ok = True
                else:
                    # manifest says exists but file not found; treat as missing
                    ok = False
            else:
                ok = False
        else:
            # manifest not available; check file directly
            if expected_file.exists():
                ok = True
        if ok:
            present.append(wid)
        else:
            missing.append(wid)

    found = len(present)
    missing_count = len(missing)

    if not args.quiet:
        print(f"Seed words: {total}")
        print(f"Found audio files: {found}")
        print(f"Missing audio files: {missing_count}")
        if missing_count > 0:
            print('\nMissing IDs:')
            for w in missing:
                print('  ', w)

    if missing_count > 0:
        print("\nCoverage check failed: missing audio files detected")
        sys.exit(3)

    if not args.quiet:
        print("\nCoverage check passed: all seed words have audio files")
    sys.exit(0)


if __name__ == '__main__':
    main()
