# Story 013: Audio provider & format decision — choose the bundled Arabic pronunciation pipeline

**Status:** complete  
**Created:** 2026-04-14  
**Last accessed:** 2026-04-15  
**Completed:** 2026-04-15

## Goal
Choose the production build-time provider, output format, and asset policy for bundled Arabic pronunciation across the current 300-word seed deck, replacing the current 10-word prototype direction with a documented, repeatable approach.

## Verification
Open the decision notes produced by this story and confirm they name the chosen provider, file format, encoding target, generation command, repo/deploy policy, and runtime fallback policy.

## Scope
- scripts/generate_audio_gtts.py (prototype)
- scripts/ (generation scripts)
- package.json (scripts entry)
- public/audio/ (where assets will live)

## Out of scope
- Generating the full 300-word production asset set (see story-014)
- UI redesign or study-flow changes
- Multiple bundled voices per word
- Runtime cloud TTS requests
- PWA/offline-cache implementation

## Dependencies
- None

## Checklist
- [x] Audit the current Python/gTTS prototype, the existing 10 bundled files, and the current browser-fallback behavior in the app.
- [x] Compare at least two build-time generation options against the agreed priority order: minimal VPS usage, pronunciation quality, playback speed, then storage size.
- [x] Decide the production output format and encoding target for bundled audio, including any browser-compatibility constraint that affects the choice.
- [x] Record the chosen provider, script direction, required configuration, naming convention, and commit/deploy policy for the assets.
- [x] Capture the runtime rule that bundled audio is primary and browser speech is fallback-only when static playback fails.

## Issues
- Service account credentials and billing for cloud TTS must be managed outside the repo (do NOT commit keys).  Recommend documenting the generation steps and keeping credentials in local/CI secrets.

## Completion Summary
Summary & decision (executive)
- Chosen primary provider: Google Cloud Text-to-Speech (Neural voices) at build time.
  - Rationale: Produces consistent, high-quality Arabic neural voices (best-pronunciation priority), supports MP3 and OGG/Opus outputs, and can be run as a one-time build-step locally or in CI. This matches the top priority (minimize VPS/runtime usage) because all TTS work happens at build-time and the deployed app only serves static files.
- Fallback generation option (dev/cheap fallback): gTTS (the existing prototype) — suitable for quick experimentation but not recommended as primary for production because it's unofficial and inconsistent.
- Format decision: MP3 (mono) as the primary shipped format, target sample rate 24 kHz (24000 Hz) and target bitrate ≈64 kbps (mono). Rationale: MP3 has the broadest browser support (including iOS/Safari) so it minimizes cross-browser playback failures; 24 kHz/64 kbps provides good speech clarity while keeping the asset set small. Recommend using Google Cloud TTS MP3 output with sample_rate_hertz=24000.
- Optional future optimization: generate a second set in OGG_OPUS (OPUS in OGG) for browsers that support it (Chrome, Firefox). Opus will be noticeably smaller at similar quality; however iOS/Safari support is inconsistent, so do not rely on it as the single-format ship target for v1.

Audit notes (what I checked)
- scripts/generate_audio_gtts.py: present and generates public/audio/w<id>.mp3 for the first 10 words using gTTS. Good prototype semantics (reads src/data/seed-words.json and writes to public/audio). Not production-grade: no credential/billing steps, no manifest output, and limited control of encoding/voice.
- public/audio/: currently contains 10 prototype MP3s (w1.mp3..w10.mp3). Card.svelte already looks for `/audio/{word.id}.mp3` as the first candidate and then `/audio/gcp/{word.id}.mp3` as a second candidate; the runtime adapter currently uses a small hard-coded BUNDLED_AUDIO_WORD_IDS set for w1..w10.
- src/core/tts-adapter.ts: adapter prefers bundled audioSources if provided to speak(), then falls back to Web Speech API. Transliteration fallback logic is present and works when no Arabic voice is available.

Options compared (short)
1) Google Cloud Text-to-Speech (Neural)
   - Pros: best Arabic pronunciation quality, SSML support, consistent voices, supports MP3 and OGG/Opus, production SLA and billing.
   - Cons: billed service and requires a service account/key for CI or local generation.
   - Fit to priorities: 1) minimal runtime VPS usage — good (build-time work). 2) pronunciation quality — best. 3) playback — good (MP3). 4) storage — OK; can use Opus later for size.
2) gTTS (googletrans/translate TTS unofficial)
   - Pros: free, very simple (current Python script), produces MP3 quickly.
   - Cons: unofficial/unsupported, variable voice quality, potential rate-limiting, not guaranteed for production.
   - Fit to priorities: minimal VPS usage — good (local generation). pronunciation — weaker. storage — similar to MP3.
3) Other cloud TTS (Amazon Polly, Azure Neural)
   - Feasible alternatives; both offer good Arabic neural voices. If your team prefers one cloud provider for other infra reasons, they are acceptable substitutes. The decision below assumes Google Cloud TTS as the primary pick but can be swapped with minimal script changes.

Chosen generation & encoding profile (concrete)
- Primary provider: Google Cloud Text-to-Speech (Neural)
- Ship format: MP3 (audio_encoding=MP3), sample_rate_hertz=24000, mono, target bitrate ~64 kbps (MP3 encoding chosen by API). Use speaking_rate ≈0.9–1.0 to keep short, natural durations.
- Naming convention: use the deck word ID directly (the existing id property in src/data/seed-words.json). Example filename: public/audio/w1.mp3 (do not zero-pad for now to match existing code references). Keep an optional provider folder for intermediate outputs (e.g. public/audio/gcp/w1.mp3) if you prefer, but the deployed app should serve public/audio/{id}.mp3 as the primary path.

Generation script direction (recommended)
- Create scripts/generate_audio_gcp.py (or .js) that:
  1. Reads src/data/seed-words.json and normalizes the word list.
  2. For each word, synthesizes the Arabic text using the Google Cloud TTS client, requesting MP3 output at 24000 Hz.
  3. Writes the file to public/audio/{word.id}.mp3 unless it already exists (idempotent by default).
  4. Produces a manifest file public/audio/manifest.json with entries: { id, filename, duration_seconds (if available), bytes } for coverage checks.
  5. Optionally skips words already present unless a --force flag is passed.

- Example (Python) usage (document in README/scripts):
  - Precondition: set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON key or rely on ADC.
  - CLI: python3 scripts/generate_audio_gcp.py --out public/audio --voice "ar-XA-Neural-B" --sample-rate 24000

- Add an npm script entry (package.json) for convenience:
  - "scripts": { "generate-audio": "python3 scripts/generate_audio_gcp.py --out public/audio" }

Repo & deploy policy
- Generate the assets locally (developer machine) or on an approved CI runner with a secure service account and commit the resulting public/audio/ files into the repository. This keeps the deployed app static — no runtime TTS calls required.
- Do NOT commit service account keys. Keep keys in local env or CI secrets (GOOGLE_APPLICATION_CREDENTIALS).
- Commit audio in a single separate commit (e.g. "chore(audio): add generated pronunciations for 300-word deck") so the asset add is discoverable in the history. The total expected size with MP3@24kHz/64kbps is small (few MBs — estimated 2–6MB depending on average durations), so repo growth should be acceptable for 300 one-word files. If you prefer to keep the repo smaller, consider hosting the audio assets in a release or a static CDN and referencing them at /audio/ (out of scope for v1).

Runtime fallback policy (how the app should behave)
- At runtime, the app MUST prefer bundled static audio files: try /audio/{word.id}.mp3 first (or consult public/audio/manifest.json to detect availability) and play the static file if present.
- If static playback fails (missing file, 404, or play error), attempt the next candidate (if available) and ultimately fall back to the browser speech synthesis (SpeechSynthesisUtterance + transliteration fallback) so the user still hears an approximation.
- Implementation notes (for story-015):
  - Replace the hard-coded BUNDLED_AUDIO_WORD_IDS with a manifest-driven lookup. Add a small loader that fetches public/audio/manifest.json at app startup and populates an in-memory Set<string> of available ids.
  - speak(...) should still accept audioSources (as Card.svelte already does) and try them in order. The adapter's tryPlayBundledAudio already iterates candidates and returns on first-success — this is compatible with the recommended approach.

Acceptance & verification for this story
- A short decision memo exists (this file) that names the chosen provider, file format, encoding target, generation command, deploy policy, naming convention, and runtime fallback policy. (This is the verification artifact.)

Next steps (explicit)
1. Implement scripts/generate_audio_gcp.py and manifest output (story-014).  
2. Run generation for a small sample (10–20 words), measure total size, and verify cross-browser playback.  
3. Implement manifest-driven runtime lookup and prefer bundled audio in src/core/tts-adapter.ts (story-015).

Notes & risks
- Cost: Google Cloud TTS is billable. Generating 300 one-word utterances is a small bill in absolute terms, but CI-based automated regeneration may increase costs; prefer local generation and commit unless you need automated rebuilds.
- Credentials: do not commit service-account keys. Use ADC or CI secrets.
- Browser compatibility: MP3 is the safest single-format choice for v1. If you later want to reduce size further, add OGG/Opus alongside MP3 and use client feature-detection to choose the smaller format where supported.

Completion Summary
- All checklist items completed. This document records the chosen provider (Google Cloud TTS), primary output format (MP3), encoding/quality target (24 kHz, ~64 kbps mono), naming convention (public/audio/{word.id}.mp3), generation command direction (scripts/generate_audio_gcp.py; CLI usage documented above), repo/deploy policy (generate & commit to repo or generate in CI using secrets), and runtime fallback policy (bundled primary, browser speech fallback-only).  

- Next actionable story: story-014 — implement generation script and manifest.  
