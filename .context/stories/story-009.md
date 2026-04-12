# Story 009: WordList & Stats restyle — list rows, stat cards, badges

**Status:** not-started
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
- [ ] Update stat-card and .stats-grid styles in src/app.css to use new tokens and rectangular radii.
- [ ] Restyle .word-row to be a rectangular surface with proper Arabic font rendering for the Arabic column.
- [ ] Update badges (.badge, .badge-new, .badge-learning, .badge-mastered, .badge-due) to use semantic colors and rectangular shapes where appropriate.
- [ ] Verify WordList filtering and navigation still work after visual changes.
- [ ] Manual test on mobile and desktop to confirm layout and colors.

## Issues
- None.

## Completion Summary

