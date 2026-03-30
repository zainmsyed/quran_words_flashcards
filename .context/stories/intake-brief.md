# Intake Brief

**Last updated:** 2026-03-29

## Planning brief
Want to make an Arabic flashcards app using the most common 300 words in the Quran. Intake folder contains the PRD, a CSV wordlist, and a POC HTML. Chosen stack: Svelte + Vite + TypeScript for v1; v2 will target Android via Capacitor. The agent will scaffold a starter project and keep core logic in src/core for reuse.

## Source files
- .context/intake/dictionaries/quran_300_words.csv (11519 bytes)
- .context/intake/prd/quranic-flashcards-prd.md (4170 bytes)
- .context/intake/references/quranic-flashcards-poc.html (33204 bytes)

## Distilled notes
### .context/intake/dictionaries/quran_300_words.csv
Canonical word list for target vocabulary. Prefer extracting a small JSON subset for v1 (first 125–150 words) and keep the CSV as the source of truth.

### .context/intake/prd/quranic-flashcards-prd.md
Primary requirements doc detailing UI, SRS, persistence, and non-goals. Use it to validate acceptance criteria and example data.

### .context/intake/references/quranic-flashcards-poc.html
POC HTML that can be reused as a visual and interaction reference when building Svelte components.

## Planning rules
- Treat intake files as raw planning inputs, not permanent system rules.
- Ask only delta questions after reviewing this brief and any raw files you actually need.
- Surface contradictions instead of resolving them silently.

## Next steps
- Scaffold a Svelte + Vite + TypeScript starter (story-004).
- Decide whether to convert the full CSV to JSON at build time (recommended) or parse in-browser for quick iteration.
