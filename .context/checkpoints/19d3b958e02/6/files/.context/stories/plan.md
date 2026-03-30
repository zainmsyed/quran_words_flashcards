# Project — Plan

**Created:** 2026-03-29  
**Last updated:** 2026-03-29

---

## What we're building
A single-page static flashcard web app (POC) to teach the ~300 most frequent Quranic Arabic words. V1 is a minimal study flow: 10 new words + up to 5 due reviews per session, simplified SM-2 SRS, localStorage persistence, Arabic + English, example Quranic verse per card, and Web Speech API pronunciation.

## What we're not building (v1 scope)
- User accounts, cloud sync, or any backend
- Typing/spelling input modes or grammar lessons
- Gamification or leaderboards
- Native audio recordings (Web Speech API only)

## Features (v1 priorities)
- Import top words from .context/intake/dictionaries/quran_300_words.csv
- Minimal UI: card front/back, flip, three rating buttons (Hard/Got it/Easy)
- SRS scheduling and localStorage keys: `qfc2_cards`, `qfc2_stats`
- Show Quranic example verse + translation per card (use intake POC if needed)
- Simple stats and word-list screens for verification

## Implementation approach
- Seed app from .context/intake/references/quranic-flashcards-poc.html into `web/index.html` and adapt JS/CSS into `web/app.js` and `web/styles.css`.
- Use the CSV in .context/intake/dictionaries/ as the canonical word list; convert to JSON at build-time or parse in-browser.
- Keep the codebase framework-free (plain JS) to match the PRD.

## Story queue
| Story | Title | Status | Blocks |
|---|---|---|---|
| story-001.md | Scope & foundation — confirm v1 shape and constraints | in-progress | story-002.md, story-003.md |
| story-002.md | Core happy path — implement study flow & persistence | not-started | story-003.md |
| story-003.md | Verification & polish — stats, word list, edge cases | not-started | — |

## Replanning log
- 2026-03-29: Refined plan from intake PRD and POC. Awaiting one clarifying question about repository layout before implementing.
