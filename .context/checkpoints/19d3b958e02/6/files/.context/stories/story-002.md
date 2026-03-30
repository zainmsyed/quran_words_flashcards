# Story 002: Core happy path — implement study flow & persistence

**Status:** not-started  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-29  
**Completed:** —

---

## Goal
Implement a minimal single-page study flow that: loads the word list, presents cards (Arabic ↔ English), supports flip and three self-rating buttons (Hard/Got it/Easy), applies a simplified SM-2 SRS, and persists card state to `localStorage`.

## Verification
Manual browser test: open `web/index.html`, start a session, encounter 10 new words and up to 5 reviews, use the rating buttons; confirm `localStorage` contains keys `qfc2_cards` and `qfc2_stats` and that progress survives a page reload.

## Scope — files this story may touch
- Create `web/index.html`, `web/app.js`, `web/styles.css`
- Read from `.context/intake/dictionaries/quran_300_words.csv` (parse in-browser or convert to JSON)
- Optionally reuse `quranic-flashcards-poc.html` from intake as a starting point

## Out of scope — do not touch
- Server-side code or user accounts
- Full 300-word import tuning (v2)

## Dependencies
- Requires: story-001
- Blocks: story-003

---

## Checklist
- [ ] Copy/adapt intake POC into `web/` and ensure it loads in modern browsers
- [ ] Parse CSV and populate an initial deck of 10 new + up to 5 due reviews
- [ ] Implement card flip and three rating buttons
- [ ] Implement simplified SRS scheduling and update intervals
- [ ] Persist state to `localStorage` and validate reload persistence

---

## Issues
- Need to decide whether to parse CSV client-side or commit a JSON extraction

---

## Completion Summary
