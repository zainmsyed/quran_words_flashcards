# Quranic Flashcards

Quranic Flashcards is a Svelte 4 + Vite + TypeScript single-page app for studying high-frequency Quranic Arabic vocabulary with a lightweight spaced-repetition flow.

This repository now also contains the **PocketBase backend foundation** for the upcoming invite-only multi-user version:

- version-controlled PocketBase migrations
- invite-only auth collection rules
- per-user `card_progress` schema
- custom in-app account/password flows for invited users
- example Nginx and systemd deployment files
- an environment template for first-run setup

The custom auth UI and PocketBase-backed study syncing now include account settings and change-password flows. Story 001 in this repo is focused on the backend/deployment foundation only.

## Repo layout

```text
.
├── pb_migrations/              # PocketBase schema + bootstrap migrations
├── nginx/flashcards.conf       # Example Nginx site config
├── systemd/flashcards.service  # Example systemd unit
├── .env.example                # Deployment environment template
├── docs/pocketbase-setup.md    # Detailed server setup steps
├── docs/invite-only-onboarding.md
└── src/                        # Existing Svelte SPA
```

## Prerequisites

- Node.js + npm for building the Svelte frontend
- `unzip` for the PocketBase release archive
- Nginx for serving the SPA and proxying PocketBase
- systemd for keeping PocketBase running on the server

## Frontend development

The Vite dev server proxies `/api` and `/_/` to PocketBase on `127.0.0.1:8090`.

One-command local dev (starts PocketBase, waits for health, then opens Vite):

```bash
npm install
npm run dev:full
```

If `./pocketbase` is missing, the helper downloads the latest PocketBase release automatically. If you already have a binary somewhere else, set `PB_BIN=/path/to/pocketbase` before launching. On the first local run, the helper uses the example bootstrap credentials from `.env.example` when `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` are not set yet, then bootstraps the superuser and runs migrations before opening Vite.

If you want Vite only, keep using:

```bash
npm run dev
```

If you need to point the app at a different PocketBase origin, set `VITE_POCKETBASE_URL` in your local `.env` file.

Build the frontend assets for deployment:

```bash
npm run build
```

The production Nginx example in this repo serves the generated `dist/` directory.

## PocketBase deployment quick start

1. Clone the repo to your server, for example at `/opt/flashcards`.
2. Download the PocketBase binary into `/opt/flashcards/pocketbase`.
3. Copy `.env.example` to `.env` and set `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` before the first PocketBase start.
4. Create `/opt/flashcards/pb_data` and make sure the `flashcards` service user can write to it.
5. Build the frontend with `npm ci && npm run build`.
6. Install the example service and Nginx files from this repo:
   - `systemd/flashcards.service`
   - `nginx/flashcards.conf`
7. Start PocketBase through systemd. The first start applies the migrations automatically.
8. Log in to the PocketBase admin dashboard at `https://your-domain/_/` using the superuser from `.env`.
9. Create invited user accounts manually in the admin dashboard.

Detailed steps: [docs/pocketbase-setup.md](docs/pocketbase-setup.md)

## What Story 001 adds

### PocketBase auth collection

`pb_migrations/001_create_users_auth.js` configures PocketBase's built-in `users` auth collection and locks it down for invite-only use:

- email/password login enabled
- public signup disabled (`createRule = null`)
- users may only view or update their own record

### Per-user progress schema

`pb_migrations/002_create_card_progress.js` creates `card_progress` with one record per user per word.

Current fields mirror the app's existing card-state model:

- `user`
- `word_id`
- `interval`
- `ease`
- `due_date`
- `review_count`
- `hard_count`
- `got_count`
- `easy_count`
- `last_rating`
- `last_reviewed_at`

The collection includes a unique index on `(user, word_id)` and rules so users can only read/write their own records.

### Superuser bootstrap

`pb_migrations/003_create_superuser.js` creates the first PocketBase superuser from environment variables on first run.

Required variables:

```bash
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=change-this-before-first-run
```

## Backups

PocketBase stores app data in a SQLite database under `pb_data/`.

Simple backup pattern:

```bash
DATE=$(date +%F)
cp /opt/flashcards/pb_data/data.db /opt/backups/flashcards-$DATE.db
find /opt/backups -name 'flashcards-*.db' -mtime +30 -delete
```

Restore process:

1. `sudo systemctl stop flashcards`
2. replace `/opt/flashcards/pb_data/data.db` with the backup copy
3. `sudo systemctl start flashcards`

## Invite-only onboarding

This repo is planned for a small friends-and-family group, not public signup.

Story 001 enforces that by locking down account creation at the collection-rule level. Admins create user accounts manually in the PocketBase dashboard. Invited users sign in through the custom app and can change their password from the account screen. See [docs/invite-only-onboarding.md](docs/invite-only-onboarding.md) for the exact steps.
