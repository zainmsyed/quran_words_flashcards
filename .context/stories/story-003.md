# Story 003: Verification & polish — stats, word list, edge cases

**Status:** not-started  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-29  
**Completed:** —

---

## Goal
Validate the core study flow implemented in Svelte, add lightweight polish (Stats and Word List views), and verify edge cases so the app is reliable for early users.

## Verification
Manual browser checks on the dev server or built app:
- Stats screen (Svelte) shows total studied, mastered count, and day streak
- Word List view groups words by mastered / learning / not-yet-seen
- Reload preserves state and scheduled intervals behave as expected for rated cards

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
- [ ] Implement a simple Stats view with required metrics
- [ ] Implement a Word List view grouped by status
- [ ] Run manual smoke checks for reload/persistence and SRS interval updates
- [ ] Capture follow-up tasks for v2 (300 words, PWA, native audio)

---

## Issues
- Need to decide acceptance thresholds for "mastered" and ease-factor tuning

---

## Completion Summary
