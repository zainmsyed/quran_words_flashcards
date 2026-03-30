# Story 002: Core happy path — implement study flow & persistence

**Status:** not-started  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-29  
**Completed:** —

---

## Goal
Implement a minimal single-page study flow on top of the Svelte + Vite scaffold: load the word list, present cards (Arabic ↔ English), support flip and three self-rating buttons (Hard/Got it/Easy), apply a simplified SM-2 SRS, and persist card state via the StorageAdapter.

## Verification
Developer test: from the project root run `npm install` and `npm run dev`, open the dev server in a browser, start a session, encounter 10 new words + up to 5 reviews, use rating buttons; confirm the StorageAdapter stores state (localStorage keys `qfc2_cards`, `qfc2_stats`) and that progress survives a page reload.

## Scope — files this story may touch
- `src/core/` (srs.ts, storage-adapter.ts, wordlist.ts)
- `src/ui/` (Svelte components: Card, StudySession, Stats)
- `public/` (manifest, icons) and Vite config
- Build step or small script to extract CSV → JSON from `.context/intake/dictionaries/quran_300_words.csv`

## Out of scope — do not touch
- Server-side code or user accounts
- Full 300-word import tuning (v2)

## Dependencies
- Requires: story-004 (scaffold)
- Blocks: story-003

---

## Checklist
- [ ] Implement core domain modules: SRS, wordlist loader, storage adapter
- [ ] Create Svelte components for card, study session, and rating buttons
- [ ] Wire CSV → JSON extraction or in-browser parser and populate initial deck (10 new + up to 5 reviews)
- [ ] Persist state using StorageAdapter and verify reload
- [ ] Ensure Web Speech API calls are available from the UI via a TTS adapter

---

## Issues
- Decide on CSV → JSON extraction at build time vs. in-browser parsing (build-time JSON is simpler for v1)

---

## Completion Summary
