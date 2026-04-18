# Story 018: App security hardening — auth/session safety and sensitive UI paths

**Status:** in-progress  
**Created:** 2026-04-18  
**Last accessed:** 2026-04-18  
**Completed:** —

## Goal
Audit and patch app-side security issues so invite-only users can log in safely, session state fails closed, and no UI path leaks sensitive data or answer content.

## Verification
Run the updated security-focused tests and build, then smoke-test the auth/session flow with storage- and backend-failure cases to confirm the app degrades safely instead of exposing data or crashing.

## Scope
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

## Out of scope
- Server/reverse-proxy hardening
- Automated CI security gates
- New study features or visual redesign work
- Public registration or auth model changes

## Dependencies
- story-017.md

## Checklist
- [ ] Review auth, session, and storage flows for fail-closed behavior and patch any unsafe defaults.
- [ ] Patch sensitive UI paths so login/account/session states never expose credentials, answer content, or stale privileged data.
- [ ] Add or update security-focused tests for storage failures, auth refresh/sign-out behavior, and sensitive-session regressions.
- [ ] Verify the patched app with `npm test` and `npm run build`, plus a targeted auth/storage failure smoke test.

## Issues
- None yet.

## Completion Summary
- Pending implementation.
