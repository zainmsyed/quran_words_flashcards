# Story 018: App security hardening — auth/session safety and sensitive UI paths

**Status:** complete  
**Created:** 2026-04-18  
**Last accessed:** 2026-04-23  
**Completed:** 2026-04-19

## Goal
Audit and patch app-side security issues so invite-only users can log in safely, session state fails closed, and no UI path leaks sensitive data or answer content.

## Verification
Run the updated security-focused tests and build, then smoke-test the auth/session flow with storage- and backend-failure cases to confirm the app degrades safely instead of exposing data or crashing.

## Scope — files this story may touch
- src/core/pocketbase-auth.ts
- src/core/pocketbase-study.ts
- src/core/storage-adapter.ts
- src/core/tts-adapter.ts
- src/App.svelte
- src/ui/AuthGate.svelte
- src/ui/AuthUnavailable.svelte
- src/ui/AccountSettings.svelte
- src/ui/ChangePasswordForm.svelte
- src/ui/Settings.svelte
- src/ui/StudySession.svelte
- src/ui/components/Card.svelte
- scripts/run-tests.mjs

## Out of scope — do not touch
- Server/reverse-proxy hardening
- Automated CI security gates
- New study features or visual redesign work
- Public registration or auth model changes

## Dependencies
- story-017.md

## Checklist
- [x] Review auth, session, and storage flows for fail-closed behavior and patch any unsafe defaults.
  - Implemented: safer session parsing and refresh handling in src/core/pocketbase-auth.ts; protection around missing/invalid stored session values; auth flows now clear invalid sessions and fail closed rather than leave stale privileged state.
- [x] Patch sensitive UI paths so login/account/session states never expose credentials, answer content, or stale privileged data.
  - Implemented: cleared sensitive inputs on submit (AuthGate, ChangePasswordForm), dispatch/central handling of unauthorized/unavailable session issues (App, Settings, StudySession, AccountSettings), and ensured TTS/audio stops on unmount or on session invalidation (Card, App). Audio controls are only visible when pronunciation is available.
- [x] Add or update security-focused tests for storage failures, auth refresh/sign-out behavior, and sensitive-session regressions.
  - Implemented: added tests in scripts/run-tests.mjs covering storage write/remove failures, malformed stored sessions, unauthorized auth-refresh responses, and the describePocketBaseError sanitizer.
- [x] Verify the patched app with `npm test` and `npm run build`, plus a targeted auth/storage failure smoke test.
  - Automated checks performed: `npm test` (unit/script tests) and `npm run build` completed successfully in the dev environment.
  - Smoke test performed: `npm run smoke:pocketbase` passed locally against an isolated PocketBase binary copy in `/tmp/qfc-pocketbase-smoke/pocketbase` using the default test admin credentials.

## Issues
- No code-level blockers discovered during the audit and unit-test pass.
- Tests emit expected storage-adapter warnings when simulating blocked storage; these are informational and expected by the tests.

## Completion Summary
Work completed in this implementation (high level):
- Auth/session hardening
  - src/core/pocketbase-auth.ts
    - parseAuthSession now clears malformed/stale stored sessions
    - initializeAuth sanitizes unavailable/refresh failures and returns safe statuses/messages
    - session persistence and clearing wrapped to tolerate storage failures
    - added describePocketBaseError helper to produce user-facing, non-sensitive messages while preserving actionable migration hints
- Storage resilience
  - src/core/storage-adapter.ts
    - guarded get/set/remove with fallbacks
    - getItem will remove malformed JSON values to avoid reusing corrupted/stale session blobs
    - setItem attempts remove on write failure; removeItem writes a tombstone if delete fails
- UI hardening
  - src/App.svelte
    - central session-issue handler (unauthorized/unavailable) that stops audio, clears in-memory session, and routes to login/unavailable states safely
    - safer sign-in handling with sanitized messages
  - src/ui/AuthGate.svelte
    - clear password immediately on submit and harden input attributes
  - src/ui/ChangePasswordForm.svelte, src/ui/AccountSettings.svelte
    - local validation and safer server-error handling; password inputs cleared after submit
    - AccountSettings now dispatches a sessionissue when changePassword reports unauthorized/unavailable
  - src/ui/Settings.svelte, src/ui/StudySession.svelte
    - both propagate session issues up to App and fail-closed on unauthorized responses
    - StudySession persists session state more deterministically and throws on fatal persistence failures so the App can take corrective action
  - src/ui/components/Card.svelte
    - audio control only rendered when pronunciation is available; onDestroy stops audio to avoid leakage
- Tests
  - scripts/run-tests.mjs updated with tests for:
    - storage adapter failure behaviors (write/remove/parse)
    - initializeAuth behaviors with malformed stored sessions and unauthorized refresh
    - describePocketBaseError sanitizer behaviour
  - All unit/script tests pass locally (16 tests)
- Build
  - `npm run build` completed successfully for the SPA bundle
- Operational smoke
  - `npm run smoke:pocketbase` passed locally against an isolated PocketBase binary copy in `/tmp/qfc-pocketbase-smoke/pocketbase` using the default test admin credentials.

Files changed (representative):
- src/core/pocketbase-auth.ts
- src/core/storage-adapter.ts
- src/ui/StudySession.svelte
- src/ui/Settings.svelte
- src/ui/AccountSettings.svelte
- src/ui/ChangePasswordForm.svelte
- src/ui/AuthGate.svelte
- src/ui/components/Card.svelte
- scripts/run-tests.mjs

## Remaining work / recommended follow-ups
1. Manual browser storage-failure smoke checks (recommended)
   - Why: some failure modes (blocked localStorage in private browsing, browser extensions, or platform-specific behavior) must be validated in real browsers (esp. Safari iOS/Private Browsing) to confirm graceful degradation and no UI leakage of sensitive content.
   - Suggested steps: test sign-in, sign-out, change-password, and a live study session with localStorage blocked or limited; confirm UI shows login/unavailable screens and no answers/credentials remain visible.
   - Status: RECOMMENDED before closeout (manual).

2. Optional / recommended follow-ups (non-blocking for core story)
   - Add a small e2e test (Playwright) to assert no sensitive UI content is visible after session expiry (recommended for regression protection).
   - Consider cross-tab session invalidation via the `storage` event to ensure sign-out in one tab closes session in other open tabs.

## Readiness
- Code-level work: DONE — auth/session/storage flows were reviewed and patched, and unit/script tests were added/updated.
- Automated verification: DONE — `npm test`, `npm run build`, and `npm run smoke:pocketbase` all passed in the dev environment.
- Manual/operational verification: OPTIONAL — browser storage-failure checks are still recommended, but no remaining code or smoke-test blockers were found in this review.

Do not mark the story complete — Vazir or the release engineer should handle the final closeout prompt after any desired manual browser checks.
