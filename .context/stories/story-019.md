# Story 019: Security automation — dependency scanning, secret scanning, and audit gates

**Status:** not-started  
**Created:** 2026-04-18  
**Last accessed:** 2026-04-18  
**Completed:** —

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
- [ ] Add a reusable security-check entry point that runs dependency and secret-scanning gates.
- [ ] Wire the security check into CI for pull requests and pushes.
- [ ] Document how to run the security check locally and what to do when it fails.
- [ ] Verify the security check passes against the current repository state.

## Issues
- None yet.

## Completion Summary
- Pending implementation.
