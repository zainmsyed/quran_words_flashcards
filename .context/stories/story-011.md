# Story 011: Visual tweaks — minor component harmonization

**Status:** in-progress  
**Created:** 2026-04-13  
**Last accessed:** 2026-04-13  
**Completed:** —

---

## Goal
Apply small visual tweaks and token harmonization across components to align them with the Bauhaus visual refresh. Keep changes minimal and purely visual (radii, spacing, token usage), and avoid behavioral or feature changes.

## Verification
- Open the updated components and confirm consistent use of the Bauhaus tokens (notably border radii and spacing tokens).
- Visual: confirm AccountSettings, ChangePasswordForm, Settings, VoiceSettings, Card, and WordList match expected radii (6px), spacing, and button styles across breakpoints.
- Functional: run the standard flows to ensure no regressions (change password, sign out, study session behavior, card flips, TTS playback).
- Build: run `npm run build` and `npm test` and address any build/test failures introduced by style changes.

## Scope — files this story may touch
- src/ui/AccountSettings.svelte
- src/ui/ChangePasswordForm.svelte
- src/ui/Settings.svelte (minor tweaks)
- src/ui/VoiceSettings.svelte (minor tweaks)
- src/ui/Card.svelte (spacing/radii)
- src/ui/WordList.svelte (spacing/radii)
- src/app.css

## Out of scope — do not touch
- Auth logic, password-change behavior, or server interactions
- Large refactors or feature additions

## Dependencies
- story-005.md (fonts & tokens)
- story-010.md (Settings & VoiceSettings restyle)

---

## Checklist
- [ ] Harmonize AccountSettings visual tokens: use var(--radius-md) for card/profile radii and ensure text/contrast tokens follow the new palette.
- [ ] Update ChangePasswordForm inputs and feedback panels to use Bauhaus radii and tokenized backgrounds/borders.
- [ ] Minor spacing fixes in Card and WordList to preserve top/bottom rhythm at mobile and desktop breakpoints.
- [ ] Verify TTS button placement remains on the Arabic-facing side of cards and that playback works as expected.
- [ ] Run `npm run build` and `npm test` and resolve any issues.
- [ ] Document any unresolved accessibility exceptions or follow-ups as issues (do not leave open questions in this story).

---

## Issues

---

## Completion Summary

