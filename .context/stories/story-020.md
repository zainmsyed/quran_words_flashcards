# Story 020: Mispronunciation remediation — free gTTS pass, port 8001 preview, and still-wrong flags

**Status:** in-progress  
**Created:** 2026-04-20  
**Last accessed:** 2026-04-20  

## Goal
Use the free gTTS regeneration path for the words listed in `.context/reviews/mispronunciations.md`, then give reviewers a dedicated listening and flagging loop at `http://localhost:8001/audio/mispronunciations_preview.html` so only the updated pronunciations are auditioned and any remaining wrong files can be appended back into the existing review table as still wrong before we reevaluate whether the free route is good enough.

## Verification
Run the regeneration pass for the flagged IDs, start `node scripts/preview_flag_server.mjs`, open `http://localhost:8001/audio/mispronunciations_preview.html`, listen to the updated subset, and confirm that flagging a word that still sounds wrong appends a new row to `.context/reviews/mispronunciations.md` with wording that marks it as still wrong.

## Scope
- `.context/reviews/mispronunciations.md`
- `scripts/add_mispronunciation.mjs`
- `scripts/generate_audio_gtts.py`
- `scripts/generate_sample_preview.mjs`
- `scripts/preview_flag_server.mjs`
- `public/audio/mispronunciations_preview.html`
- `public/audio/sample_preview_flag.js`
- `public/audio/manifest.json`
- `public/audio/`
- `scripts/run-tests.mjs`

## Out of scope
- Google Cloud or other paid TTS providers
- Study-flow, SRS, auth, or PocketBase changes
- New bundled voices or runtime cloud TTS
- Replacing the existing review table with a new persistence system
- Changing the preview/flag server away from port 8001

## Dependencies
- story-015.md

## Checklist
- [x] Teach the free gTTS regeneration path to target the IDs listed in `.context/reviews/mispronunciations.md` and refresh those bundled audio files.
  - Implemented: `scripts/generate_audio_gtts.py` now supports `--review-file`, `--ids`, `--dry-run`, and manifest refresh so the free pass can target the review table directly and keep `public/audio/manifest.json` in sync.
- [x] Keep the listening and preview flow centered on `http://localhost:8001/audio/mispronunciations_preview.html` so the words listed in `.context/reviews/mispronunciations.md` can be auditioned in one place.
  - Implemented: `scripts/generate_sample_preview.mjs` now generates `public/audio/mispronunciations_preview.html` from the running review table and the page uses the shared flag helper in review mode.
- [x] Reword the flag action so reviewers can mark an item as still wrong and append that result back into the existing review table.
  - Implemented: `public/audio/sample_preview_flag.js` now shows a review-mode `Still wrong` action, sends `stillWrong` payloads, and falls back to `node scripts/add_mispronunciation.mjs --still-wrong`.
- [x] Add or update tests and smoke checks for the free regeneration path and the still-wrong flag append flow.
  - Implemented: `scripts/run-tests.mjs` now covers review-id dry runs, review-preview generation, duplicate still-wrong CLI appends, and the 8001 flag-server flow.
- [ ] Re-listen to the regenerated files and reevaluate whether the free route is good enough or whether we need a higher-quality provider later.

## Issues
- None yet.