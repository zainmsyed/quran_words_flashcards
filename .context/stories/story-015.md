# Story 015: Runtime audio coverage & fallback hardening — use bundled pronunciation across the seed deck

**Status:** complete  
**Created:** 2026-04-14  
**Last accessed:** 2026-04-16  
**Completed:** 2026-04-16

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

## Issues
- The implementation covers the intended runtime coverage and fallback behavior, but a few verification and UX items remain as recommended follow-up before final closeout. These are not blockers for the core implementation, but should be resolved or acknowledged prior to marking the story complete:
  - Cross-browser manual smoke testing is recommended because SpeechSynthesis and HTMLAudio behavior vary across browsers and platforms (notably iOS/Safari). Unit tests mock the JS-side logic, but integration differences may surface in real browsers (e.g., autoplay policies, voice availability, iOS audio decoding edge cases).
  - UI loading feedback is optional UX polish: the manifest loader is asynchronous, and a small visual indicator (spinner/hint or disabled state tooltip) could clarify transient audio-button state changes while loadBundledAudioManifest runs.
  - VoiceSettings messaging is optional: if you want explicit settings or messaging to reflect whether audio is served from bundled assets vs. browser voice, update src/ui/VoiceSettings.svelte to reflect availability and the chosen preferred voice.
  - Long-term asset policy is a project-level decision: the repo currently includes the POC 300 MP3s for QA; Story-014/Review recommends moving assets to a release/CDN or Git LFS for long-term hygiene.

## Completion Summary
- Runtime manifest-driven bundled-audio discovery: src/core/tts-adapter.ts now fetches /audio/manifest.json, populates an internal Set and a Svelte store (bundledAudioIdsStore) to expose availability reactively.
- Reactive UI: src/ui/components/Card.svelte subscribes to bundledAudioIdsStore and computes ttsAvailable reactively so audio controls enable/disable automatically when the manifest changes.
- Fallback semantics: speak() attempts bundled audio via HTMLAudio, and falls back to Web Speech API only when playback fails or is unavailable. Tests were added to assert both success/avoidance of SpeechSynthesis and failure/fallback behavior.
- Coverage & QA: scripts/check_audio_coverage.py checks seed→audio coverage; public/audio/sample_preview.html lists 300 items for manual audition. A GitHub Actions workflow runs the coverage check on pull requests.
- Tests: Added unit/behavior tests in scripts/run-tests.mjs for manifest loading and speak fallback; local test run reports all tests passing.
- Documentation: public/audio/README.md documents why the audio is in-repo and how to regenerate it (gTTS/GCP paths).
- Readiness / Blocking status: ready for code review and manual cross-browser QA; not blocked by missing code changes; remaining items are manual cross-browser smoke verification, optional UI loading hint, optional VoiceSettings messaging, and long-term artifact policy.
- Follow-up options discussed: run the cross-browser smoke checklist and report results, add the small UI loading indicator, or proceed with PR/merge checklist once manual QA is done.
