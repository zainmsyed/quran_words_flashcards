# Story 009: WordList & Stats restyle — list rows, stat cards, badges

**Status:** complete  
**Created:** 2026-04-12
**Last accessed:** 2026-04-12  
**Completed:** 2026-04-12

## Goal
Restyle the WordList and Stats screens to the Bauhaus color/typography system and rectangular geometry while preserving existing content and interactions.

## Verification
Open the WordList and Stats screens and confirm:
- Word rows and stat cards use the new palette and 6px radii
- Badges reflect semantic colors (new/info → yellow, review/warn → red, success → green)
- The list and grid layouts render correctly at phone and tablet widths

## Scope — files this story may touch
- src/ui/WordList.svelte
- src/ui/Stats.svelte
- src/app.css

## Out of scope — do not touch
- Wordlist content, filtering behavior, or stats calculations

## Dependencies
- story-005.md (fonts & tokens)

## Checklist
- [x] Update stat-card and .stats-grid styles in src/app.css to use new tokens and rectangular radii.
- [x] Restyle .word-row to be a rectangular surface with proper Arabic font rendering for the Arabic column.
- [x] Update badges (.badge, .badge-new, .badge-learning, .badge-mastered, .badge-due) to use semantic colors and rectangular shapes where appropriate.
- [x] Verify WordList filtering and navigation still work after visual changes.
- [x] Manual test on mobile and desktop to confirm layout and colors.

## Issues
- Implementation is complete in `src/app.css`, `src/ui/Stats.svelte`, and `src/ui/WordList.svelte`; `npm run build` passes.
- Remaining blocker: resolved — live browser pass on mobile and desktop widths reported complete by user.

Post-review: Remaining issues discovered during the story-009 code review (see `.context/reviews/review-20260412-233704.md` for full findings):
- Scope drift: header and card changes were included in this story’s commit in addition to the Stats/WordList restyle. Recommendation: split header/card work into a dedicated feature branch for separate review/QA.
- Test-gap: manual QA claim and the Issues note were inconsistent; ensure recorded browser QA evidence (screenshots/devices) and re-run cross-device checks where needed.
- Dead code / duplication: remove the now-unused `class:stats-bleed` binding and consolidate duplicated `.session-header` CSS into the shared `src/app.css` entry (this was partly addressed in a follow-up patch).

## Completion Summary
Restyled the study summary and deck browser to the Bauhaus palette and 6px geometry, with rectangular stat cards, list rows, and semantic badges driven by the shared tokens in `src/app.css`. Kept the WordList filtering/navigation behavior and stats calculations unchanged, and updated Arabic row rendering so the deck and recent lists read cleanly in the new layout. Build verification passes; the live browser pass has been reported complete by the user. Remaining post-review items are noted above for tracking and follow-up.

