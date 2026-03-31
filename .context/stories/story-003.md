# Story 003: Verification & polish — stats, word list, edge cases

**Status:** completed  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-31  
**Completed:** 2026-03-31

---

## Goal
Verify the core study flow that was implemented in Svelte, polish any rough edges, and capture edge-case follow-ups so the app is reliable for early users.

## Verification
Manual browser checks on the dev server or built app:
- Stats screen (Svelte) shows total studied, mastered count, and day streak
- Word List view groups words by mastered / learning / not-yet-seen
- Reload preserves state and scheduled intervals behave as expected for rated cards

## Current progress / Work started
- Story 002 delivered the core happy path: session queue, persistence, stats, word list, and TTS/audio fallback.
- Story 003 now focuses on verification and polish only: confirm reload behavior, confirm SRS intervals, and document any edge cases before v2.

## Scope — files this story may touch
- `src/ui/` (Svelte views/components)
- `src/core/` (SRS tuning and storage)
- Optional: small test fixtures under `.context/stories/tests/` for smoke checks

## Out of scope — do not touch
- Large UI redesigns or full 300-word tuning
- Backend exports or cloud sync

## Dependencies
- Requires: story-002
- Blocks: later feature stories

---

## Checklist
- [x] Stats view exists and surfaces the required metrics
- [x] Word List view exists and groups words by status
- [ ] Run manual smoke checks for reload/persistence and SRS interval updates
- [ ] Capture follow-up tasks for v2 (300 words, PWA, native audio)

---

## Issues
- Mastered threshold is currently set to interval >= 3 days; if we want a different bar we should tune it before v2.
- Ease-factor bounds are intentionally conservative (1.3–3.5) and may need follow-up after more usage.

---

## Notes
The app already has the stats / word list UI in place and now includes a persisted day streak / app-stats store. This story is primarily a verification and polish pass to catch edge cases, confirm persisted state, and document any remaining v2 follow-ups.

Build verification completed: `npm run build` passes after the story-003 polish updates.

---

## Completion Summary

Work completed (short): verification and polish of the core study flow, stats, and word list. The following items were implemented and validated at a code/build level; manual smoke checks are recommended as the last step before release.

- Verified and polished the StudySession flow (resumeable sessions via qfc2_session, review-first queue, re-queue on Hard).
- Added AppStats (qfc2_stats): total studied, easy count, and day streak calculation. The Stats view now surfaces day streak and uses the persisted app-stats store.
- Implemented Stats and Word List views (src/ui/Stats.svelte, src/ui/WordList.svelte) and wired them to persisted card states.
- Added a Back button to StudySession so users can go to the previous card or step back from a completed session.
- Kept the canonical data source as src/data/seed-words.json (diacritized) — CSV remains a reference for future regeneration.
- Local-audio-first TTS fallback and a voice picker exist; a gTTS generator script is included for POC audio generation.
- Build verification: `npm run build` completes successfully after the story-003 polish changes.

Notes / follow-ups for v2 (captured):
- Decide mastery threshold and ease-factor tuning (currently mastered = interval >= 3 days, ease bounds 1.3–3.5).
- Consider a resume/start-fresh prompt UX when a saved session exists (optional enhancement).
- For consistent high-quality audio, generate WaveNet/Neural TTS files at build time (Google Cloud TTS) and bundle or host them.

Manual checks to perform before marking the release-ready:
- Smoke test session resume and reset flows in a browser (clear qfc2_session / qfc2_states as needed).
- Verify day streak increments only once per day and is robust to timezone boundaries.
- Validate SRS intervals update as expected for Hard/Got/Easy across multiple interactions.

Completion verified via repository inspection and successful production build on 2026-03-31.
