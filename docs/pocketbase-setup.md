# PocketBase Setup

This document explains how to deploy the repo-contained PocketBase foundation added in Story 001.

## 1. Provision the server

Example target from the planning docs:

- Ubuntu 24.04 LTS
- Nginx in front of PocketBase
- app checked out at `/opt/flashcards`

Install the base packages you'll need:

```bash
sudo apt update
sudo apt install -y nginx unzip
```

Create a dedicated service user:

```bash
sudo useradd --system --home /opt/flashcards --shell /usr/sbin/nologin flashcards
```

## 2. Clone the repo and install frontend dependencies

```bash
sudo mkdir -p /opt/flashcards
sudo chown -R $USER:$USER /opt/flashcards
cd /opt/flashcards

git clone https://github.com/zainmsyed/quran_words_flashcards.git .
npm ci
npm run build
```

The generated frontend bundle will live in `/opt/flashcards/dist`.

Create the PocketBase data directory and hand it to the service user:

```bash
sudo mkdir -p /opt/flashcards/pb_data
sudo chown flashcards:flashcards /opt/flashcards/pb_data
```

## 3. Download PocketBase

```bash
cd /opt/flashcards
wget https://github.com/pocketbase/pocketbase/releases/download/vX.X.X/pocketbase_X.X.X_linux_amd64.zip
unzip pocketbase_*.zip
chmod +x pocketbase
rm pocketbase_*.zip
```

## 4. Configure environment variables

```bash
cd /opt/flashcards
cp .env.example .env
```

Edit `.env` and set at least:

```bash
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=change-this-before-first-run
```

These values are read by `pb_migrations/003_create_superuser.js` on first startup.

## 5. Install the systemd unit

Copy the example service file from the repo:

```bash
sudo install -m 0644 systemd/flashcards.service /etc/systemd/system/flashcards.service
sudo systemctl daemon-reload
sudo systemctl enable flashcards
```

If your PocketBase checkout path, user, or port differ from the example, edit `/etc/systemd/system/flashcards.service` before starting it.

## 6. Install the Nginx site

Copy the example config and replace `flashcards.example.com` with your real domain:

```bash
sudo install -m 0644 nginx/flashcards.conf /etc/nginx/sites-available/flashcards.conf
sudo ln -sf /etc/nginx/sites-available/flashcards.conf /etc/nginx/sites-enabled/flashcards.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7. First PocketBase start

Before the first start, make sure the bootstrap credentials are set in `.env` and, if you want to do it manually, run the bootstrap sequence once:

```bash
/opt/flashcards/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/opt/flashcards/pb_data
/opt/flashcards/pocketbase migrate up --dir=/opt/flashcards/pb_data --migrationsDir=/opt/flashcards/pb_migrations
```

Start the service:

```bash
sudo systemctl start flashcards
sudo systemctl status flashcards --no-pager
```

On the first successful start, PocketBase should:

- configure the built-in `users` auth collection
- create the `card_progress` collection
- have a superuser available for the admin dashboard

Useful log command:

```bash
sudo journalctl -u flashcards -f
```

## 8. Run the PocketBase smoke test

From the repo root, after PocketBase is installed and `.env` is configured, run:

```bash
npm run smoke:pocketbase
```

The script starts PocketBase against a temporary data directory, waits for `/api/health`, confirms the `users` and `card_progress` collections exist, creates invited users, writes progress, and verifies record ownership rules.

If your PocketBase binary is not at `./pocketbase`, point the script at it with `PB_BIN=/path/to/pocketbase npm run smoke:pocketbase`.

## 9. Verify the deployment

Health check:

```bash
curl http://127.0.0.1:8090/api/health
```

Externally, once Nginx and DNS are in place:

```bash
curl https://your-domain.example/api/health
```

Admin dashboard:

- `https://your-domain.example/_/`

Frontend app:

- `https://your-domain.example/`

## 10. SSL

Once the HTTP site is reachable, add TLS with Certbot:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

## 11. Backups

Create a backup directory:

```bash
sudo mkdir -p /opt/backups
```

Example daily backup script:

```bash
cat <<'EOF' | sudo tee /etc/cron.daily/flashcards-backup >/dev/null
#!/bin/bash
set -euo pipefail
DATE=$(date +%F)
cp /opt/flashcards/pb_data/data.db /opt/backups/flashcards-$DATE.db
find /opt/backups -name 'flashcards-*.db' -mtime +30 -delete
EOF
sudo chmod +x /etc/cron.daily/flashcards-backup
```

Restore procedure:

```bash
sudo systemctl stop flashcards
sudo cp /opt/backups/flashcards-YYYY-MM-DD.db /opt/flashcards/pb_data/data.db
sudo systemctl start flashcards
```
