# Story 004: Account settings — change password and invite-only onboarding docs

**Status:** complete  
**Created:** 2026-04-09
**Last accessed:** 2026-04-11  
**Completed:** 2026-04-11

## Goal
Add a custom account/settings experience for signed-in users, including a change-password flow, plus the final invite-only onboarding notes that explain how admins create accounts manually in PocketBase.

## Verification
From the settings/account screen, a signed-in user can change their password. The repo documentation explains the manual invite-only provisioning process for PocketBase admins.

## Scope — files this story may touch
- `src/ui/Settings.svelte`
- new auth/account Svelte components under `src/ui/`
- `src/core/` auth helpers used for password change flows
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
- [x] Add an account/profile area that shows the signed-in user
- [x] Add a change-password form for authenticated users
- [x] Add a logout affordance inside the account/settings area
- [x] Document manual admin-created invite-only onboarding in the README

## Issues
- None yet.

## Completion Summary
Implemented the signed-in account area, change-password form, logout affordance, and the invite-only onboarding docs. Removed the password-reset flow on request because the beta group will handle password recovery manually. Verified with `npm run build`, `npm test`, and `npm run smoke:pocketbase`. Story status remains in-progress until the user explicitly approves closeout.
