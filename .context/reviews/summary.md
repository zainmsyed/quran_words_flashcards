# Review Summary

**Last updated:** 2026-04-12T17:07:15Z

## Findings
- Add automated coverage before changing persistence formats or session state machines. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Add smoke coverage for every persisted collection and every user-visible read/write path. | count: 1 | status: tracked | sources: review-20260411-062422.md | stories: story-003
- Do not split coupled user-visible state across multiple writes unless you also have a transaction or a guaranteed recovery path. | count: 1 | status: tracked | sources: review-20260411-062422.md | stories: story-003
- Don't persist a mode enum if every producer hardcodes the same value. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Keep story metadata synchronized with the shipped scope whenever a requested feature is intentionally removed. | count: 1 | status: tracked | sources: review-20260411-073533.md | stories: story-004
- Keep unique-item counters separate from total-event counters when a dashboard needs both. | count: 1 | status: tracked | sources: review-20260409-222457.md
- Persist a newly generated session queue before the user can refresh or switch devices if same-day resume depends on it. | count: 1 | status: tracked | sources: review-20260411-062422.md | stories: story-003
- Remove imports immediately when the only consumer of a feature is deleted, so dead code does not linger after scope changes. | count: 1 | status: tracked | sources: review-20260411-073533.md | stories: story-004
- When adding a secondary panel to a card screen, reuse the card’s wrapper and spacing tokens so both edges stay aligned. | count: 1 | status: promoted | sources: remembered.md
