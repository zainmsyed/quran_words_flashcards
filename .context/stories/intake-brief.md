# Intake Brief

**Last updated:** 2026-04-14

## Planning brief
Expand Arabic pronunciation coverage from the current 10 generated files to the full current 300-word seed deck. Prefer one bundled static pronunciation file per word so the deployed app can serve audio without runtime VPS work and without relying on inconsistent browser Arabic voices. Build-time use of an external service is acceptable if it produces a better long-term pipeline. Keep browser speech only as a fallback when a bundled file is missing or fails to play.

## Source files
- .context/intake/dictionaries/quran_300_words.csv (11519 bytes)
- .context/intake/prd/quranic-flashcards-auth-addon.md (18094 bytes)
- .context/intake/prd/quranic-flashcards-prd.md (4170 bytes)
- .context/intake/references/background_pattern compressed.webp (33994 bytes)
- .context/intake/references/haus_archive/DESIGN.md (6264 bytes)
- .context/intake/references/maktaba_bold_manifesto/code.html (10106 bytes)
- .context/intake/references/maktaba_bold_manifesto/screen.png (119201 bytes)
- .context/intake/references/maktaba_login/code.html (10556 bytes)
- .context/intake/references/maktaba_login/screen.png (125728 bytes)
- .context/intake/references/maktaba_stats/code.html (14433 bytes)
- .context/intake/references/maktaba_stats/screen.png (82362 bytes)
- .context/intake/references/maktaba_word_list/code.html (17124 bytes)
- .context/intake/references/maktaba_word_list/screen.png (49495 bytes)
- .context/intake/references/staatliche_bold/DESIGN.md (5691 bytes)
- .context/intake/references/stitch_bauhaus_circle_design/DESIGN.md (6264 bytes)
- .context/intake/references/stitch_bauhaus_circle_design/screen.png (28 bytes)

## Distilled notes
- Primary users for this scope: a small invited group of learners, general Quran learners, and Arabic beginners.
- Audio scope is limited to the current 300 seeded words.
- Default direction: bundled static audio files committed to the repo and deployed with the app.
- Runtime browser speech remains allowed only as a fallback when static audio is missing or playback fails.
- One pronunciation per word only; no multiple voice options in v1.
- Build-time use of an external TTS provider is acceptable.
- The current Python gTTS script is only a prototype and can be replaced.
- Add a decision story first to choose the best provider and output format before standardizing the pipeline.
- Priority order for tradeoffs:
  1. Minimal VPS/server resource usage
  2. Better pronunciation quality
  3. Fast playback/loading
  4. Small total storage size
- Offline playback is only a stretch benefit if it falls out naturally from bundled static assets; do not add separate PWA/offline-cache work in this replan.
- Explicitly out of scope for this v1 audio expansion:
  - multiple voices per word
  - per-user voice selection for bundled audio
  - runtime cloud TTS requests
  - manual recording workflow
  - admin upload tools
  - waveform or audio-debug UI

## Planning rules
- Treat intake files as raw planning inputs, not permanent system rules.
- Ask only delta questions after reviewing this brief and any raw files you actually need.
- Surface contradictions instead of resolving them silently.
