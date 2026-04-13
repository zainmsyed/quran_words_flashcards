# Story 012: QA / responsive polish — cross-screen fixes and accessibility

**Status:** not-started  
**Created:** 2026-04-12
**Last accessed:** 2026-04-13  
**Completed:**

## Goal
Perform a focused QA pass across breakpoints to address spacing, alignment, contrast, and any accessibility issues introduced by the visual refresh.

## Verification
Manual walkthrough on a phone-width viewport and a desktop viewport confirming:
- No functional regressions in study flow, card behavior, or auth flows
- Contrast meets reasonable accessibility standards for primary actions and text
- Touch targets meet minimum sizing and spacing
- Build and unit tests pass (npm run build; npm test)

## Scope — files this story may touch
- src/app.css
- any Svelte files modified by previous stories (StudySession, Card, WordList, Stats, Settings, VoiceSettings)

## Out of scope — do not touch
- Large refactors or feature additions
- PocketBase schema or server-side changes

## Dependencies
- story-005.md, story-006.md, story-007.md, story-008.md, story-009.md, story-010.md

## Checklist
- [ ] Manual walkthrough on phone (≤420px) and desktop widths to surface layout and spacing issues.
- [ ] Fix alignment/spacing regressions in src/app.css and affected components (one focused change per checklist item).
- [ ] Verify TTS/audio controls remain on the Arabic-facing side of cards and that audio playback is not broken.
- [ ] Run `npm run build` and `npm test` and fix any issues caused by the style changes.
- [ ] Document any accessibility exceptions or follow-up tasks as issues (do not leave open questions in checklist items).

## Issues
- None.

## Completion Summary
