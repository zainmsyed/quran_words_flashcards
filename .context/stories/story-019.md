# Story 019: Security automation — dependency scanning, secret scanning, and audit gates

**Status:** complete  
**Created:** 2026-04-18  
**Last accessed:** 2026-04-19  
**Completed:** 2026-04-19

## Goal
Add lightweight automated security checks so dependency issues and obvious secret leaks are caught before code lands.

## Verification
Run the new security check locally or in CI and confirm it exits cleanly on the current repo state.

## Scope
- .github/workflows/security.yml
- package.json
- scripts/security-check.mjs (new or updated helper)
- docs/security.md (or equivalent short docs note)

## Out of scope
- VPS/server hardening
- Application code security fixes
- Backup/restore operations
- Full penetration testing or external scanning services

## Dependencies
- story-018.md

## Checklist
- [x] Add a reusable security-check entry point that runs dependency and secret-scanning gates.
  - Implemented: `scripts/security-check.mjs` runs `npm audit --json --audit-level=high` plus a tracked-text secret scan.
- [x] Wire the security check into CI for pull requests and pushes.
  - Implemented: `.github/workflows/security.yml` runs the security gate on both `push` and `pull_request`.
- [x] Document how to run the security check locally and what to do when it fails.
  - Implemented: `docs/security.md` explains `npm run security-check`, the expected warnings, and the remediation path when the gate fails.
- [x] Verify the security check passes against the current repository state.
  - Verification: `npm run security-check` exits cleanly on the current repo state. It reports 7 moderate npm audit advisories as warnings, but no high/critical advisories or obvious secret leaks.

## Issues
- No code-level blockers. The current toolchain still reports moderate npm audit advisories, but the security gate intentionally warns rather than fails on them so the repo can pass while upgrades are scheduled.

## Completion Summary
Implemented a lightweight security automation baseline for the repo:
- Added `scripts/security-check.mjs`, a reusable entry point that combines a dependency-audit gate (`npm audit` with high/critical failure threshold) and a tracked-text secret scan.
- Added `.github/workflows/security.yml` so the security gate runs on both pushes and pull requests.
- Added `docs/security.md` with local usage, failure guidance, and notes about the intentionally lightweight scope.
- Added the `security-check` npm script to `package.json`.
- Verified the check with `npm run security-check`; it passed on the current repository state.

Notes:
- The gate currently treats moderate npm audit findings as warnings so the repo can keep moving while upgrades are planned.
- The secret scan is intentionally lightweight and only targets obvious leaks in tracked text files; it is not a replacement for dedicated external scanning.
