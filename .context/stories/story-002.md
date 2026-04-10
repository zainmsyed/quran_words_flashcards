# Story 002: Custom auth gate — login, logout, and app access control

**Status:** not-started
**Created:** 2026-04-09
**Last accessed:** 2026-04-09
**Completed:** —

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
- [ ] Add a PocketBase auth client or adapter under `src/core`
- [ ] Build the custom login screen in Svelte
- [ ] Add sign-out handling and route the user back to the login gate
- [ ] Block study navigation until auth and server availability are confirmed
- [ ] Add a retry or unavailable state for PocketBase failures
- [ ] Keep the existing study UI intact behind the gate

## Issues
- None yet.

## Completion Summary
This story is planned but not started. It will be complete when login, logout, and auth gating work cleanly without changing the core flashcard experience.
