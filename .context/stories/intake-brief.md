# Intake Brief

**Last updated:** 2026-05-04

## Planning brief
Add a session-start choice for the existing study flow. When a normal daily session queue is created or resumed at the beginning, the user should choose between reviewing the upcoming session words first or going straight into the current flashcard test flow. The review path should show only the words in the current session queue, openly displaying Arabic, transliteration, and English so learners can familiarize themselves before testing. The direct test path should preserve the current app behavior.

## Final distilled answers
- The preview/review list is limited to the current session queue only, not the full deck or broader due/new lists.
- The list should show answers openly: Arabic, transliteration, and English.
- v1 review list is text-only; no pronunciation/audio controls in the preview.
- Start-of-session entry should offer two choices: Review first or Test me.
- If the user chooses Review first, the review screen should have a single next action to start the test/flashcards.
- The choice/review step applies only to the first normal daily session, not the Review again flow after completing a session.
- Previewing words must not affect SRS progress, card state, app stats, or streaks; only rating flashcards should update progress.
- Refresh/resume should preserve the user's exact place: choice screen, review screen, or the same flashcard index, matching the existing saved-session behavior.
- v1 does not need New/Review labels or color coding in the preview list.

## Source files
- .context/intake/dictionaries/quran_300_words.csv (11519 bytes)
- .context/intake/prd/quranic-flashcards-auth-addon.md (18094 bytes)
- .context/intake/prd/quranic-flashcards-prd.md (4170 bytes)
- .context/intake/references/background_pattern compressed.webp (33994 bytes)
- .context/intake/references/haus_archive/DESIGN.md (6264 bytes)
- .context/intake/references/maktaba_bold_manifesto/code.html (10106 bytes)
- .context/intake/references/maktaba_bold_manifesto/screen.png (119201 bytes)
- .context/intake/references/maktaba_login/code.html (10556 bytes)
- .context/intake/references/maktaba_login/screen.png (125728 bytes)
- .context/intake/references/maktaba_stats/code.html (14433 bytes)
- .context/intake/references/maktaba_stats/screen.png (82362 bytes)
- .context/intake/references/maktaba_word_list/code.html (17124 bytes)
- .context/intake/references/maktaba_word_list/screen.png (49495 bytes)
- .context/intake/references/staatliche_bold/DESIGN.md (5691 bytes)
- .context/intake/references/stitch_bauhaus_circle_design/DESIGN.md (6264 bytes)
- .context/intake/references/stitch_bauhaus_circle_design/screen.png (28 bytes)

## Distilled notes
### .context/intake/dictionaries/quran_300_words.csv
Large file (11519 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/prd/quranic-flashcards-auth-addon.md
Large file (18094 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/prd/quranic-flashcards-prd.md
Large file (4170 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/background_pattern compressed.webp
Unsupported preview type. Use the raw file only if the user specifically points to it.

### .context/intake/references/haus_archive/DESIGN.md
Large file (6264 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/maktaba_bold_manifesto/code.html
Large file (10106 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/maktaba_bold_manifesto/screen.png
Unsupported preview type. Use the raw file only if the user specifically points to it.

### .context/intake/references/maktaba_login/code.html
Large file (10556 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/maktaba_login/screen.png
Unsupported preview type. Use the raw file only if the user specifically points to it.

### .context/intake/references/maktaba_stats/code.html
Large file (14433 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/maktaba_stats/screen.png
Unsupported preview type. Use the raw file only if the user specifically points to it.

### .context/intake/references/maktaba_word_list/code.html
Large file (17124 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/maktaba_word_list/screen.png
Unsupported preview type. Use the raw file only if the user specifically points to it.

### .context/intake/references/staatliche_bold/DESIGN.md
Large file (5691 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/stitch_bauhaus_circle_design/DESIGN.md
Large file (6264 bytes). Do not read it wholesale by default. Skim selectively or ask the user which section matters most.

### .context/intake/references/stitch_bauhaus_circle_design/screen.png
Unsupported preview type. Use the raw file only if the user specifically points to it.

## Planning rules
- Treat intake files as raw planning inputs, not permanent system rules.
- Ask only delta questions after reviewing this brief and any raw files you actually need.
- Surface contradictions instead of resolving them silently.
