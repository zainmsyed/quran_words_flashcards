# Story 001: Scope & foundation — confirm v1 shape and constraints

**Status:** completed  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-30  
**Completed:** 2026-03-30

---

## Goal
Define a tight, testable v1: a single-page Svelte + Vite + TypeScript flashcard POC that teaches the top Quranic words with a simplified SRS, localStorage persistence (StorageAdapter), Arabic+English text, example Quranic verse per card, and Web Speech pronunciation. Ensure the code layout favors reuse for a Capacitor Android wrapper (v2).

## Verification
You confirm the plan, chosen stack (Svelte + Vite + TypeScript), and the refined story queue (including a scaffold story) so we can proceed to scaffold and implement.

## Scope — files this story may touch
- .context/stories/plan.md
- .context/intake/prd/quranic-flashcards-prd.md
- .context/intake/dictionaries/quran_300_words.csv
- .context/intake/references/quranic-flashcards-poc.html
- New app files and folders: package.json, vite.config.ts, tsconfig.json, src/core/, src/ui/, public/, dist/

## Out of scope — do not touch
- Backend services, user accounts, cloud sync
- Typing/spelling input modes, gamification
- Native reciter audio (v2)

## Dependencies
- Requires: none
- Blocks: story-004, story-002

---

## Checklist
- [x] Confirm v1 acceptance criteria (UI, SRS, persistence, pronunciation)
- [x] Confirm Svelte + Vite + TypeScript as the chosen stack for v1
- [x] Approve the scaffold plan (story-004) so the agent can create the starter project layout

---

## Issues
- Repository currently contains agent tooling but no app files; intake holds the POC HTML and CSV word list.

---

## Completion Summary
Work completed (short): the repository now contains a minimal Svelte + Vite + TypeScript POC implementing the core v1 acceptance criteria. The following features and modules are present and wired together for a simple study flow:

- Single-page Svelte app (src/) bootstrapped with Vite (vite.config.ts) and TypeScript (tsconfig.json).
- Core domain modules under src/core:
  - srs.ts: simplified spaced-repetition logic (initial state + rating application)
  - storage-adapter.ts: StorageAdapter interface with a browser/localStorage implementation
  - tts-adapter.ts: Web Speech API wrapper with Arabic-voice selection and transliteration fallback
  - wordlist.ts + src/data/seed-words.json: seeded words including Arabic text, English glosses, example Quranic verse and reference
- UI components under src/ui:
  - components/Card.svelte: flip card showing Arabic (RTL) front, English + verse back, TTS play/stop, rating buttons
  - StudySession.svelte: session orchestration (loads words, restores/persists card states, advances deck)
- Basic app shell (src/App.svelte, src/main.ts, index.html) and styling (src/app.css).
- package.json scripts for dev/build/preview and a minimal svelte.config.js for preprocessing.

Files added/updated (representative):
- package.json, vite.config.ts, tsconfig.json, svelte.config.js
- index.html
- src/app.css, src/App.svelte, src/main.ts
- src/core/srs.ts, src/core/storage-adapter.ts, src/core/tts-adapter.ts, src/core/wordlist.ts
- src/data/seed-words.json
- src/ui/StudySession.svelte, src/ui/components/Card.svelte
- .context/stories/plan.md (project plan)

Notes / verification:
- SRS: implemented in src/core/srs.ts (initialCardState + applyRatingToCard). It's intentionally simplified but behaves as the v1 SRS described in the plan.
- Persistence: browser/localStorage adapter is present and used by StudySession to save card states under key 'qfc2_states'.
- Pronunciation: Web Speech integration in src/core/tts-adapter.ts with fallback transliteration; Card.svelte exposes play/stop controls.
- UI: cards display Arabic (RTL), English gloss, and an example verse; StudySession walks through a small deck and persists ratings.

Next steps (recommended):
- Mark story-004 (scaffold) as completed or reconcile its status with the existing scaffold files.
- Proceed to story-002 to implement/reinforce study flow features (session size limits, due review selection, stats view, CSV → build-time JSON conversion).

Completion verified by repository inspection on 2026-03-30. If you'd like, I can also update story-004 to reflect the scaffold completion and/or open a PR with these changes.
