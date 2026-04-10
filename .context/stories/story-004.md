# Story 004: Account settings — change password, reset password, and invite-only onboarding docs

**Status:** not-started
**Created:** 2026-04-09
**Last accessed:** 2026-04-09
**Completed:** —

## Goal
Add a custom account/settings experience for signed-in users, including change-password and forgot/reset-password flows, plus the final invite-only onboarding notes that explain how admins create accounts manually in PocketBase.

## Verification
From the settings/account screen, a signed-in user can change their password and request a password reset. The repo documentation explains the manual invite-only provisioning process for PocketBase admins.

## Scope — files this story may touch
- `src/ui/Settings.svelte`
- new auth/account Svelte components under `src/ui/`
- `src/core/` auth helpers used for password change and reset flows
- `README.md`
- `docs/` onboarding or setup notes

## Out of scope — do not touch
- Open registration or self-signup
- OAuth/social login
- Importing old localStorage progress
- Reworking the study flow or PocketBase schema

## Dependencies
- Requires: story-001
- Requires: story-002

## Checklist
- [ ] Add an account/profile area that shows the signed-in user
- [ ] Add a change-password form for authenticated users
- [ ] Add a forgot-password request flow
- [ ] Add a reset-password completion flow
- [ ] Add a logout affordance inside the account/settings area
- [ ] Document manual admin-created invite-only onboarding in the README

## Issues
- None yet.

## Completion Summary
This story is planned but not started. It will be complete when users can manage their password flows in the custom UI and the repo documents the invite-only onboarding process.
