# Story 004: Scaffold Svelte + Vite + TypeScript starter (core modules & adapters)

**Status:** not-started  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-29  
**Completed:** —

---

## Goal
Create a Capacitor-ready Svelte + Vite + TypeScript starter layout with core domain modules separated for reuse. Provide minimal working app bootstrapped so the core study flow can be implemented without reworking project structure later.

## Verification
Developer test: from repo root run `npm install` and `npm run dev` and confirm the Vite dev server starts and the app UI shows a minimal placeholder (App.svelte) that imports core modules. `npm run build` should produce a `dist/` folder suitable for Capacitor webDir.

## Scope — files this story may touch / create
- package.json (scripts: dev, build, preview)
- tsconfig.json
- vite.config.ts (Svelte plugin and PWA plugin stub)
- src/main.ts, src/App.svelte
- src/core/srs.ts (stubbed implementation), src/core/storage-adapter.ts (browser adapter), src/core/wordlist.ts (CSV -> JSON helper)
- src/ui/components/ (Card.svelte, StudySession.svelte placeholder)
- public/ (index.html or Vite template, manifest.webmanifest, icons)
- .gitignore additions for node_modules, dist
- Optional: capacitor.config.ts example and README notes for v2

## Out of scope — do not touch
- Full SRS tuning and complete UI implementation
- Native plugin wiring for Capacitor (v2)

## Dependencies
- Requires: story-001
- Blocks: story-002

---

## Checklist
- [ ] Create Vite + Svelte + TypeScript project scaffold files
- [ ] Add src/core module stubs (SRS, storage adapter, wordlist) with TypeScript types
- [ ] Add src/ui minimal Svelte components and placeholder UI
- [ ] Add basic package.json scripts and dev/build validation
- [ ] Add PWA plugin placeholder and manifest
- [ ] Add capacitor.config.ts example in repo root for later v2 use

---

## Issues
- Choose package manager (defaults to npm). If you prefer yarn/pnpm, tell the agent before scaffolding.

---

## Completion Summary
