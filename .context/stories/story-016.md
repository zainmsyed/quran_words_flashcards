# Story 016: Study session quota engine — cap sessions at 15 cards with 10 new / 5 review mix

**Status:** in-progress  
**Created:** 2026-04-16  
**Last accessed:** 2026-04-16  
**Completed:**  

## Goal
Update the study-session planner so each session contains at most 15 cards total, targets 10 new words plus up to 5 due reviews when possible, uses all available new words when fewer than 10 exist, and always chooses the oldest due reviews first.

## Verification
Run the session-planning tests on a representative mixed deck and confirm the generated queue never exceeds 15 cards, uses all available new words when fewer than 10 are available, and selects the oldest due reviews first.

## Scope
- src/core/session.ts
- src/ui/StudySession.svelte (only if labels or summary copy need to reflect the new quota rules)
- scripts/run-tests.mjs or targeted test helpers

## Out of scope
- Auth, account, or PocketBase behavior
- SRS interval math changes beyond session composition
- Audio/TTS behavior
- New decks or content expansion

## Dependencies
- None

## Checklist
- [ ] Update the session planner to enforce the 15-card cap and the 10-new / up-to-5-review target when possible.
- [ ] Select due reviews oldest-first, then randomize the final queue order while preserving the quota rules.
- [ ] Adjust StudySession labels or summary copy if needed so the UI reflects the new session sizing rules.
- [ ] Add or update tests covering decks with 0, 1-4, 5-9, and 10+ new words plus due reviews.
- [ ] Verify a representative mixed deck produces a session with the expected card counts and no more than 15 total.

## Issues
- None yet.

## Completion Summary
- Not started.
