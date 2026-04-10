# Project — Plan

**Created:** 2026-03-29  
**Last updated:** 2026-04-09

---

## What we're building
A Quranic Flashcards Svelte + Vite + TypeScript SPA for a small invited group of friends and family. Keep the original flashcard study flow and word deck from the PRD, but add a PocketBase auth/persistence layer in-repo.

The app will use a custom Svelte login gate and account screens. PocketBase is the source of truth for authentication and per-user study progress. If PocketBase is unavailable, the app is unavailable.

## What we're not building (v1 scope)
- Open self-registration or public signup
- OAuth/social login
- Migration/import of old localStorage study data
- Offline/PWA mode that works without PocketBase
- Native plugin wiring or broader stack changes
- New study mechanics beyond the original PRD

## Features (v1 priorities)
- Invite-only PocketBase auth with manual admin account creation
- Custom Svelte auth UI: login gate, logout, account/profile view, change password, forgot/reset password
- PocketBase-backed persistence for user study progress and stats
- Repo-contained deployment assets: PocketBase migrations, access rules, Nginx, systemd, env templates, and README setup notes
- Preserve the existing study flow, SRS behavior, card content, stats, and word list screens

## Implementation approach
- Keep the Svelte + Vite + TypeScript frontend stack unchanged.
- Add a small PocketBase client/auth layer under `src/core` and auth-related UI under `src/ui`.
- Treat PocketBase as required runtime infrastructure; show a login gate or unavailable state until auth/server readiness is confirmed.
- Define schema and access rules in version-controlled PocketBase migration files.
- Document manual invite-only provisioning and password recovery in repo docs.
- Do not rely on localStorage for persisted study data; start fresh on the PocketBase side.

## Story queue
| Story | Title | Status | Blocks |
|---|---|---|---|
| story-001.md | PocketBase backend foundation — schema, rules, and deployment kit | not-started | story-002.md, story-003.md, story-004.md |
| story-002.md | Custom auth gate — login, logout, and app access control | not-started | story-003.md, story-004.md |
| story-003.md | Per-user progress sync — replace localStorage with PocketBase | not-started | story-004.md |
| story-004.md | Account settings — change password, reset password, and invite-only onboarding docs | not-started | — |

## Replanning log
- 2026-04-09: Replanned v1 to layer PocketBase auth onto the original study app. Confirmed invite-only manual onboarding for a small friends-and-family group, custom Svelte auth UI, change-password plus forgot/reset-password flows, PocketBase-backed persistence, repo-contained deployment files/instructions, and a fresh start with no localStorage migration.
