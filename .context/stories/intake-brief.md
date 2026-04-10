# Intake Brief

**Last updated:** 2026-04-09

## Planning brief
Quranic Flashcards v1 is a Svelte + Vite + TypeScript SPA for a small invited group of friends and family. We are keeping the original flashcard study flow and deck content, but adding the PocketBase auth addon in-repo so each user has their own account and saved progress.

Auth is invite-only. Accounts are created manually in the PocketBase admin dashboard. The app uses a custom Svelte auth UI with a login gate, logout, account/profile screen, change-password flow, and forgot/reset-password flow. PocketBase is the source of truth for auth and progress; if PocketBase is unavailable, the app is unavailable.

We are starting fresh on the PocketBase side: no migration/import from existing localStorage data is needed because there are no users yet. Persisted study data should live in PocketBase, not localStorage.

## Final decisions
- Stack stays the same: Svelte + Vite + TypeScript
- Backend/auth layer: PocketBase, version-controlled in the repo
- Access model: invite-only, manual account creation by admins
- Auth UI: custom Svelte screens, not PocketBase default screens
- Password flows: change password and forgot/reset password included
- Persistence: PocketBase only for saved user progress; no old localStorage import
- Deployment: include repo files and instructions for PocketBase, Nginx, systemd, env templates, and README setup notes
- Offline behavior: no offline-only mode; the app requires PocketBase

## Source files
- .context/intake/dictionaries/quran_300_words.csv
- .context/intake/prd/quranic-flashcards-auth-addon.md
- .context/intake/prd/quranic-flashcards-prd.md
- .context/intake/references/COLOR PALLET DESIGN.md
- .context/intake/references/emerald_serenity/DESIGN.md
- .context/intake/references/home_emerald_serenity/code.html
- .context/intake/references/home_emerald_serenity/screen.png
- .context/intake/references/quranic-flashcards-poc.html
- .context/intake/references/statistics_emerald_serenity/code.html
- .context/intake/references/statistics_emerald_serenity/screen.png
- .context/intake/references/study_session_emerald_serenity/code.html
- .context/intake/references/study_session_emerald_serenity/screen.png
- .context/intake/references/word_list_emerald_serenity/code.html
- .context/intake/references/word_list_emerald_serenity/screen.png

## Distilled notes
- The original PRD remains the authority for study flow, deck content, and core flashcard behavior.
- The auth add-on doc is the authority for PocketBase, invite-only access, deployment files, and password flows.
- The app should keep the existing study flow unchanged except for the login gate and authenticated persistence.
- No localStorage-based migration path is required for existing study data.
