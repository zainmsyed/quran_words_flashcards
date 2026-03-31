# Story 002: Core happy path — implement study flow & persistence

**Status:** completed  
**Created:** 2026-03-29  
**Last accessed:** 2026-03-31  
**Completed:** 2026-03-31

---

## Goal
Implement a minimal single-page study flow on top of the Svelte + Vite scaffold: load the word list, present cards (Arabic ↔ English), support flip and three self-rating buttons (Hard/Got it/Easy), apply a simplified SM-2 SRS, select a session queue (new + due reviews), and persist card state via the StorageAdapter.

## Current progress / Work started
- Core modules exist: src/core/srs.ts (SRS logic + normalized persisted state), src/core/storage-adapter.ts (browser localStorage), src/core/wordlist.ts (canonical seed loader + transliteration normalization).
- UI components implemented: src/ui/components/Card.svelte, src/ui/StudySession.svelte, src/ui/Stats.svelte, and src/ui/WordList.svelte provide flip, rating buttons, session queue handling, progress stats, and word-group views.
- Data: the intake dictionary is treated as the app’s canonical 300-word list; it was converted into src/data/seed-words.json (diacritized Arabic). The app loads this JSON at runtime via the wordlist loader.
- TTS: added src/core/tts-adapter.ts improvements, a voice picker UI (src/ui/VoiceSettings.svelte), and a local-audio-first fallback (public/audio/*.mp3). A gTTS generator script (scripts/generate_audio_gtts.py) was added as a POC and the first 10 MP3s were generated and committed.
- Persistence: session queue metadata is stored in localStorage (qfc2_session) so the user can resume a session after reload; card states are stored under qfc2_states.

Remaining / next tasks for this story
- None required for the v1 happy path; the initial study flow + persistence + stats are in place.

## Verification
Developer test: from the project root run `npm install` and `npm run dev`, open the dev server in a browser, start a session, see 10 new words by default and due reviews first when available, use rating buttons; confirm the StorageAdapter stores card states under key 'qfc2_states', session metadata under 'qfc2_session', and progress survives a page reload. Stats and word list views should reflect persisted state.

## Scope — files this story may touch
- `src/core/` (srs.ts, storage-adapter.ts, wordlist.ts)
- `src/ui/` (Svelte components: Card, StudySession, Stats, VoiceSettings, WordList)
- `public/` (audio assets) and build scripts

## Out of scope — do not touch
- Server-side code or user accounts
- Full 300-word import tuning (v2)

## Checklist
- [x] Implement core domain modules: SRS, wordlist loader, storage adapter
- [x] Create Svelte components for card, study session, and rating buttons
- [x] Populate initial deck from the canonical seed JSON (the intake CSV remains a reference source for regeneration)
- [x] Persist state using StorageAdapter and verify reload
- [x] Ensure Web Speech API calls are available from the UI via a TTS adapter
- [x] Implement session queue rules: due review selection + new card limits
- [x] Add stats and word-list UI wired to the persistent state

---

## Issues
- None for the v1 app data path: the app now uses the seed JSON as the canonical dictionary source.

---

## Notes
Story 002 is now in a good v1 state: the app builds a review-first queue, persists state/session metadata, exposes stats and word-list views, and uses local-audio-first TTS fallback with a voice picker.


## Completion Summary
Work completed (short): the core study flow is implemented end-to-end with persistence and supporting UI.

- Session building in src/ui/StudySession.svelte:
  - due reviews are selected first (sorted by due date), then new cards are added up to the session limit.
  - sessions are resumable via qfc2_session and card states persist via qfc2_states.
- Card UI in src/ui/components/Card.svelte:
  - supports Arabic-first and English-first modes, flip interaction, rating buttons, and local-audio-first playback.
- Stats and word list UI:
  - src/ui/Stats.svelte shows studied/mastered/due/easy-rate stats and recent progress.
  - src/ui/WordList.svelte groups the deck into mastered, learning, and new sections.
- Core state model in src/core/srs.ts:
  - simplified SM-2 logic plus review counts and timestamps for stats.
- Arabic text / TTS support:
  - transliteration normalization, browser voice selection, and local audio fallback are all wired in.
- Data source:
  - the app uses src/data/seed-words.json as its canonical deck.

Completion verified by repository inspection and successful production build on 2026-03-31.
