# Review Summary

**Last updated:** 2026-04-13T11:49:18Z

## Findings
- Add automated coverage before changing persistence formats or session state machines. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Don't persist a mode enum if every producer hardcodes the same value. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Keep unique-item counters separate from total-event counters when a dashboard needs both. | count: 1 | status: tracked | sources: review-20260409-222457.md
- When a mobile top bar looks clipped, restore the header’s own padding/safe-area inset instead of changing viewport-level spacing so the rest of the screen stays put. | count: 1 | status: promoted | sources: remembered.md | stories: story-009
- When a story scopes UI work to specific screens/files, keep unrelated header/card fixes out of the same implementation commit so regressions stay attributable. | count: 1 | status: tracked | sources: review-20260412-233704.md | stories: story-009
- When adding a secondary panel to a card screen, reuse the card’s wrapper and spacing tokens so both edges stay aligned. | count: 1 | status: promoted | sources: remembered.md
- When live browser QA is still listed as a blocker, do not mark the manual-test checklist item complete. | count: 1 | status: tracked | sources: review-20260412-233704.md | stories: story-009
- When using CSS 3D transforms for interactive elements (e.g., card flips), do not apply overflow: hidden on the rotating container; apply clipping to non-transformed child faces or an outer wrapper so preserve-3d and backface-visibility render correctly. | count: 1 | status: promoted | sources: remembered.md | stories: story-007
