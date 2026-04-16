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

## Checklist (status)
- [x] Replace the hard-coded bundled-audio coverage assumptions so runtime pronunciation logic reflects the full generated seed deck.
  - Implemented: src/core/tts-adapter.ts now exposes loadBundledAudioManifest() and bundledAudioIdsStore (Svelte writable store) which is populated from /audio/manifest.json. Default minimal set preserved during load for UX.
- [x] Keep pronunciation controls limited to words that can actually be pronounced and preserve the Arabic-side-only answer-protection behavior.
  - Implemented: src/ui/components/Card.svelte uses $bundledAudioIdsStore and isSpeechSupported() in a reactive statement so the audio button is enabled only when audio is available or speech is supported. The button placement remains on the Arabic-facing side per the existing UI tokens.
- [x] Ensure the adapter tries bundled audio first and falls back to browser speech only when static playback is unavailable or fails.
  - Implemented: speak(...) still tries audioSources (HTMLAudio) first via tryPlayBundledAudio() and falls back to the Web Speech API only when audio playback fails or is unavailable.
- [x] Add or update a smoke check, helper, or test coverage for bundled-audio lookup and fallback behavior.
  - Implemented: scripts/check_audio_coverage.py verifies seed→audio coverage. Unit/behavioral tests added in scripts/run-tests.mjs to exercise manifest loading and speak() success/failure fallbacks. A GitHub Actions workflow was added to run the coverage check on pull requests.
- [x] Verify the primary bundled playback path and the graceful browser-fallback path without changing the rest of the study session behavior.
  - Verification: Automated unit tests (run via npm test) cover manifest load and speak fallback cases; manual QA preview page (public/audio/sample_preview.html) is available for auditioning. Local test run reported all tests passing.

## Issues / Remaining blockers (explanation and resolution guidance)
The implementation covers the intended runtime coverage and fallback behavior, but a few verification and UX items remain as recommended follow-up before final closeout. These are not blockers for the core implementation, but should be resolved or acknowledged prior to marking the story complete:

1) Cross-browser manual smoke testing (recommended)
- Why: SpeechSynthesis and HTMLAudio behavior vary across browsers and platforms (notably iOS/Safari). Our unit tests mock and assert the JS-side logic, but integration differences may surface in real browsers (e.g., autoplay policies, voice availability, iOS audio decoding edge cases).
- Action: Run a quick smoke matrix on Chrome Desktop, Firefox Desktop, Safari Desktop, Chrome Android, and Safari iOS confirming:
  - Bundled MP3 plays when present (no fallback to SpeechSynthesis).
  - Simulated missing-file or playback failure falls back to SpeechSynthesis and does not break the card flow.
- Resolution: Manual QA needed. This is recommended before story closeout but not a code blocker.

2) UI loading feedback (optional UX polish)
- Why: The manifest loader is asynchronous. While the default small set prevents a completely blank UI, there can be transient changes to the audio-button state when the manifest finishes loading. A small visual indicator (spinner/hint or disabled state tooltip) can clarify this to the user.
- Action: Add a lightweight loading indicator or title/aria hint on the audio button while loadBundledAudioManifest runs, or keep the current conservative UX (default IDs shown) if the team prefers no extra UI.
- Resolution: UX decision; not required to mark code complete.

3) VoiceSettings messaging (optional)
- Why: If you want explicit settings or messaging to reflect whether audio is served from bundled assets vs. browser voice, update src/ui/VoiceSettings.svelte to reflect availability and the chosen preferred voice. Not required for the fallback behavior itself.
- Resolution: Optional follow-up.

4) Long-term asset policy (context)
- Why: The repo currently includes the POC 300 MP3s for QA; this was an intentional short-term choice. Story-014/Review recommends moving assets to a release/CDN or Git LFS for long-term hygiene.
- Resolution: Operational decision; not required to finish runtime fallback work but should be resolved in project roadmap.

## Completion Summary (what was implemented)
- Runtime manifest-driven bundled-audio discovery: src/core/tts-adapter.ts now fetches /audio/manifest.json, populates an internal Set and a Svelte store (bundledAudioIdsStore) to expose availability reactively.
- Reactive UI: src/ui/components/Card.svelte subscribes to bundledAudioIdsStore and computes ttsAvailable reactively so audio controls enable/disable automatically when the manifest changes.
- Fallback semantics: speak() attempts bundled audio via HTMLAudio, and falls back to Web Speech API only when playback fails or is unavailable. Tests were added to assert both success/avoidance of SpeechSynthesis and failure/fallback behavior.
- Coverage & QA: scripts/check_audio_coverage.py checks seed→audio coverage; public/audio/sample_preview.html lists 300 items for manual audition. A GitHub Actions workflow runs the coverage check on pull requests.
- Tests: Added unit/behavior tests in scripts/run-tests.mjs for manifest loading and speak fallback; local test run reports all tests passing.
- Documentation: public/audio/README.md documents why the audio is in-repo and how to regenerate it (gTTS/GCP paths).

## Readiness / Blocking status
- Ready for code review and manual cross-browser QA.  
- Not blocked by missing code changes: all checklist items in this story's scope are implemented and tested at the unit level.  
- Remaining items to address prior to final closeout (non-blocking):
  - Manual cross-browser smoke verification across major browsers/devices (recommended).  
  - Optional UI loading hint and optional VoiceSettings messaging.  
  - Long-term artifact policy decision (project-level, not required to complete this story).

Do you want me to (pick one):
- (A) Run the cross-browser smoke checklist and report results (I can run local checks for desktop browsers here; iOS device checks require a real device or CI provider).
- (B) Add the small UI loading indicator now and push the change.
- (C) Proceed to prepare the PR/merge checklist so you can review & merge once manual QA is done.

Note: I have not changed the story status — please tell Vazir to mark the story complete when you're satisfied with the manual QA and any optional follow-ups.
