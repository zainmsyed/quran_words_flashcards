# AGENTS.md

## Project
- Name: Quranic Flashcards (repo: arabic_flashcards)
- Goal: Ship a maintainable single-page Svelte + Vite + TypeScript POC that teaches the most frequent Quranic words with a simplified SRS and local persistence; prepare for an Android wrapper (Capacitor) in v2.
- Stack: Svelte + Vite + TypeScript for UI and core logic; Capacitor for Android v2; agent tooling lives in .pi (TypeScript).

## Important Paths
- .context/intake/ — PRD, CSV wordlist, POC HTML (source planning inputs)
- .context/stories/ — plan and story files (working backlog)
- .context/memory/ — agent memory and rules
- .pi/extensions/ — Vazir agent extensions (do not edit casually)
- src/ (planned) — core/ and ui/ modules (Svelte app)
- public/ or web/ — static assets and PWA manifest
- package.json, vite.config.ts, tsconfig.json (project config)

## Fragile Areas
- .pi/extensions/* — editing these TypeScript files changes agent behavior and should be done carefully.
- AGENTS.md and plan files initially empty — keep metadata updated to avoid confusion.
- Intake folder is the canonical planning input; changes there may alter requirements unexpectedly.

## Working Notes
- Chosen stack: Svelte + Vite + TypeScript. Story-004 will scaffold the starter project.
- Keep core logic in src/core so UI and platform wrappers can be swapped without a rewrite.
- For v1 prefer build-time CSV → JSON extraction to simplify client load; keep CSV as source of truth.
- For v2 use Capacitor and implement StorageAdapter / TTSAdapter to swap native plugins.
