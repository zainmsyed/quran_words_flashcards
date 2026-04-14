# System Rules

## Rules
- Follow existing project conventions.
- Write directly to real project files.
- Ask before changing ambiguous areas.
- Never commit or push changes unless the user has given explicit permission in the current conversation.
- Never mark a story complete or update story status to completed unless the user has given explicit permission in the current conversation.

## Learned Rules
- Promoted rules from recent complaint clusters and reopened-issue follow-up.
- When adding a secondary panel to a card screen, reuse the card’s wrapper and spacing tokens so both edges stay aligned.
- When using CSS 3D transforms for interactive elements (e.g., card flips), do not apply overflow: hidden on the rotating container; apply clipping to non-transformed child faces or an outer wrapper so preserve-3d and backface-visibility render correctly. <!-- source: story-007 -->
- When a flashcard shows answer-revealing content, keep pronunciation/transliteration controls on the Arabic-facing side only so the answer does not leak through the UI. <!-- source: story-003 -->
- When a PocketBase-backed screen may load before its collections exist, return empty/default state on reads and surface a clear migration error on writes instead of crashing. <!-- source: story-003 -->
- When a mobile top bar looks clipped, restore the header’s own padding/safe-area inset instead of changing viewport-level spacing so the rest of the screen stays put. <!-- source: story-009 -->
- When pronunciation controls depend on speech synthesis or bundled audio, show them only when the current word can actually be pronounced. <!-- source: story-004 -->
- When localStorage is part of auth/session persistence, catch storage write/remove failures so sign-in and sign-out degrade gracefully.
