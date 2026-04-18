# Story 006: App shell & topbar/brand — rectangular brand-mark and topbar restyle

**Status:** complete  
**Created:** 2026-04-12
**Last accessed:** 2026-04-12  
**Completed:** 2026-04-12

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
- [x] Add brand mark markup to the app topbar (rectangular box) and place the app name "alif" to the right.
- [x] Render the logo glyph "ا" inside the brand mark using Noto Naskh Arabic (white on #D62828), and render the name "alif" in Space Grotesk (lowercase) to the right.
- [x] Update .app-topbar, .brand, and .brand-mark styles in src/app.css to use 6px radii and the new color tokens.
- [x] Convert any pill-shaped topbar buttons to rectangular 6px-radius buttons and update hover/active states to match the Bauhaus theme.
- [x] Verify the topbar remains responsive and does not overlap other UI elements on small screens.

## Issues
- Implementation is complete in branch `ui-ux-updates` (commit 3388b95). The following files were updated for the brand/topbar pass:
  - `src/app.css` — shared `.app-topbar`, `.brand`, `.brand-mark`, and button styles now use the Bauhaus palette and 6px geometry.
  - `src/ui/StudySession.svelte` — study shell header now shows the brand block and uses the shared rectangular header button.
  - `src/ui/Settings.svelte` — settings shell header now shows the brand block and uses the shared rectangular header button.
  - `src/ui/AuthGate.svelte` — login screen now uses the new brand block and lowercase app name.
  - `src/ui/AuthUnavailable.svelte` — unavailable state now matches the same surface/button language.
  - `src/App.svelte` — loading card now matches the new surface styling.
- Build verification passed (`npm run build`) after the changes were applied.
- Remaining blocker: the final checklist item needs a real browser visual check on a small viewport to confirm the headers don’t wrap/overlap and the brand row stays aligned. That manual QA step is what still keeps the story in-progress.

## Completion Summary
Story 006 implementation is done and committed, but it is not yet closed because the small-viewport browser QA is still outstanding. The app shell now uses the Bauhaus brand treatment consistently across the authenticated study screen, settings screen, login screen, and unavailable screen: a rectangular red brand mark with the white Arabic glyph "ا", the lowercase app name "alif" in Space Grotesk, and rectangular 6px-radius header buttons. Shared shell styles in `src/app.css` were updated so the topbars, brand block, and buttons all match the new palette and geometry. The code compiles successfully (`npm run build`), so the only remaining blocker is manual responsiveness verification in a real browser before Vazir handles final closeout.

