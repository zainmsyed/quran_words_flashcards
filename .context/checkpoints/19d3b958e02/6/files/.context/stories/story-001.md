# Story 001: Scope & foundation — confirm v1 shape and constraints

**Status:** in-progress  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-29  
**Completed:** —

---

## Goal
Define a tight, testable v1: a single-page static flashcard POC (HTML/CSS/JS) that teaches the top Quranic words with a simplified SRS, localStorage persistence, Arabic+English text, example Quranic verse per card, and Web Speech pronunciation.

## Verification
The user confirms the plan and the three starter stories reflect the agreed v1 scope, constraints, and implementation approach.

## Scope — files this story may touch
- .context/stories/plan.md
- .context/intake/prd/quranic-flashcards-prd.md
- .context/intake/dictionaries/quran_300_words.csv
- .context/intake/references/quranic-flashcards-poc.html
- New app files: web/index.html, web/app.js, web/styles.css

## Out of scope — do not touch
- Backend services, user accounts, cloud sync
- Typing/spelling input modes, gamification
- Native reciter audio (v2)

## Dependencies
- Requires: none
- Blocks: story-002, story-003

---

## Checklist
- [ ] Confirm v1 acceptance criteria (UI, SRS, persistence, pronunciation)
- [ ] Record explicit non-goals and risky assumptions (no backend, CSV as source)
- [ ] Approve the first implementation slice: copy/adapt intake POC into `web/` and wire CSV → study flow

---

## Issues
- Repository currently contains agent tooling but no app files; intake holds the POC HTML and CSV word list.

---

## Completion Summary
