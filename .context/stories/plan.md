# Project — Plan

**Created:** 2026-03-29  
**Last updated:** 2026-04-18

---

## What we're building
A Quranic Flashcards Svelte + Vite + TypeScript SPA for a small invited group of friends and family. Keep the original flashcard study flow and word deck from the PRD, but add a Bauhaus-inspired visual refresh across the app while preserving existing auth and study behaviour.

The app will use a custom Svelte login gate and account screens. PocketBase remains the source of truth for authentication and per-user study progress. Visual updates are limited to UI/UX, layout, typography, and color — no changes to study mechanics, SRS, or backend contracts in v1 of this visual refresh.

## What we're not building (v1 scope)
- Changes to study mechanics or SRS behavior
- Open self-registration or public signup
- Migration/import of old localStorage study data
- Offline/PWA mode that works without PocketBase
- Native plugin wiring or broader stack changes

## Features (v1 priorities)
- Mobile-first Bauhaus-inspired visual refresh: typography, color palette, rectangular geometry, and responsive layouts
- Preserve study flow, login, and persistence behavior
- Add Google Fonts for Space Grotesk, Work Sans, and Noto Naskh Arabic
- Replace color tokens and radii in src/app.css; restyle components and shared surfaces

## Implementation approach
- Keep the Svelte + Vite + TypeScript frontend stack unchanged.
- Apply the visual update incrementally per-screen in small, testable stories.
- Treat PocketBase and auth as required runtime infrastructure; do not change auth or study logic.
- Preserve existing story files and history; append new stories for the UI refresh only.

## Story queue
| Story | Title | Status | Blocks |
|---|---|---|---|
| story-001.md | PocketBase backend foundation — schema, rules, and deployment kit | not-started | story-002.md, story-003.md, story-004.md |
| story-002.md | Custom auth gate — login, logout, and app access control | not-started | story-003.md, story-004.md |
| story-003.md | Per-user progress sync — replace localStorage with PocketBase | not-started | story-004.md |
| story-004.md | Account settings — change password, reset password, and invite-only onboarding docs | not-started | — |
| story-005.md | Theme & fonts — add Google Fonts and update CSS tokens | not-started | — |
| story-006.md | App shell & topbar/brand — rectangular brand-mark and topbar restyle | not-started | story-005.md |
| story-007.md | Card component restyle — typography, colors, rectangular controls | not-started | story-005.md, story-006.md |
| story-008.md | StudySession & session chrome — toolbar, progress, responsiveness | not-started | story-007.md |
| story-009.md | WordList & Stats restyle — list rows, stat cards, badges | not-started | story-005.md |
| story-010.md | Settings & VoiceSettings restyle — panels and nav | not-started | story-005.md |
| story-011.md | QA / responsive polish — cross-screen fixes and accessibility | not-started | story-005.md, story-006.md, story-007.md, story-008.md, story-009.md, story-010.md |
| story-013.md | Audio provider & format decision — choose the bundled Arabic pronunciation pipeline | not-started | story-014.md |
| story-014.md | Full 300-word static audio pipeline — generate, normalize, and bundle pronunciation assets | not-started | story-015.md |
| story-015.md | Runtime audio coverage & fallback hardening — use bundled pronunciation across the seed deck | not-started | — |
| story-016.md | Study session quota engine — cap sessions at 15 cards with 10 new / 5 review mix | not-started | — |
| story-017.md | Coolify deployment hardening baseline — TLS, proxy, headers, and least-privilege hosting | not-started | story-018.md |
| story-018.md | App security hardening — auth/session safety and sensitive UI paths | not-started | story-019.md |
| story-019.md | Security automation — dependency scanning, secret scanning, and audit gates | not-started | — |

## Scope addendum — 2026-04-14 static Arabic audio expansion
- Preserve existing UI refresh story history; add new stories only for the Arabic audio expansion.
- Replace the current 10-file prototype approach with a standardized build-time pipeline for the full current 300-word seed deck.
- Prefer one bundled static pronunciation file per word, committed to the repo and deployed as static assets.
- Minimize VPS/runtime resource usage first, then optimize for pronunciation quality, playback speed, and storage size.
- Keep browser speech only as a fallback when bundled audio is missing or fails to play.
- Start with a decision story to choose the best provider and output format before batch generation.
- Do not add multiple bundled voices, runtime cloud TTS, manual recording/admin upload tooling, or separate PWA/offline-cache work in this scope.

## Scope addendum — 2026-04-16 reinforced study flow sizing
- Cap each study session at 15 total cards.
- Prefer 10 new words plus up to 5 due reviews when possible.
- If at least 5 new words are available, keep the session anchored around 10 new words and fill remaining slots with reviews up to 15 total.
- If fewer than 5 new words are available, use all available new words and fill the rest with reviews.
- If no due reviews are available, cap the session at 10 new words.
- Select the oldest due reviews first, then randomize the final queue order if desired as long as the quota rules are preserved.
- Keep auth, account, audio, and deck scope unchanged; do not change SRS interval math beyond session composition.

## Scope addendum — 2026-04-18 security hardening replan
- Focus the next phase on security hardening for an invite-only deployment that is primarily hosted through Coolify on a generic VPS where PocketBase and the app share the same host.
- Prioritize server hardening first, then application/code hardening, then lightweight automated security checks.
- Keep the deployment generic enough to work on any VPS provider that can run Coolify; do not bake in Hetzner-only assumptions.
- Defer backups/restore drills, WAF/CDN/DDoS services, public signup, and broader platform changes to a later phase.
- Add story-017 through story-019 for Coolify deployment hardening, app hardening, and security automation without overwriting preserved history.

## Replanning log
- 2026-04-09: Replanned v1 to layer PocketBase auth onto the original study app. Confirmed invite-only manual onboarding for a small friends-and-family group, custom Svelte auth UI, change-password plus forgot/reset-password flows, PocketBase-backed persistence, repo-contained deployment files/instructions, and a fresh start with no localStorage migration.
- 2026-04-12: Replanned visual update to a Bauhaus-inspired theme across all screens. Decisions: replace palette with a red/yellow/near‑black Bauhaus palette and add a success green (#1E7A4A); load Space Grotesk (headings), Work Sans (UI/body), and Noto Naskh Arabic (Arabic script); convert pill-shaped surfaces to rectangular 6px-radius geometry; brand-mark set to a rectangular red box with the Arabic letter "ا" and app name "alif" in Space Grotesk. Added story-005 through story-011 to implement fonts, tokens, topbar/brand, card restyle, session chrome, WordList/Stats, Settings/VoiceSettings, and QA/responsive polish. Preserved existing study/auth behavior and story history.
- 2026-04-14: Replanned audio scope around full bundled pronunciation coverage for the current 300-word seed deck. Decisions: prefer static audio files committed to the repo and served by the app; keep one pronunciation per word; allow build-time external TTS; preserve browser speech only as a fallback when bundled audio is missing or fails; prioritize minimal VPS usage first, then pronunciation quality, playback speed, and storage size; treat offline as a stretch benefit only if it falls out naturally from static assets. Added story-013 through story-015 to choose the provider/format, generate the full bundled audio set, and harden runtime audio coverage without overwriting existing story history.
- 2026-04-16: Replanned the study flow so sessions cap at 15 cards and prefer 10 new words plus up to 5 due reviews when possible. Sessions should use all available new words when fewer than 10 are available, never exceed 15 total, prefer the oldest due reviews first, and randomize the final order only after the quota rules are satisfied. Added story-016 to implement the quota engine and its verification.
- 2026-04-18: Replanned the project around security hardening for an invite-only deployment primarily managed through Coolify on a generic VPS with the app and PocketBase sharing the same host. Decisions: prioritize server hardening first, then application/code hardening, then lightweight automated security checks; keep the deployment generic enough to work on any VPS provider that can run Coolify; defer backups/restore drills, WAF/CDN/DDoS services, public signup, and broader platform changes to a later phase. Added story-017 through story-019 to implement the Coolify deployment baseline, patch app-layer security issues, and add security automation without overwriting preserved story history.
