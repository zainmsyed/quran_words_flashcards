# Story 005: Theme & fonts — add Google Fonts and update CSS tokens

**Status:** in-progress  
**Created:** 2026-04-12
**Last accessed:** 2026-04-12  
**Completed:**

## Goal
Add the Bauhaus-inspired theme tokens and web fonts so the app can be restyled incrementally using consistent variables.

## Verification
Open the dev build in a browser and confirm:
- The three Google Fonts (Space Grotesk, Work Sans, Noto Naskh Arabic) are loaded.
- The :root CSS variables in src/app.css reflect the new Bauhaus palette and 6px radii (inspect in devtools).

## Scope — files this story may touch
- index.html
- src/app.css

## Out of scope — do not touch
- Any study logic, SRS, or auth behavior
- PocketBase code or migrations
- .pi/extensions

## Dependencies
- None

## Checklist
- [ ] Add Google Fonts link to index.html for Space Grotesk (400,700,800), Work Sans (400,500,700), and Noto Naskh Arabic (400,700).
- [ ] Update the :root token block in src/app.css to the agreed palette and semantic mappings (primary #D62828, primary-dim #9E1A1A, accent #FFD166, text #111111, bg #F8F8F6, card #FFFFFF, border #E6E6E6, success #1E7A4A, danger #9E1A1A) and set corner radii to 6px.
- [ ] Update global font-family declarations in src/app.css: Work Sans for UI/body, Space Grotesk for headings, Noto Naskh Arabic for Arabic classes (.arabic, .ar, .word-row .ar, etc.).
- [ ] Reduce or adjust shadows where appropriate to match Bauhaus aesthetic.
- [ ] Start the dev server and verify fonts and tokens are present (manual check).

## Issues
- None identified.

## Completion Summary

