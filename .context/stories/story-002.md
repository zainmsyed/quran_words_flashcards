# Story 002: Core happy path — implement study flow & persistence

**Status:** in-progress  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-30  
**Completed:** —

---

## Goal
Implement a minimal single-page study flow on top of the Svelte + Vite scaffold: load the word list, present cards (Arabic ↔ English), support flip and three self-rating buttons (Hard/Got it/Easy), apply a simplified SM-2 SRS, select a session queue (new + due reviews), and persist card state via the StorageAdapter.

## Current progress / Work started
- Core modules exist: src/core/srs.ts (SRS logic), src/core/storage-adapter.ts (browser localStorage), src/core/wordlist.ts (seed loader and transliteration normalization).
- UI components implemented: src/ui/components/Card.svelte and src/ui/StudySession.svelte provide flip, rating buttons, TTS play and persistence integration.
- Data: intake CSV was converted into src/data/seed-words.json (diacritized Arabic). The app loads this JSON at runtime via the wordlist loader.
- TTS: added src/core/tts-adapter.ts improvements, a voice picker UI (src/ui/VoiceSettings.svelte), and a local-audio-first fallback (public/audio/*.mp3). A gTTS generator script (scripts/generate_audio_gtts.py) was added as a POC and the first 10 MP3s were generated and committed.

Remaining / next tasks for this story
- Implement proper session queue building (reviews due selection + up to N new cards). The current StudySession uses a simple slice for new cards; reviews selection needs to be added.
- Add stats view and word list view (recent progress, mastered counts, accuracy) or wire up existing UI to use persisted state.
- Move CSV → JSON extraction into a build-time script (or confirm the in-repo generator) for reproducible builds.

## Verification
Developer test: from the project root run `npm install` and `npm run dev`, open the dev server in a browser, start a session, see 10 new words by default, use rating buttons; confirm the StorageAdapter stores card states under key 'qfc2_states' and progress survives a page reload. For full acceptance implement review selection and stats.

## Scope — files this story may touch
- `src/core/` (srs.ts, storage-adapter.ts, wordlist.ts)
- `src/ui/` (Svelte components: Card, StudySession, Stats, VoiceSettings)
- `public/` (audio assets) and build scripts

## Out of scope — do not touch
- Server-side code or user accounts
- Full 300-word import tuning (v2)

## Checklist
- [x] Implement core domain modules: SRS, wordlist loader, storage adapter
- [x] Create Svelte components for card, study session, and rating buttons
- [x] Wire CSV → JSON extraction or in-browser parser and populate initial deck (seed JSON present)
- [x] Persist state using StorageAdapter and verify reload
- [x] Ensure Web Speech API calls are available from the UI via a TTS adapter
- [ ] Implement session queue rules: due review selection + new card limits
- [ ] Add stats and word-list UI wired to the persistent state

---

## Issues
- Decide on CSV → JSON extraction at build time vs. in-browser parsing (build-time JSON is preferred for v1)

---

## Notes
Starting work on session queue selection and stats. I will implement review selection logic next: pick up to REVIEW_PER_SESSION due cards sorted by due date, then fill with NEW_PER_SESSION new cards, persist the queue metadata and surface it in StudySession.


## Completion Summary
