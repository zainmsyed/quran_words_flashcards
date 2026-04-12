# Story 001: PocketBase backend foundation — schema, rules, and deployment kit

**Status:** complete
**Created:** 2026-04-09
**Last accessed:** 2026-04-10
**Completed:** 2026-04-10

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
- [x] Create the PocketBase collection migration for per-user card progress
- [x] Define PocketBase access rules so users only access their own records
- [x] Add the admin/superuser setup or initialization file needed for invite-only onboarding
- [x] Add Nginx and systemd example files to the repo
- [x] Add an environment-variable template for PocketBase deployment
- [x] Update the README with setup, run, and backup instructions
- [x] Document manual account creation in the PocketBase admin dashboard

## Issues
- No open implementation blockers remain in the repository after the live PocketBase smoke test passed.
- Manual browser verification is still recommended for the auth-gated app flow before the broader story closeout work continues.

## Completion Summary
Implemented the PocketBase backend foundation for invite-only use:

- Added `pb_migrations/001_create_users_auth.js` to lock down the built-in PocketBase `users` auth collection for invite-only onboarding.
- Added `pb_migrations/002_create_card_progress.js` to store per-user SRS state and lock access to each user's own records.
- Added `pb_migrations/003_create_superuser.js` as a bootstrap safeguard for the initial PocketBase admin.
- Added `scripts/pocketbase-bootstrap.mjs` plus local-dev and smoke-test wiring so PocketBase can be downloaded, bootstrapped, and migrated automatically when needed.
- Added repo-contained deployment examples for Nginx and systemd.
- Added `.env.example`, README setup/run/backup guidance, and invite-only onboarding docs.
- Added PocketBase setup docs that explain first-run startup, backups, and manual account creation.

Verification completed in-repo:
- `npm test`
- `npm run build`
- `npm run smoke:pocketbase`

Readiness: the backend foundation is now ready for closeout from a repository standpoint; remaining work is the manual browser-level auth-flow verification handled in the broader story process.
