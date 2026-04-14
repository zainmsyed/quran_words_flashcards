# Story 010: Settings & VoiceSettings restyle — panels and nav

**Status:** complete  
**Created:** 2026-04-12  
**Last accessed:** 2026-04-13  
**Completed:** 2026-04-13

---

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

---

## Checklist
- [x] Restyle settings nav and panels to use the new tokens and 6px radii.
- [x] Update form controls and buttons in Settings and VoiceSettings to match Bauhaus button styles.
- [x] Ensure voice sample playback and voice selection still work (no change to TTS adapter logic). (verified via code inspection and automated tests)
- [x] Manual test: change password, sign out, and play a voice sample to confirm nothing regressed. (verified in QA)

## Issues
- Potential binding/serialization issue in src/ui/VoiceSettings.svelte: the "Auto" radio uses value={null}. Radio input values are string-typed in HTML/Svelte bindings and this can cause the auto option to not match selected === null in some runtimes. Manual QA did not reproduce this problem in the tested environment, but it remains a small latent risk. Suggested fix (optional): use value="" for the Auto option and treat '' as the auto/cleared state in save/read logic.
- Visual inconsistency (intentional/out-of-scope): AccountSettings.svelte and ChangePasswordForm.svelte still use legacy rounded radii (18–24px). These components were not in-scope for this story but will appear visually different inside the Settings flow — schedule a follow-up if unified visuals are required.
- Platform/browser TTS differences: voice availability and playback behavior vary heavily across browsers and platforms. If cross-browser coverage was not performed during QA, plan to run the voice tests on Chrome, Firefox, Safari and mobile (iOS/Android) as needed.

## Completion Summary
Work completed (code review)
- Restyle applied to Settings and VoiceSettings (files touched):
  - src/ui/Settings.svelte: navigation, header, account box, tabs and panels updated to use the Bauhaus tokens and 6px radii (explicit 6px values and/or var(--radius-md) are used throughout).
  - src/ui/VoiceSettings.svelte: voice panel, voice list and action buttons updated to use shared panel tokens and .action-btn classes; border-radius uses var(--radius-md) which is 6px in src/app.css.
  - src/app.css: global tokens already define --radius-md: 6px and the shared .action-btn/.panel/.settings-panel styles provide the Bauhaus look used by the components.
- No logic changes were made to authentication or TTS adapters: src/core/tts-adapter.ts remains unchanged and VoiceSettings continues to call getAvailableVoices(), isSupported(), and speak(). Sign-out and change-password flows are still implemented in the same components (Settings.svelte dispatches logout; AccountSettings.svelte / ChangePasswordForm.svelte handle password change and session refresh).

What I verified by code inspection and automated tests
- UI components reference the new tokens and the 6px radii.
- Buttons and controls use the shared .action-btn styles; primary buttons use the gradient primary styles.
- Voice sample playback calls the established speak() path and save/restore uses browserStorage; there are no changes to the adapter that would alter runtime TTS behavior.
- Automated QA: I ran the project's test suite (npm test -> scripts/run-tests.mjs). Result: 7 tests passed.

Manual QA (performed)
- Manual QA was performed and passed (per your report). Tested flows:
  - Change password via Account tab — session refresh confirmed.
  - Sign out via Settings — logout behavior confirmed.
  - Audio tab: Refresh voices, select a voice, Play sample — audible output confirmed.
  - Save preference and reload — selection persisted.

Remaining work / blockers (do not close yet)
1. Optional: fix the Auto radio value behavior proactively. Manual QA did not reproduce an error, but the value={null} pattern can be fragile across runtimes. If you want to harden the code, I can change the Auto radio to value="" and treat '' as cleared state in save/load logic.
2. UX polish: Review AccountSettings/ChangePasswordForm visual differences and decide whether to include them in a follow-up story (harmonize radii/palette).
3. Cross-browser coverage: If QA was limited to a single browser or environment, consider extending tests to Chrome, Firefox, and Safari and mobile. TTS availability varies by platform.

Suggested next steps
- If you'd like the Auto radio hardening applied now, I can make that small code change and run the tests.
- Decide whether to schedule a follow-up story for Account/ChangePassword visual harmonization.
- After any additional fixes, update the story status and closeout when ready (Vazir will finalize).

Status recommendation
- Implementation is code-complete for the scoped files (Settings + VoiceSettings + token usage). With manual QA passed, there are no functional blockers preventing final closeout. Remaining items are optional hardening and visual polish; do not mark the story done until Vazir confirms final closeout.
