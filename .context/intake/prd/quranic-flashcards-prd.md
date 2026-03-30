# Product Requirements Document — Quranic Arabic Flashcard App

**Version:** 1.0  
**Date:** March 2026  
**Status:** POC Complete

---

## Overview

A browser-based spaced repetition flashcard app designed to help users build Quranic Arabic vocabulary systematically. The goal is to make daily study sessions short, approachable, and effective — targeting the ~300 most frequent Quranic words that account for roughly 80% of the Quran's vocabulary.

---

## Goals

- Help users reach functional Quranic reading comprehension through daily 5–10 minute study sessions
- Make the learning curve non-intimidating by limiting each session to a fixed number of new words
- Reinforce difficult words through spaced repetition so time is spent where it matters most

---

## Core Features (v1.0 — Shipped)

### Flashcard Engine

- Cards show either Arabic → English or English → Arabic, randomized per card
- Card flips both directions (reveal and un-reveal) — tap once to reveal, tap again to return to front
- Arabic pronunciation via Web Speech API (`lang: ar-SA`, rate 0.8) available on every card regardless of which side is shown first

### Spaced Repetition

- Three self-rating buttons after revealing an answer:
  - **Hard** — re-queues card in current session, shortens interval to 0.25 days
  - **Got it** — interval × 1.2, minimum 1 day
  - **Easy** — interval × ease factor, minimum 3 days
- Ease factor starts at 2.5 per card, adjusts based on ratings (range 1.3–3.5)
- Cards considered "mastered" once interval ≥ 3 days

### Daily Lesson Structure

- **10 new words + up to 5 due reviews** per session
- New and review counts displayed as tags on the study screen
- Hard cards are re-queued within the same session until marked Got it or Easy
- Session ends with a summary of new vs. review performance

### Quranic Context

- Every card shows an authentic Quranic verse using the word, with Arabic text and English translation
- Verse reference (surah:ayah) included with each example

### Progress Tracking

- **Stats screen:** total cards studied, mastered count, easy rate %, day streak
- **Word list screen:** all words grouped by mastered / learning / not yet seen
- Day streak tracked via localStorage with date-comparison logic

### Persistence

- All card state and stats saved to `localStorage`
- Survives page refresh and return visits in the same browser
- Storage keys: `qfc2_cards`, `qfc2_stats`

---

## Word List

Current POC includes **30 core words**. Target vocabulary list is the top ~125–300 most frequent Quranic words.

Sources to draw from:
- *Word by Word Quran* — Dr. Shehnaz Shaikh & Ms. Kausar Khatri
- *Vocabulary of the Quran* — Dr. Abdul Karim Kunchi
- [corpus.quran.com](https://corpus.quran.com) frequency tables

Knowing ~300 words covers roughly **80% of Quranic vocabulary**.

---

## Technical Notes

| Item | Detail |
|---|---|
| Stack | Pure HTML / CSS / JS — no framework, no backend |
| Persistence | `localStorage` — keys `qfc2_cards` and `qfc2_stats` |
| Speech | Web Speech API, `lang: ar-SA`, rate 0.8 |
| Arabic font | Amiri (Google Fonts) — high-quality Quranic typeface |
| SRS algorithm | Simplified SM-2 variant |
| Deployment | Single `.html` file — open in any browser |

---

## Planned Features (v2.0+)

| Feature | Notes |
|---|---|
| Full 300-word vocabulary | Expand from 30 → 300 words in Quranic frequency order |
| User word upload | Allow pasting a CSV / word list from their own book |
| Native audio | Replace Web Speech API with real reciter recordings per word |
| Root word grouping | Group words by Arabic root (e.g., ك-ت-ب for book/writing words) |
| Offline PWA | Service worker + manifest so the app installs to mobile home screen |
| Progress export | Export study history as CSV |
| Custom session length | Let user choose 5 / 10 / 15 new words per session |
| Dark mode toggle | Manual override (currently auto-follows system preference) |

---

## Non-Goals (v1.0)

- No user accounts or cloud sync
- No typing / spelling input mode
- No grammar instruction (vocabulary only)
- No gamification / leaderboards
- No backend or server dependency
