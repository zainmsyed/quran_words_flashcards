# Review Summary

**Last updated:** 2026-04-16T04:17:52Z

## Findings
- When a mobile top bar looks clipped, restore the header’s own padding/safe-area inset instead of changing viewport-level spacing so the rest of the screen stays put. | count: 2 | status: promoted | sources: review-20260414-200827.md, remembered.md | stories: story-009
- — (not proposed as a cross-project rule; this is repo-specific cleanup) | count: 1 | status: tracked | sources: review-20260413-204423.md
- Add automated coverage before changing persistence formats or session state machines. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Add tests for new logic and scripts before merging feature branches (yes) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- Don't persist a mode enum if every producer hardcodes the same value. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Keep unique-item counters separate from total-event counters when a dashboard needs both. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Prefer Svelte stores or explicit subscription APIs for cross-component runtime state changes so UI reactivity is reliable (yes) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- Use artifact storage or releases for generated binary assets (yes — good candidate) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- When a story scopes UI work to specific screens/files, keep unrelated header/card fixes out of the same implementation commit so regressions stay attributable. | count: 1 | status: tracked | sources: review-20260412-233704.md | stories: story-009
- When adding a secondary panel to a card screen, reuse the card’s wrapper and spacing tokens so both edges stay aligned. | count: 1 | status: promoted | sources: remembered.md
- When live browser QA is still listed as a blocker, do not mark the manual-test checklist item complete. | count: 1 | status: tracked | sources: review-20260412-233704.md | stories: story-009
- When localStorage is part of auth/session persistence, catch storage writes/removals the same way reads are caught so storage-restricted browsers degrade gracefully. | count: 1 | status: tracked | sources: review-20260414-200827.md
- When TTS fallback depends on speech synthesis, do not advertise audio-only support unless every path has a bundled audio file or another audible fallback. | count: 1 | status: tracked | sources: review-20260414-200827.md
- When using CSS 3D transforms for interactive elements (e.g., card flips), do not apply overflow: hidden on the rotating container; apply clipping to non-transformed child faces or an outer wrapper so preserve-3d and backface-visibility render correctly. | count: 1 | status: promoted | sources: remembered.md | stories: story-007
- Yes — add a pre-commit check to prevent committing files larger than a configured threshold (e.g., 250 KB). | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — brand SVGs used as favicons or UX brand marks must use outlined glyph paths (no <text> nodes). | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — brand SVGs used for favicons or in-app marks should use outlined glyph paths instead of `<text>`. | count: 1 | status: tracked | sources: review-20260413-211346.md | stories: story-011
- Yes — critical visual flows (card flips, header alignment) should have at least one automated smoke or e2e test. | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — require committed image assets to be optimized/minified and add CI checks for large/unoptimized images. | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — visible desktop UI regressions should have at least one automated smoke/e2e test. | count: 1 | status: tracked | sources: review-20260413-211346.md | stories: story-011
