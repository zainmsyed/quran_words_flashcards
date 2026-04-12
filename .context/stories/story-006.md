# Story 006: App shell & topbar/brand — rectangular brand-mark and topbar restyle

**Status:** not-started
**Created:** 2026-04-12
**Last accessed:** 2026-04-12
**Completed:**

## Goal
Implement the Bauhaus brand and restyle the app shell topbar: a rectangular 6px-radius brand mark (primary red) with the Arabic glyph "ا" as the logo glyph and the app name "alif" (lowercase) in Space Grotesk to the right. Update topbar layout, spacing, and button visuals to match the new tokens.

## Verification
Open the app and confirm the topbar shows a rectangular red brand mark with the white Arabic glyph "ا" and the text "alif" in Space Grotesk; topbar buttons and surfaces use the new palette and 6px radii.

## Scope — files this story may touch
- src/App.svelte
- src/app.css
- any shared topbar markup used by StudySession/Settings

## Out of scope — do not touch
- App behavior, navigation, or auth logic
- Study/session flow implementation

## Dependencies
- story-005.md (fonts & tokens)

## Checklist
- [ ] Add brand mark markup to the app topbar (rectangular box) and place the app name "alif" to the right.
- [ ] Render the logo glyph "ا" inside the brand mark using Noto Naskh Arabic (white on #D62828), and render the name "alif" in Space Grotesk (lowercase) to the right.
- [ ] Update .app-topbar, .brand, and .brand-mark styles in src/app.css to use 6px radii and the new color tokens.
- [ ] Convert any pill-shaped topbar buttons to rectangular 6px-radius buttons and update hover/active states to match the Bauhaus theme.
- [ ] Verify the topbar remains responsive and does not overlap other UI elements on small screens.

## Issues
- None.

## Completion Summary

