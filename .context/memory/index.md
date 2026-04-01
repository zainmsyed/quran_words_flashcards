# File Index

.pi/extensions/vazir-context.ts — Context injection, init, plan, and consolidation extension
.pi/extensions/vazir-tracker.ts — Change tracker, diff, fix, and reset extension
.pi/skills/vazir-base/SKILL.md — Vazir baseline skill instructions
AGENTS.md — Cross-framework project guidance and working notes

capacitor.config.ts — Capacitor configuration for Android wrapper (webDir and app settings)
index.html — Vite/Svelte app HTML entry template (dev server mount point)
package.json — Node package manifest with dev/build scripts and dependencies
src/app.css — Global application styles and CSS variables
src/App.svelte — Root Svelte component / app shell and top-level layout
src/core/srs.ts — Simplified SM-2 spaced-repetition logic and card state management
src/core/storage-adapter.ts — StorageAdapter interface with browser/localStorage implementation
src/core/wordlist.ts — Seed wordlist loader and helpers (CSV → JSON, transliteration normalization)
src/data/seed-words.json — Canonical seeded deck (JSON) of Quranic words used by the app
src/main.ts — App bootstrap (instantiate and mount the Svelte App)
src/ui/components/Card.svelte — Flashcard component (Arabic front, meaning back) with flip, TTS, and rating buttons
src/ui/StudySession.svelte — Study session orchestration: queue building, persistence, and review flow
svelte.config.js — Svelte preprocessor and Vite plugin configuration
tsconfig.json — TypeScript compiler options and path settings
vite.config.ts — Vite configuration with Svelte plugin and build settings
package-lock.json — npm lockfile recording exact installed dependency versions
src/core/tts-adapter.ts — Web Speech API wrapper and local-audio-first playback fallback
src/ui/VoiceSettings.svelte — Voice picker UI and persistence for preferred TTS voice
scripts/generate_audio_gtts.py — Proof-of-concept script to generate MP3s using gTTS
src/ui/Stats.svelte — Stats view showing studied/mastered/due/streak and per-word lists
src/ui/WordList.svelte — Word list view grouping deck by status (mastered / learning / new)
src/core/app-stats.ts — App-level stats calculations and persistence (streaks, totals)
src/ui/Settings.svelte — Settings panel (Stats, audio/voice settings, storage helpers)