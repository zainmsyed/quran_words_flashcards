# File Index

.pi/extensions/vazir-context/helpers.ts — Context injection, init, plan, and consolidation extension
.pi/extensions/vazir-context/index.ts — Context injection, init, plan, and consolidation extension
.pi/extensions/vazir-live-reload.ts — Watches `.pi/extensions` and reloads Pi on changes
.pi/extensions/vazir-tracker/chrome.ts — Change tracker, diff, fix, and reset extension
.pi/extensions/vazir-tracker/index.ts — Change tracker, diff, fix, and reset extension
.pi/extensions/vazir-tracker/vcs.ts — Change tracker, diff, fix, and reset extension
.pi/lib/vazir-helpers.ts — Shared Pi extension helpers for stories and repo checks
.pi/skills/vazir-base/SKILL.md — Vazir baseline skill instructions
AGENTS.md — Cross-framework project guidance and working notes
capacitor.config.ts — Example Capacitor v2 config with `webDir: dist`
index.html — Vite app shell with Google Fonts and the `#app` mount point
package-lock.json — package-lock.json configuration file
package.json — package.json configuration file
scripts/generate_audio_gtts.py — gTTS script that generates seed-word MP3s into `public/audio`
src/app.css — Global design tokens and shared layout styles
src/App.svelte — Top-level screen switcher between study and settings
src/core/app-stats.ts — App-level study counters and streak tracking
src/core/srs.ts — Simplified SRS card state, normalization, and rating logic
src/core/storage-adapter.ts — Promise-based localStorage adapter
src/core/tts-adapter.ts — Web Speech/audio TTS with transliteration fallback
src/core/wordlist.ts — Loads seeded words from JSON and normalizes transliteration
src/data/seed-words.json — seed-words.json configuration file
src/main.ts — Svelte entry point that mounts App
src/ui/components/Card.svelte — Flippable flashcard with pronunciation control
src/ui/Settings.svelte — Settings shell with stats, audio, and deck tabs
src/ui/Stats.svelte — Study progress dashboard and word filters
src/ui/StudySession.svelte — Session queue controller, progress, and rating actions
src/ui/VoiceSettings.svelte — Browser voice picker and sample playback
src/ui/WordList.svelte — Deck browser grouped by mastery state
svelte.config.js — Svelte preprocess config for TypeScript
tsconfig.json — tsconfig.json configuration file
vite.config.ts — Vite config with Svelte plugin and dev server port

scripts/run-tests.mjs — Repository test runner that executes the Node-based checks and build gates.
src/core/progress-summary.ts — Computes study-progress summaries and counts from card state.
src/core/session.ts — Builds, normalizes, and retries PocketBase-backed study sessions.
pb_migrations/001_create_users_auth.js — Locks down the PocketBase users auth collection for invite-only onboarding.
pb_migrations/002_create_card_progress.js — Creates the per-user card_progress collection and access rules.
pb_migrations/003_create_superuser.js — Bootstraps the initial PocketBase admin/superuser.
scripts/pocketbase-smoke-test.mjs — Runs the PocketBase smoke test covering auth and persisted study data.
src/core/pocketbase-auth.ts — PocketBase auth/session client with bootstrap, sign-in, sign-out, and availability checks.
src/ui/AuthGate.svelte — Login gate UI for invited PocketBase users.
src/ui/AuthUnavailable.svelte — Retry/unavailable state shown when PocketBase cannot be reached.
scripts/dev-with-pocketbase.mjs — Starts Vite and PocketBase together for local development.
pb_data/types.d.ts — Generated PocketBase TypeScript type definitions.
scripts/pocketbase-bootstrap.mjs — Downloads, boots, and migrates PocketBase for local/dev use.
pb_migrations/004_create_study_state.js — Creates the PocketBase study_state collection for saved sessions and stats.
src/core/pocketbase-study.ts — PocketBase-backed study snapshot and card-state persistence helpers.
src/ui/AccountSettings.svelte — Authenticated account settings shell for profile and password actions.
src/ui/ChangePasswordForm.svelte — Password-change form used inside account settings.
