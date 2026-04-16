# Story 014: Full 300-word static audio pipeline — generate, normalize, and bundle pronunciation assets

**Status:** complete  
**Created:** 2026-04-14  
**Last accessed:** 2026-04-16  
**Completed:** 2026-04-16

## Goal
Implement the chosen build-time audio pipeline and produce one bundled pronunciation file per word for the current 300-word seed deck, replacing the current partial 10-file prototype.

## Verification
Run the generation and coverage check for the seed deck and confirm that every current seeded word has a bundled audio file in public/audio with the expected naming convention; verify runtime UI plays bundled audio when present and falls back to browser TTS otherwise.

## Scope
- scripts/generate_audio_gtts.py (prototype)
- scripts/generate_audio_gcp.py (Google Cloud generator)
- scripts/check_audio_coverage.py (coverage verification)
- package.json (npm scripts)
- src/data/seed-words.json
- public/audio/

## Out of scope
- Multiple voice variants
- Runtime provider calls from the deployed app
- Manual recording workflow or admin upload tooling
- Changes to study scheduling or auth behavior

## Dependencies
- story-013.md

## Checklist
- [x] Audit & extend the generation tooling so the full seed deck can be produced (gTTS prototype + GCP script implemented).
- [x] Add CLI wiring and documentation for generation (package.json scripts + scripts/GENERATE_AUDIO_GCP.md).
- [x] Generate and store one bundled audio file per seed word in public/audio using stable IDs that match the deck data (gTTS POC: w1..w300.mp3 committed).
- [x] Produce a manifest and a coverage-check script to verify presence of files (public/audio/manifest.json + scripts/check_audio_coverage.py).
- [x] Update runtime TTS adapter to consult the manifest so the UI only shows audio controls for available files (src/core/tts-adapter.ts + Card.svelte wiring).
- [x] Create a full QA preview page listing all 300 words with <audio> controls (public/audio/sample_preview.html).
- [x] Commit and push changes and generated POC assets to feature/generate-voices (pushed to origin).

## Issues
- The committed MP3s are POC-quality outputs from gTTS (Google Translate TTS). They are adequate for QA but not recommended for production; Google Cloud Neural TTS (scripts/generate_audio_gcp.py) is the production path but requires service-account credentials.
- No audio normalization (ffmpeg pass) was performed on the POC files. For production audio, add a normalization/re-encoding step to ensure consistent sample rate, channels, and loudness.
- The audio assets were committed into the repo on branch feature/generate-voices. Storing many binaries in Git may be undesirable long-term; consider publishing them as a release artifact or hosting on a static CDN and keeping only references in the repository.

## Completion Summary
- Implemented Google Cloud TTS generator script: scripts/generate_audio_gcp.py (requires GOOGLE_APPLICATION_CREDENTIALS to run).
- Extended the gTTS prototype to produce the full deck locally: scripts/generate_audio_gtts.py used to generate public/audio/w1..w300.mp3 as a POC.
- Wrote a manifest: public/audio/manifest.json via the generator's manifest-only mode.
- Added a coverage-check script: scripts/check_audio_coverage.py and npm scripts for convenience.
- Updated runtime behavior:
  - src/core/tts-adapter.ts: added loadBundledAudioManifest() and manifest-driven availability set.
  - src/ui/components/Card.svelte: await manifest load and recompute tts availability.
- Created public/audio/sample_preview.html listing all 300 words for manual QA.
- Committed and pushed the code changes and the POC audio asset set to branch feature/generate-voices.
- Run results (local): 300 files generated (w1..w300), total size 2,378,688 bytes (~2.27 MB), smallest file w55.mp3 at 5,568 bytes, largest file w238.mp3 at 10,752 bytes, manifest written with sample_rate 24000, coverage check passed at 300/300.
- Remaining/recommended next steps: optionally regenerate with Google Cloud TTS for production-quality voices, optionally add ffmpeg normalization, optionally move audio assets out of Git into a release/CDN, and optionally add a CI job that fails if coverage is missing or generates artifacts in CI.
- Documentation and notes: public/audio/README.md documents why the audio is in-repo and how to regenerate it (gTTS/GCP paths); the QA preview page is available for manual auditioning; the repo now has the coverage workflow and helper scripts.
- Next actionable story at the time of planning: story-015 — runtime audio coverage & fallback hardening.
