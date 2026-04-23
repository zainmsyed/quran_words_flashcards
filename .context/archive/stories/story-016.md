# Story 016: Study session quota engine — cap sessions at 15 cards with 10 new / 5 review mix

**Status:** complete  
**Created:** 2026-04-16  
**Last accessed:** 2026-04-23  
**Completed:** 2026-04-18

## Goal
Update the study-session planner so each session contains at most 15 cards total, targets 10 new words plus up to 5 due reviews when a full new-card set is available, uses all available new words when fewer than 10 exist, fills the remaining slots with due reviews, and always chooses the oldest due reviews first.

## Verification
Run the session-planning tests on a representative mixed deck and confirm the generated queue never exceeds 15 cards, uses all available new words when fewer than 10 are available, and selects the oldest due reviews first.

## Scope — files this story may touch
- src/core/session.ts
- src/ui/StudySession.svelte (only if labels or summary copy need to reflect the new quota rules)
- scripts/run-tests.mjs or targeted test helpers

## Manual review follow-up scope — 2026-04-18
Requested explicitly by the user after whole-codebase review follow-ups. These changes are outside the original quota-engine acceptance criteria, but they are part of the current working tree alongside this story:
- src/core/progress-summary.ts
- src/ui/Stats.svelte
- src/core/tts-adapter.ts
- src/App.svelte
- src/core/pocketbase-auth.ts
- src/core/srs.ts
- .gitignore
- public/mastered/index.html (deleted from shipped assets)
- public/mstered/index.html (deleted from shipped assets)
- scripts/check-srs.mjs (deleted; superseded by `scripts/run-tests.mjs` coverage)
- .context/reviews/review-20260418-120239.md
- .context/reviews/review-20260418-123224.md

Tool-managed sync files such as `.context/memory/index.md`, `.context/reviews/summary.md`, and `.context/settings/jj-checkpoint-labels.json` may also appear in `git status`, but they are not maintained manually in this story.

## Out of scope — do not touch
- Auth, account, or PocketBase behavior
- SRS interval math changes beyond session composition
- New decks or content expansion

## Dependencies
- None

## Checklist
- [x] Update the session planner to enforce the 15-card cap and the 10-new / up-to-5-review target when possible.
  - Implemented: src/core/session.ts now caps sessions at 15 cards, uses up to 10 new words when available, and fills the remaining capacity with the oldest due reviews when the new-word pool is undersized.
- [x] Select due reviews oldest-first, then randomize the final queue order while preserving the quota rules.
  - Implemented: due reviews are sorted by dueDate before selection, quota selection happens from that oldest-first list, and the final combined queue is randomized with the provided `random()` function.
- [x] Adjust StudySession labels or summary copy if needed so the UI reflects the new session sizing rules.
  - Implemented: src/ui/StudySession.svelte keeps the new/review session badges in sync with the quota engine and updates the all-mastered overlay so it no longer offers a broken “Start new session” action.
- [x] Add or update tests covering decks with 0, 1-4, 5-9, and 10+ new words plus due reviews.
  - Implemented: scripts/run-tests.mjs now covers 0, 4, 7, 10, and 12-new-word mixes, no-review caps, oldest-review selection, mastered-card exclusion, and the shared due/mastery helper logic.
- [x] Verify a representative mixed deck produces a session with the expected card counts and no more than 15 total.
  - Implemented: verified via the quota-matrix tests plus an additional manual Node repro for a 6-new / 20-review deck; local test/build verification passed on 2026-04-18.

## Issues
- Manual review follow-up on 2026-04-18 also fixed Stats/TTS regressions outside the original story scope; those files are listed above so the working tree matches the story notes.
- Remaining non-blocking follow-up: browser-level verification for the updated all-mastered overlay CTA and the Stats due filter.

## Completion Summary
- Implemented the session-quota engine inside src/core/session.ts. Current behavior:
  - Sessions are capped at 15 total cards.
  - Prefer 10 new words when that many are available.
  - When fewer than 10 new words exist, use all of them and fill the remaining capacity with the oldest due reviews first.
  - If no due reviews are available, cap sessions at the new-word limit (default 10).
  - Final queue order is randomized only after the quota rules are satisfied; card modes are still assigned via `pickSessionMode(random)`.
- Tests in scripts/run-tests.mjs now cover the quota matrix, saved-session normalization, mastered-card exclusion, and the shared due/mastery helpers. Local `npm test` and `npm run build` passed on 2026-04-18.
- UI follow-up: the all-mastered overlay in StudySession now routes users to a meaningful next action instead of trying to rebuild an empty session.
- Manual review follow-up fixes also aligned the Stats due filter with the planner/summary logic and made bundled-audio manifest loading retry after transient failures.

Next steps (optional)
- Add additional integration or e2e tests to simulate full-session behavior including re-queueing of hard cards and browser-level verification for the all-mastered overlay flow.
- Prepare a PR for review/merge when you’re ready.

**Status remains in-progress.**
