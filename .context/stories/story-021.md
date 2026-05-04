# Story 021: Session start preview choice — review queue before testing

**Status:** in-progress  
**Created:** 2026-05-04  
**Last accessed:** 2026-05-04  
**Completed:** —

## Goal
Let users choose at the start of a normal daily session whether to review the current session queue before testing or go straight to flashcards, while preserving existing SRS behavior, stats, and saved-session resume.

## Verification
Start a normal session and verify the user can choose Review first or Test me; Review first shows the current queue as a text-only Arabic/transliteration/English list with a Start test action; Test me enters the existing flashcard flow; refreshing preserves the current phase/index; and `npm run build` plus `npm test` pass.

## Scope
- src/core/session.ts
- src/core/pocketbase-study.ts
- src/ui/StudySession.svelte
- src/ui/components/SessionPreview.svelte
- scripts/run-tests.mjs

## Out of scope
- Changing SRS interval math or session queue composition
- Audio/pronunciation controls in the preview list
- New/Review labels, color coding, filters, or sorting controls in the preview list
- Applying the preview choice to Review again replay sessions
- Settings toggles such as skip preview next time
- Broader visual redesign outside the new start/review surfaces

## Dependencies
- None

## Checklist
- [x] Extend saved session state so the current study phase can be persisted as start choice, preview list, or flashcard test without losing the existing queue/index resume behavior.
- [x] Add a start choice surface for normal daily sessions with Review first and Test me actions, keeping Review again replay sessions on the existing direct flashcard path.
- [x] Add a text-only session preview component that renders the current queue's Arabic, transliteration, and English values and provides a single Start test action.
- [x] Ensure previewing words does not call rating logic, update card state, increment stats, alter streaks, or persist progress fingerprints as studied progress.
- [x] Add or update tests covering phase persistence, refresh/resume behavior, preview no-op progress behavior, and Review again bypass behavior.
- [x] Run `npm run build` and `npm test` to verify the implementation.

## Issues
- None currently identified.

## Completion Summary
- Implementation is ready for user review but the story has not been marked complete.
