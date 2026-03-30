# Project — Plan

**Created:** 2026-03-29  
**Last updated:** 2026-03-29

---

## What we're building
A Svelte + Vite + TypeScript single-page flashcard app (POC) to teach the ~300 most frequent Quranic Arabic words. V1 is a minimal study flow: 10 new words + up to 5 due reviews per session, simplified SM-2 SRS, localStorage persistence (via a StorageAdapter), Arabic+English cards, example Quranic verse per card, and Web Speech API pronunciation. Code will be organized so core logic is framework- and platform-agnostic for reuse in a Capacitor-wrapped Android app (v2).

## What we're not building (v1 scope)
- User accounts, cloud sync, or any backend
- Typing/spelling input modes or grammar lessons
- Gamification, leaderboards, or advanced analytics
- Native reciter audio (v2)

## Features (v1 priorities)
- Core domain modules in src/core: srs.ts, wordlist.ts (CSV parser / JSON extractor), storage-adapter.ts
- UI as Svelte components under src/ui; thin layer calling core APIs
- PWA basics (manifest + service worker) to ease Android packaging (TWA/Capacitor)
- Persistence via a StorageAdapter interface (localStorage now, Capacitor storage later)
- Web Speech API for pronunciation with a pluggable TTS adapter for native fallback
- Simple Stats and Word List views for verification

## Implementation approach
- Scaffold a Vite + Svelte + TypeScript starter. Keep core logic in src/core and UI in src/ui.
- Use vite-plugin-pwa to add offline support; build output (dist) will be configured as the Capacitor webDir for v2.
- Convert the intake CSV to a small JSON at build-time (or parse in-browser for quick iteration) and keep the CSV in .context/intake as the canonical source.
- Maintain adapter interfaces (StorageAdapter, TTSAdapter) so native Capacitor plugins can be swapped in v2 without rewriting core logic.
- Story-004 will scaffold the project; story-002 implements the study flow on top of that scaffold.

## Story queue
| Story | Title | Status | Blocks |
|---|---|---|---|
| story-001.md | Scope & foundation — confirm v1 shape and constraints | in-progress | story-004.md, story-002.md |
| story-004.md | Scaffold Svelte + Vite + TypeScript starter (core modules & adapters) | not-started | story-002.md |
| story-002.md | Core happy path — implement study flow & persistence | not-started | story-003.md |
| story-003.md | Verification & polish — stats, word list, edge cases | not-started | — |

## Replanning log
- 2026-03-29: Chosen stack Svelte + Vite + TypeScript. Added scaffold story (story-004) and adapter-driven architecture to ease v2 Capacitor migration.
