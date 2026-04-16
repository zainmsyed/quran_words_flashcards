# Story 015: Runtime audio coverage & fallback hardening — use bundled pronunciation across the seed deck

**Status:** in-progress  
**Created:** 2026-04-14  
**Last accessed:** 2026-04-16  
**Completed:**  

## Goal
Update runtime pronunciation behavior so the app treats bundled audio as the primary path for the seeded deck and falls back to browser speech only when a bundled file is missing or fails to play.

## Verification
In the app, confirm that a seeded word with bundled audio plays the static asset path first and that a simulated missing-file or playback-failure case falls back gracefully to browser speech without breaking the card flow.

## Scope
- src/core/tts-adapter.ts
- src/ui/components/Card.svelte
- src/ui/VoiceSettings.svelte (only if fallback messaging or controls need adjustment)
- scripts/ (smoke checks or test helpers if needed)

## Out of scope
- New study features or SRS changes
- Multiple bundled voices or per-user bundled voice selection
- Runtime cloud TTS integration
- Dedicated offline/PWA caching work

## Dependencies
- story-014.md

## Checklist
- [ ] Replace the hard-coded bundled-audio coverage assumptions so runtime pronunciation logic reflects the full generated seed deck.
- [ ] Keep pronunciation controls limited to words that can actually be pronounced and preserve the Arabic-side-only answer-protection behavior.
- [ ] Ensure the adapter tries bundled audio first and falls back to browser speech only when static playback is unavailable or fails.
- [ ] Add or update a smoke check, helper, or test coverage for bundled-audio lookup and fallback behavior.
- [ ] Verify the primary bundled playback path and the graceful browser-fallback path without changing the rest of the study session behavior.

## Issues
- None yet.

## Completion Summary
- Not started.
