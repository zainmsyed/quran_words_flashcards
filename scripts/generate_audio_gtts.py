#!/usr/bin/env python3
"""
POC: generate short Arabic TTS audio files for the seed words using gTTS (Google Translate TTS).
Usage: python3 scripts/generate_audio_gtts.py [count]
Generates public/audio/w<id>.mp3 for the first `count` words (default 10).

Note: This uses the unofficial Google Translate TTS service via gTTS. It's fine for a quick POC
but for production-quality consistent audio you should use a cloud TTS API (Google Cloud TTS,
Amazon Polly, Azure Neural TTS) or pre-recorded audio.
"""

import sys
import json
import os
from pathlib import Path

try:
    from gtts import gTTS
except Exception as e:
    print('gTTS not installed. Install with: pip install gTTS')
    raise

SEED = Path('src/data/seed-words.json')
OUT_DIR = Path('public/audio')

COUNT = 10
if len(sys.argv) > 1:
    try:
        COUNT = int(sys.argv[1])
    except:
        pass

OUT_DIR.mkdir(parents=True, exist_ok=True)

with SEED.open('r', encoding='utf-8') as f:
    data = json.load(f)

words = data[:COUNT]
for w in words:
    wid = w.get('id')
    text_ar = w.get('arabic')
    if not wid or not text_ar:
        continue
    out_path = OUT_DIR / f"{wid}.mp3"
    if out_path.exists():
        print(out_path, 'already exists — skipping')
        continue
    print('Generating', out_path, 'for', text_ar)
    try:
        tts = gTTS(text_ar, lang='ar')
        tts.save(str(out_path))
    except Exception as e:
        print('Failed to generate', wid, e)

print('Done')
