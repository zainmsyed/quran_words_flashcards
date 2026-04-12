# Story 007: Card component restyle — typography, colors, rectangular controls

**Status:** in-progress  
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
- [x] Update Card.svelte layout and classes to use Space Grotesk (headings) and Work Sans (body); ensure Arabic text uses Noto Naskh Arabic.
- [x] Restyle the card surface to use the new color tokens and 6px radius and update internal spacing to match Bauhaus-inspired layout.
- [x] Replace pill-shaped action controls with rectangular buttons (6px radius) and apply primary/secondary/tertiary styles according to new tokens.
- [x] Ensure audio/TTS control and transliteration are only visible on the Arabic-facing side (preserve previous bug fixes).
- [ ] Run a manual session and exercise flip, TTS playback, and rating actions to confirm no behavioral regressions.

## Issues
- Implementation is complete in the current `ui-ux-updates` branch worktree. The card now uses the Bauhaus typography and geometry: Space Grotesk for the mode labels / English text, Work Sans for secondary hints and transliteration, Noto Naskh Arabic for Arabic text, and 6px-radius card/audio controls.
- Build verification passed (`npm run build`) after the change.
- Remaining blocker: the final checklist item still needs a real browser manual session to confirm the card flip, audio/TTS button, and rating flow feel correct in practice and that the audio/transliteration are only visible on the Arabic-facing side.

## Completion Summary
Story 007 implementation is done from a code standpoint. The flashcard surface was restyled to the Bauhaus visual language with a 6px-radius card, updated palette, and typography rules that match the new theme. The audio button is now a rectangular control that uses the shared palette/tokens, and the card still keeps the Arabic-facing-only audio and transliteration behavior intact. The English/meaning text now uses the new font hierarchy, and the build succeeds after the changes. The story is awaiting one manual browser session to confirm interaction behavior before Vazir handles final closeout.

