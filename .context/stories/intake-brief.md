# Intake Brief

**Last updated:** 2026-04-12

## Planning brief
A Bauhaus-inspired visual refresh across the entire Quranic Flashcards SPA (study, word list, stats, settings, voice settings, and app shell). This is a purely visual update: do not change study mechanics, SRS behavior, or auth/login flows. The update is mobile-first and must match the Bauhaus aesthetic (bold geometric typography, strong primary color accents, high contrast) while remaining pragmatic and lightweight.

Key decisions (final):
- Target users: people who want to learn Quranic Arabic; the site is responsive and mobile-first.
- Scope: restyle all screens (study, WordList, Stats, Settings, VoiceSettings, app shell/topbar) — visual changes only.
- Fonts: Space Grotesk for headings, Work Sans for UI/body, Noto Naskh Arabic for Arabic script. Load weights: Space Grotesk 400/700/800; Work Sans 400/500/700; Noto Naskh Arabic 400/700.
- Color palette:
  - Primary (red): #D62828
  - Accent (yellow): #FFD166
  - Near‑black (text): #111111
  - Background (light): #F8F8F6
  - Card surface: #FFFFFF
  - Muted grey / borders: #E6E6E6
  - Success (green): #1E7A4A
  - Danger (darker red/maroon): #9E1A1A
- Geometry: rectangular UI surfaces and controls with a 6px corner radius (buttons, cards, panels, badges). The brand-mark is a rectangular 6px-radius box (primary red) containing the Arabic letter "ا" (logo glyph) rendered in Noto Naskh Arabic; the app name to the right is "alif" (lowercase) in Space Grotesk.
- Semantic color mappings: info/new → yellow #FFD166 (on near‑black text); warn/review → red #D62828 (white text); success → green #1E7A4A; danger → #9E1A1A (white text).
- References: use all files in .context/intake/references/ as visual examples for different screens; do not treat them as hard requirements—"inspired by" is acceptable.

## Source files referenced (canonical inputs)
- .context/intake/dictionaries/quran_300_words.csv
- .context/intake/prd/quranic-flashcards-prd.md
- .context/intake/prd/quranic-flashcards-auth-addon.md
- .context/intake/references/* (haus_archive, maktaba_*, staatliche_bold)

## Planning rules (reminder)
- Intake files are planning inputs only; preserve study/login behavior and existing story files. Ask before changing ambiguous behavior. Surface contradictions instead of silently resolving them.
