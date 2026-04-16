# Story 014: Full 300-word static audio pipeline — generate, normalize, and bundle pronunciation assets

**Status:** in-progress  
**Created:** 2026-04-14  
**Last accessed:** 2026-04-15  
**Completed:**  

## Goal
Implement the chosen build-time audio pipeline and produce one bundled pronunciation file per word for the current 300-word seed deck, replacing the current partial 10-file prototype.

## Verification
Run the generation and coverage check for the seed deck and confirm that every current seeded word has a bundled audio file in public/audio with the expected naming convention.

## Scope
- scripts/generate_audio_gtts.py (or its replacement)
- scripts/
- package.json
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
- [x] Implement or replace the generation script so it can build pronunciation assets for the full current seed deck instead of just the first 10 words. (scripts/generate_audio_gcp.py added)
- [x] Add any required command/config wiring for the chosen provider and document the expected invocation path. (package.json scripts and scripts/GENERATE_AUDIO_GCP.md added)
- [ ] Generate and store one normalized bundled audio file per seed word in public/audio using stable IDs that match the deck data.
- [ ] Add a coverage check or manifest step that verifies there are no missing audio files for the current seed deck.
- [ ] Run the generation and coverage check and record the resulting asset count and any notable size/format observations.

## Issues
- Google Cloud generation cannot be executed in this environment without a service-account credential (GOOGLE_APPLICATION_CREDENTIALS). The generator script is present but requires credentials and network access to call the API. See scripts/GENERATE_AUDIO_GCP.md for step-by-step instructions to create a service account and run the script locally or in CI.
- A quick gTTS sample was generated earlier for the first 20 words (public/audio/w11.mp3 .. w20.mp3) and a preview page was written to public/audio/sample_preview.html for local auditioning. These samples are dev-quality and not identical to Google Cloud Neural voices.

## Completion Summary
- Implemented: scripts/generate_audio_gcp.py (Google Cloud TTS generator), package.json npm scripts (generate-audio, generate-audio:sample, generate-audio:manifest), and documentation at scripts/GENERATE_AUDIO_GCP.md describing credentials and usage.
- Remaining: run the generator locally or in CI with GOOGLE_APPLICATION_CREDENTIALS to produce the full 300-word MP3 set, then run the manifest coverage check and commit the generated assets in a single artifact commit.
