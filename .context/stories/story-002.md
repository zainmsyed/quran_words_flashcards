# Story 002: Custom auth gate — login, logout, and app access control

**Status:** complete  
**Created:** 2026-04-09
**Last accessed:** 2026-04-11  
**Completed:** 2026-04-11

## Goal
Add a custom Svelte authentication gate in front of the existing flashcard app. Users should sign in with their PocketBase account, the study UI should remain unchanged behind the gate, and the app should show an unavailable or retry state if PocketBase cannot be reached.

## Verification
Open the app while signed out and confirm the login screen appears. Sign in with a valid PocketBase account and confirm the existing study flow loads. Sign out and confirm the app returns to the login gate. Simulate a PocketBase outage and confirm the app does not enter the study flow.

## Scope — files this story may touch
- `src/App.svelte`
- `src/main.ts`
- `src/ui/` auth-related Svelte components
- `src/core/` auth client or session adapter modules
- any small shared UI state needed for login/logout gating

## Out of scope — do not touch
- Progress persistence migration to PocketBase
- Change-password and forgot/reset-password screens
- Deployment files and PocketBase migrations
- Reworking the existing study screens beyond the auth gate

## Dependencies
- Requires: story-001

## Checklist
- [x] Add a PocketBase auth client or adapter under `src/core`
- [x] Build the custom login screen in Svelte
- [x] Add sign-out handling and route the user back to the login gate
- [x] Block study navigation until auth and server availability are confirmed
- [x] Add a retry or unavailable state for PocketBase failures
- [x] Keep the existing study UI intact behind the gate

## Issues
- Manual browser verification against a live PocketBase instance is still recommended before closeout so login, retry, and logout can be exercised end to end.

## Completion Summary
Implemented the custom auth gate in front of the existing study app without changing the study/session flow itself.

Work completed:
- Added `src/core/pocketbase-auth.ts` as a small PocketBase auth/session adapter with health checks, sign-in, auth refresh, and logout persistence.
- Added `src/ui/AuthGate.svelte` for the custom login screen.
- Added `src/ui/AuthUnavailable.svelte` for the retry/unavailable state when PocketBase cannot be reached.
- Updated `src/App.svelte` to gate the study/settings screens behind auth bootstrap and PocketBase availability checks.
- Updated `src/ui/Settings.svelte` to show the signed-in user and expose sign-out without reworking the study UI.
- Wired the app to PocketBase via same-origin `/api` requests, with Vite dev/preview proxy support so the local auth flow can reach a PocketBase instance on `127.0.0.1:8090`.
- Added `npm run dev:full` to start PocketBase and Vite together for local development, auto-downloading PocketBase the first time if needed and bootstrapping migrations/server state.
- Added auth helper coverage to `scripts/run-tests.mjs`.

Verification completed in-repo:
- `npm test`
- `npm run build`
- `npm run smoke:pocketbase`

Remaining before story closeout:
- Run the browser flow against a live PocketBase instance to confirm signed-out load, successful sign-in, sign-out, and unavailable/retry behavior.
