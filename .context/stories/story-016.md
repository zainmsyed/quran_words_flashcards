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
- [x] Update the session planner to enforce the 15-card cap and the 10-new / up-to-5-review target when possible.
  - Implemented: src/core/session.ts updated to enforce the quota rules and selection logic; uses manifest-driven selection for reviews where applicable and assigns card modes via pickSessionMode(random). Committed to branch feature/study-flow.
- [x] Select due reviews oldest-first, then randomize the final queue order while preserving the quota rules.
  - Implemented: due reviews are ordered by dueDate (oldest-first) and selection is oldest-first; the final combined queue is randomized (Fisher–Yates) using the provided random() function.
- [x] Adjust StudySession labels or summary copy if needed so the UI reflects the new session sizing rules.
  - Implemented: src/ui/StudySession.svelte updated to display a session quota hint (quotaText) with aria-live so users see the 15-card quota and the new/review breakdown in-session. Changes committed to branch feature/study-flow.
- [x] Add or update tests covering decks with 0, 1-4, 5-9, and 10+ new words plus due reviews.
  - Implemented: scripts/run-tests.mjs updated to validate session composition across sample decks and saved-session handling. Local test runs passed.
- [x] Verify a representative mixed deck produces a session with the expected card counts and no more than 15 total.
  - Implemented: verified via updated unit tests and local npm test run (12 tests passed locally).

## Issues
- None at code level. Remaining non-blocking follow-ups: additional integration cross-browser checks for any UI messaging, and further edge-case tests (e.g., very large decks, randomized stability checks).

## Completion Summary
- Implemented the session-quota engine inside src/core/session.ts. Key behaviors:
  - Sessions are capped at 15 total cards.
  - Prefer 10 new words (configurable via limits) and up to 5 reviews when available.
  - Use all available new words when fewer than 10 exist, and fill remaining slots with the oldest due reviews first.
  - If no reviews are available, cap sessions at the new-word limit (default 10).
  - Final queue is randomized while preserving the quota rules; card modes are set via pickSessionMode(random).
- Tests updated in scripts/run-tests.mjs to assert composition and saved-session behavior. Local test run reported all tests passing.
- UI: StudySession shows a session quota hint under the progress card (aria-live) summarizing the 10-new / up-to-5-review quota and edge-case messages when reviews or new words are absent. Changes committed to branch feature/study-flow.

Next steps (optional)
- Add additional integration or e2e tests to simulate full-session behavior including re-queueing of hard cards and cross-browser playback/interaction checks.
- Prepare a PR for review/merge when you’re ready.

**Status remains in-progress.**
