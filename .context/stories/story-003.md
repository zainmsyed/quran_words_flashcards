# Story 003: Per-user progress sync — replace localStorage with PocketBase

**Status:** in-progress  
**Created:** 2026-04-09
**Last accessed:** 2026-04-11  
**Completed:** —

## Goal
Move persisted study state from localStorage to PocketBase so each user has independent progress, stats, and review scheduling. Keep the study flow and UI behavior the same while swapping the persistence layer.

## Verification
Log in with two different PocketBase accounts and confirm each account sees its own card progress and stats. Refresh the page or reopen the app and confirm the same account restores the same progress from PocketBase with no cross-user bleed.

## Scope — files this story may touch
- `src/core/storage-adapter.ts` or a new PocketBase-backed persistence adapter
- `src/core/app-stats.ts`
- `src/core/session.ts` or related session/persistence helpers
- `src/ui/StudySession.svelte`
- `src/ui/Stats.svelte`
- `src/ui/WordList.svelte`

## Out of scope — do not touch
- Auth gate UI
- Change-password and forgot/reset-password flows
- PocketBase deployment files and migrations
- Adding new study features beyond persistence replacement

## Dependencies
- Requires: story-001
- Requires: story-002

## Checklist
- [ ] Define the PocketBase-backed data model for card progress and stats
- [ ] Load saved progress for the signed-in user during app startup
- [ ] Save card ratings and session changes to PocketBase
- [ ] Update stats and word-list views to read from authenticated data
- [ ] Preserve the current study flow behavior while changing persistence
- [ ] Remove reliance on `qfc2_*` localStorage keys for persisted study data

## Issues

### /fix — "the ui is a little messed up. 1st problem to fix is that the transliteration is written on the english side of the card. so you are seeing the answer. and also the audio is also availabel on the english side of the card again revealing the answer"
- **Reported:** 2026-04-11  
- **Status:** resolved  
- **Agent note:** Fixed template logic so transliteration and the audio control only appear on the Arabic-facing side of the card. Build succeeded after the change. Runtime UI confirmation was provided by the user in this session.  
- **Solution:** Edited src/ui/components/Card.svelte to render audio/transliteration only on the Arabic face: removed transliteration from the English/meaning face in `ar2en` mode and removed the front audio button from `en2ar` front-face. Kept audio and transliteration on the Arabic-facing face only.  


## Completion Summary
This story is planned but not started. It will be complete when the app stores and restores per-user study progress through PocketBase instead of localStorage.
