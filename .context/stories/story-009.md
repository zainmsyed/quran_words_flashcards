# Story 009: WordList & Stats restyle — list rows, stat cards, badges

**Status:** in-progress  
**Created:** 2026-04-12
**Last accessed:** 2026-04-12  
**Completed:**

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
- [ ] Manual test on mobile and desktop to confirm layout and colors.

## Issues
- Implementation is complete in `src/app.css`, `src/ui/Stats.svelte`, and `src/ui/WordList.svelte`; `npm run build` passes.
- Remaining blocker: a live browser pass on mobile and desktop widths is still needed to confirm the spacing and color treatment before closeout.

## Completion Summary
Restyled the study summary and deck browser to the Bauhaus palette and 6px geometry, with rectangular stat cards, list rows, and semantic badges driven by the shared tokens in `src/app.css`. Kept the WordList filtering/navigation behavior and stats calculations unchanged, and updated Arabic row rendering so the deck and recent lists read cleanly in the new layout. Build verification passes; the only remaining blocker is final browser QA on phone/tablet widths.

