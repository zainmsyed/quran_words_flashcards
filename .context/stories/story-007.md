# Story 007: Card component restyle — typography, colors, rectangular controls

**Status:** not-started
**Created:** 2026-04-12
**Last accessed:** 2026-04-12
**Completed:**

## Goal
Restyle the main study Card component to the Bauhaus visual language while preserving all current behaviour (flip, audio/TTS, rating controls, and SRS logic).

## Verification
Start a study session and verify that a card displays with:
- Space Grotesk headings and Work Sans body text
- Arabic text rendered with Noto Naskh Arabic
- Card surface uses new card color and 6px corner radius
- Action controls (audio, flip, rating) are rectangular 6px-radius controls and function exactly as before

## Scope — files this story may touch
- src/ui/components/Card.svelte
- src/app.css

## Out of scope — do not touch
- Changes to card data, SRS state, scheduling logic, or PocketBase interactions

## Dependencies
- story-005.md (fonts & tokens)
- story-006.md (brand/topbar styles)

## Checklist
- [ ] Update Card.svelte layout and classes to use Space Grotesk (headings) and Work Sans (body); ensure Arabic text uses Noto Naskh Arabic.
- [ ] Restyle the card surface to use the new color tokens and 6px radius and update internal spacing to match Bauhaus-inspired layout.
- [ ] Replace pill-shaped action controls with rectangular buttons (6px radius) and apply primary/secondary/tertiary styles according to new tokens.
- [ ] Ensure audio/TTS control and transliteration are only visible on the Arabic-facing side (preserve previous bug fixes).
- [ ] Run a manual session and exercise flip, TTS playback, and rating actions to confirm no behavioral regressions.

## Issues
- None.

## Completion Summary

