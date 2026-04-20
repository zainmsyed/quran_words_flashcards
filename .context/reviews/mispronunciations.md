# Mispronunciations / audio issues (running list)

This file is a running checklist of seed words whose bundled audio sounds incorrect or unnatural. Use it while listening through public/audio/sample_preview.html or by opening individual files at /audio/<id>.mp3.

How to use
- Play the preview page locally:
  - Serve the public directory: `python3 -m http.server --directory public 8000`
  - Open: http://localhost:8000/audio/sample_preview.html
  - (Or: `cd public/audio && python3 -m http.server 8000` and open http://localhost:8000/sample_preview.html)
- When you find a problematic file, add a row to the table below with as much detail as you can.
- Suggested fixes:
  - Regenerate with Google Cloud TTS (preferred for quality):
    - `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"`
    - `python3 scripts/generate_audio_gcp.py --out public/audio --ids w12,w100 --force`
    - The script will update `public/audio/manifest.json` when it writes files.
  - Quick one-offs with gTTS (lower quality): `python3 scripts/generate_audio_gtts.py <count>` or run a tiny gTTS snippet for a single id.
  - Replace with a manual/native recording and place the MP3 at `public/audio/<id>.mp3`.
- After replacing files: regenerate or update the manifest (`--manifest-only`) and clear your browser cache to hear the new file.

Table columns
- id: word id (e.g. `w12`)
- arabic: visual Arabic string from `src/data/seed-words.json`
- transliteration: deck transliteration (helps confirm the word)
- audio: audio path (web path under /audio/)
- issue: short description of what's wrong (what you heard vs expected)
- suggested fix: e.g. `regen gcp ar-XA-Neural-B`, `re-record`, `add diacritics`
- reporter: who reported the issue
- date: YYYY-MM-DD

| id | arabic | transliteration | audio | issue | suggested fix | reporter | date |
|---|---:|---|---|---|---|---|---|
| w12 | لِ | li | /audio/w12.mp3 | vowel sounded too short; sounded like consonant only | regenerate with GCP (e.g. ar-XA-Neural-B) or re-record; consider adding diacritics | you | 2026-04-20 |
| w100 | الدُّنْيَا | al-dunyā | /audio/w100.mp3 | final vowel feels clipped and the yā' lacks emphasis | regenerate with GCP and try a different voice or higher sample_rate; compare manual recording | you | 2026-04-20 |

Notes and tips
- If you plan to regenerate many files, prefer producing them as an artifact (release) rather than committing hundreds of MP3s directly to git.
- For very precise pronunciation (tajwīd / Qur'anic recitation), use manual/native recordings instead of TTS.
- If you'd like, I can also add a tiny CLI helper to append rows to this file or a small UI in the preview page to flag words while listening. Tell me which and I'll create it (I will not commit/push anything unless you ask).


| w35 | جَعَلَ | jaʿala | /audio/w35.mp3 | its saying Jala instead of Ja'ala | regen gcp | you | 2026-04-20 |

| w26 | قَوْم | qawm | /audio/w26.mp3 | its saying qawmul instead of qawm | regen gcp | you | 2026-04-20 |

| w40 | عَذَاب | ʿadhāb | /audio/w40.mp3 | adding a sound after adhab | regen gcp | you | 2026-04-20 |

| w59 | عِنْد | ʿinda | /audio/w59.mp3 | saying a completly differnt word | regen gcp | you | 2026-04-20 |

| w63 | سَبِيل | sabīl | /audio/w63.mp3 | sayinh sabilin instead of sabil | regen gcp | you | 2026-04-20 |

| w69 | إِلَه | ilāh | /audio/w69.mp3 | saying ilahun isntead of ilah | regen gcp | you | 2026-04-20 |
