#!/usr/bin/env python3
"""
Generate MP3 pronunciation files for the seed deck using Google Cloud Text-to-Speech.

Usage examples:
  # generate a small sample (first 10 words) for review
  python3 scripts/generate_audio_gcp.py --out public/audio --sample 10 --voice "ar-XA-Neural-B"

  # generate the full deck (requires GOOGLE_APPLICATION_CREDENTIALS)
  python3 scripts/generate_audio_gcp.py --out public/audio

Notes:
- Requires a Google Cloud service account with access to Text-to-Speech. Set
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json in the environment before running.
- This script is idempotent by default: it will skip files that already exist unless
  you pass --force.
- The script writes a manifest.json file in the output directory describing
  available files and their byte sizes.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict


def parse_args():
    p = argparse.ArgumentParser(description="Generate MP3s for the seed deck using Google Cloud TTS")
    p.add_argument("--out", default="public/audio", help="Output directory for generated audio files")
    p.add_argument("--voice", default="ar-XA-Neural-B", help="Preferred Google Cloud voice name (optional)")
    p.add_argument("--sample-rate", default=24000, type=int, help="Target sample rate in Hz (default 24000)")
    p.add_argument("--sample", default=0, type=int, help="Only generate the first N words (0 = all)")
    p.add_argument("--ids", default=None, help="Comma-separated list of word ids to generate (e.g. w1,w3,w12)")
    p.add_argument("--force", action="store_true", help="Overwrite existing files")
    p.add_argument("--manifest-only", action="store_true", help="Only scan existing files and write manifest.json")
    p.add_argument("--seed", default="src/data/seed-words.json", help="Path to the seed words JSON file")
    p.add_argument("--add-final-sukun", action="store_true", help="Append Arabic SUKUN (U+0652) to the final letter if it has no diacritic; only used for TTS text (does not modify the seed file)")
    return p.parse_args()


def load_seed(seed_path: Path) -> List[Dict]:
    if not seed_path.exists():
        print(f"Seed file not found: {seed_path}")
        sys.exit(2)
    try:
        with seed_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
            if not isinstance(data, list):
                raise ValueError("seed file must be a JSON array")
            return data
    except Exception as e:
        print("Failed to read seed file:", e)
        sys.exit(2)


def write_manifest(out_dir: Path, entries: List[Dict], provider: str, voice: str, sample_rate: int):
    manifest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "provider": provider,
        "voice": voice,
        "sample_rate": sample_rate,
        "entries": entries,
    }
    dst = out_dir / "manifest.json"
    try:
        with dst.open("w", encoding="utf-8") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)
        print("Wrote manifest:", dst)
    except Exception as e:
        print("Failed to write manifest:", e)


def scan_existing(out_dir: Path, words: List[Dict]) -> List[Dict]:
    entries = []
    for w in words:
        wid = w.get("id")
        if not wid:
            continue
        fname = f"{wid}.mp3"
        fpath = out_dir / fname
        exists = fpath.exists()
        size = None
        if exists:
            try:
                size = fpath.stat().st_size
            except Exception:
                size = None
        entries.append({"id": wid, "filename": fname, "bytes": size, "exists": exists})
    return entries


def _is_combining(cp: int) -> bool:
    return (0x0610 <= cp <= 0x061A) or (0x064B <= cp <= 0x065F) or (0x06D6 <= cp <= 0x06ED)


def _ensure_final_sukun(text: str) -> str:
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
    for ch in last:
        if _is_combining(ord(ch)):
            return s
    return s + '\u0652'


def generate_with_gcp(out_dir: Path, words: List[Dict], voice_name: str, sample_rate: int, force: bool, add_final_sukun: bool):
    try:
        from google.cloud import texttospeech
    except Exception as e:
        print("Missing dependency: google-cloud-texttospeech")
        print("Install with: pip install google-cloud-texttospeech")
        sys.exit(3)

    client = texttospeech.TextToSpeechClient()

    provider = "gcp"
    entries = []
    total = 0
    for w in words:
        wid = w.get("id")
        text_ar = w.get("arabic")
        if not wid or not text_ar:
            continue
        # produce the TTS-only text variant when requested
        tts_text = _ensure_final_sukun(text_ar) if add_final_sukun else text_ar
        fname = f"{wid}.mp3"
        out_path = out_dir / fname
        if out_path.exists() and not force:
            size = out_path.stat().st_size
            entries.append({"id": wid, "filename": fname, "bytes": size})
            print(out_path, "already exists — skipping")
            continue

        print(f"Generating {out_path} for: {text_ar} (tts_text: {tts_text})")
        synthesis_input = texttospeech.SynthesisInput(text=tts_text)
        # voice selection: prefer the explicit voice name; fall back to language-only selection
        voice = texttospeech.VoiceSelectionParams(language_code="ar-XA", name=voice_name)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3, sample_rate_hertz=sample_rate)

        try:
            response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with out_path.open("wb") as fh:
                fh.write(response.audio_content)
            size = out_path.stat().st_size
            entries.append({"id": wid, "filename": fname, "bytes": size})
            total += 1
            # small pause to be polite to the API
            time.sleep(0.06)
        except Exception as e:
            print(f"Failed to generate {wid}:", e)
    print(f"Generated {total} files")
    return provider, entries


def main():
    args = parse_args()
    out_dir = Path(args.out)
    seed_path = Path(args.seed)
    out_dir.mkdir(parents=True, exist_ok=True)

    words = load_seed(seed_path)

    # filter by ids if requested
    if args.ids:
        wanted = set([i.strip() for i in args.ids.split(",") if i.strip()])
        words = [w for w in words if w.get("id") in wanted]

    # sample top-N
    if args.sample and args.sample > 0:
        words = words[: args.sample]

    if args.manifest_only:
        entries = scan_existing(out_dir, words)
        write_manifest(out_dir, entries, provider="none", voice=args.voice, sample_rate=args.sample_rate)
        sys.exit(0)

    # generate using Google Cloud TTS
    provider, entries = generate_with_gcp(out_dir, words, args.voice, args.sample_rate, args.force, getattr(args, 'add_final_sukun', False))
    write_manifest(out_dir, entries, provider=provider, voice=args.voice, sample_rate=args.sample_rate)


if __name__ == "__main__":
    main()
