# Story 001: PocketBase backend foundation — schema, rules, and deployment kit

**Status:** in-progress  
**Created:** 2026-04-09
**Last accessed:** 2026-04-10  
**Completed:** —

## Goal
Add the PocketBase backend foundation needed for invite-only accounts and per-user progress. This story creates the version-controlled PocketBase schema, access rules, migrations, and repo-contained deployment files so the app can be booted consistently from a fresh checkout.

## Verification
From a clean clone, a reviewer can inspect the repo and find the PocketBase migration files, access rules, Nginx config, systemd unit, environment template, and README setup steps. Following the documented setup should start PocketBase and expose the expected auth and `card_progress` structure.

## Scope — files this story may touch
- `pb_migrations/*`
- `nginx/flashcards.conf`
- `systemd/flashcards.service`
- `.env.example` or equivalent environment template
- `README.md`
- `docs/` notes related to PocketBase setup and invite-only onboarding

## Out of scope — do not touch
- Custom frontend auth screens
- Study-state sync in the Svelte app
- Password reset/change flows in the UI
- Importing old localStorage progress

## Dependencies
- None

## Checklist
- [ ] Create the PocketBase collection migration for per-user card progress
- [ ] Define PocketBase access rules so users only access their own records
- [ ] Add the admin/superuser setup or initialization file needed for invite-only onboarding
- [ ] Add Nginx and systemd example files to the repo
- [ ] Add an environment-variable template for PocketBase deployment
- [ ] Update the README with setup, run, and backup instructions
- [ ] Document manual account creation in the PocketBase admin dashboard

## Issues
- None yet.

## Completion Summary
This story is planned but not started. It will be complete when the repo contains the PocketBase schema, deployment kit, and setup instructions needed for invite-only use.
