# Review Summary

**Last updated:** 2026-04-22T11:29:27Z

## Findings
- When a mobile top bar looks clipped, restore the header’s own padding/safe-area inset instead of changing viewport-level spacing so the rest of the screen stays put. | count: 2 | status: promoted | sources: review-20260414-200827.md, remembered.md | stories: story-009
- — (not proposed as a cross-project rule; this is repo-specific cleanup) | count: 1 | status: tracked | sources: review-20260413-204423.md
- Add automated coverage before changing persistence formats or session state machines. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Add tests for new logic and scripts before merging feature branches (yes) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- Do not commit timestamped backup artifacts into tracked project directories; keep them outside the repo or gitignored. | count: 1 | status: tracked | sources: review-20260422-111252.md
- Do not mark story checklist items or completion notes as verified when the current diff/tests do not support the claim, and do not merge out-of-scope edits without explicit scope approval. | count: 1 | status: tracked | sources: review-20260418-123224.md
- Don't persist a mode enum if every producer hardcodes the same value. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Keep unique-item counters separate from total-event counters when a dashboard needs both. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Prefer Svelte stores or explicit subscription APIs for cross-component runtime state changes so UI reactivity is reliable (yes) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- Use artifact storage or releases for generated binary assets (yes — good candidate) | count: 1 | status: tracked | sources: review-20260416-032919.md | stories: story-014
- When a container is reached by peer services, default it to `0.0.0.0` inside the container; reserve `127.0.0.1` for host-local process managers only. | count: 1 | status: tracked | sources: review-20260418-145506.md | stories: story-017
- When a count and a filtered list represent the same state, derive both from the same shared predicate so they cannot drift. | count: 1 | status: tracked | sources: review-20260418-123224.md
- When a quota says to fill the remaining slots, compute the secondary quota from remaining capacity instead of applying a fixed sub-cap unconditionally. | count: 1 | status: tracked | sources: review-20260418-123224.md
- When a security-sensitive UI flow depends on custom component events, add component/e2e coverage for the dispatch chain instead of only testing helper modules. | count: 1 | status: tracked | sources: review-20260418-220708.md | stories: story-018
- When adding a secondary panel to a card screen, reuse the card’s wrapper and spacing tokens so both edges stay aligned. | count: 1 | status: promoted | sources: remembered.md
- When deployment correctness depends on container networking, test the network path itself instead of relying only on static config or image builds. | count: 1 | status: tracked | sources: review-20260418-145506.md | stories: story-017
- When localStorage is part of auth/session persistence, catch storage writes/removals the same way reads are caught so storage-restricted browsers degrade gracefully. | count: 1 | status: tracked | sources: review-20260414-200827.md
- When multiple records represent one logical snapshot, recover from the durable source of truth instead of trusting a stale auxiliary snapshot. | count: 1 | status: tracked | sources: review-20260418-220708.md | stories: story-018
- When optional runtime manifests fail to load, do not cache the failure permanently; allow later retries. | count: 1 | status: tracked | sources: review-20260418-123224.md
- When removing component markup, remove its component-scoped selectors in the same change and verify with a production build. | count: 1 | status: tracked | sources: review-20260422-111252.md
- When TTS fallback depends on speech synthesis, do not advertise audio-only support unless every path has a bundled audio file or another audible fallback. | count: 1 | status: tracked | sources: review-20260414-200827.md
- When UI availability depends on helper state, add a render-level test for the control, not only helper tests. | count: 1 | status: tracked | sources: review-20260422-033800.md | stories: story-020
- When using CSS 3D transforms for interactive elements (e.g., card flips), do not apply overflow: hidden on the rotating container; apply clipping to non-transformed child faces or an outer wrapper so preserve-3d and backface-visibility render correctly. | count: 1 | status: promoted | sources: remembered.md | stories: story-007
- When you add a helper script for a finished workflow, wire it into the documented/package entry points and tests, or delete it before merge. | count: 1 | status: tracked | sources: review-20260422-033800.md | stories: story-020
- Yes — add a pre-commit check to prevent committing files larger than a configured threshold (e.g., 250 KB). | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — brand SVGs used as favicons or UX brand marks must use outlined glyph paths (no <text> nodes). | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — critical visual flows (card flips, header alignment) should have at least one automated smoke or e2e test. | count: 1 | status: tracked | sources: review-20260413-204423.md
- Yes — require committed image assets to be optimized/minified and add CI checks for large/unoptimized images. | count: 1 | status: tracked | sources: review-20260413-204423.md
