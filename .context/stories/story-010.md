# Story 010: Settings & VoiceSettings restyle — panels and nav

**Status:** in-progress  
**Created:** 2026-04-12
**Last accessed:** 2026-04-13  
**Completed:**

## Goal
Restyle Settings and VoiceSettings screens (navigation, panels, form controls, voice picker) to the Bauhaus visual language without altering existing account/sign-out/change-password behavior.

## Verification
Open Settings and VoiceSettings and confirm:
- Navigation buttons/panes use rectangular 6px radii and the new palette
- Voice picker and sample playback continue to function
- Sign-out and change-password flows remain unchanged and functional

## Scope — files this story may touch
- src/ui/Settings.svelte
- src/ui/VoiceSettings.svelte
- src/app.css

## Out of scope — do not touch
- Auth behavior, password-change logic, or server interactions

## Dependencies
- story-005.md (fonts & tokens)

## Checklist
- [ ] Restyle settings nav and panels to use the new tokens and 6px radii.
- [ ] Update form controls and buttons in Settings and VoiceSettings to match Bauhaus button styles.
- [ ] Ensure voice sample playback and voice selection still work (no change to TTS adapter logic).
- [ ] Manual test: change password, sign out, and play a voice sample to confirm nothing regressed.

## Issues
- None.

## Completion Summary

