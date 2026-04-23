# Coolify Setup

This is the preferred deployment path for Story 017.

It assumes a Coolify-managed VPS where the app and PocketBase run in the same Docker Compose stack.

This repo supports two deployment topologies:

1. **Same-origin** — the `web` container serves the SPA and proxies PocketBase through the same public domain.
2. **Split-domain** — the `web` container serves only the SPA, while PocketBase is exposed on its own public subdomain.

## What this deployment does

- builds the Svelte app into static assets
- serves the app from a small Nginx container
- runs PocketBase in a separate container with persistent storage
- supports either same-origin proxying or a dedicated PocketBase subdomain
- stores PocketBase data in a persistent Docker volume

## Required environment variables

Set these in Coolify as secrets or app variables:

- `PB_ADMIN_EMAIL` — PocketBase superuser / admin email
- `PB_ADMIN_PASSWORD` — PocketBase superuser / admin password
- `PB_VERSION` — optional PocketBase release tag for reproducible builds (for example `v0.x.x`)
- `VITE_POCKETBASE_URL` — leave blank for same-origin deployments; set it to the PocketBase origin for split-domain deployments
- `WEB_PROXY_POCKETBASE` — `1` to keep same-origin proxying on the app domain, `0` to make the app domain SPA-only

The runtime container also uses these values internally:

- `POCKETBASE_BIND=0.0.0.0:8090`
- `POCKETBASE_DATA_DIR=/pb/data`

## Recommended Coolify wiring

1. Create a new **Docker Compose** app in Coolify.
2. Point Coolify at this repository and the branch you want to deploy.
3. Use the repo root `docker-compose.yml`.
4. Mount a persistent volume for the `pocketbase` service at `/pb/data`.
5. Let Coolify handle TLS termination for the public domain(s).

### Same-origin wiring

Use this when the app and PocketBase should live behind the same public domain.

- `WEB_PROXY_POCKETBASE=1`
- `VITE_POCKETBASE_URL=`
- expose the `web` service publicly and attach your app domain to it
- do **not** expose the `pocketbase` service publicly

### Split-domain wiring

Use this when the app should live at one host and PocketBase at another.

Example:

- app: `https://arabicflashcard.com`
- PocketBase/API/admin host: `https://admin.arabicflashcard.com`

Set:

- `WEB_PROXY_POCKETBASE=0`
- `VITE_POCKETBASE_URL=https://admin.arabicflashcard.com`

Then in Coolify:

- expose the `web` service publicly on the app domain only
- expose the `pocketbase` service publicly on the PocketBase subdomain only
- do **not** rely on the app domain for `/api/` or `/_/` in this mode

## First deploy checklist

- confirm `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` are set before the first deploy
- confirm `PB_VERSION` is either pinned or intentionally left on the default
- confirm the PocketBase volume is persistent across redeploys
- confirm the public app loads over HTTPS
- same-origin: confirm `/api/health` works through the public app domain
- split-domain: confirm `https://admin.your-domain.example/api/health` works and the app domain no longer proxies PocketBase
- confirm PocketBase is not reachable on an unmanaged raw host port

## Smoke checks

Before deploying, run the local compose smoke to verify the service-to-service path inside Docker:

```bash
npm run smoke:compose
```

For split-domain mode, run the same smoke with the split-domain build toggle:

```bash
WEB_PROXY_POCKETBASE=0 VITE_POCKETBASE_URL=https://admin.example.com npm run smoke:compose
```

That check should fail if the web container cannot reach PocketBase on the internal network or, in split-domain mode, if the app domain still proxies PocketBase.

After deploy, test from outside the host.

### Same-origin

```bash
curl https://your-domain.example/api/health
curl https://your-domain.example/
curl https://your-domain.example/_/
```

### Split-domain

```bash
curl https://your-app-domain.example/
curl https://your-pocketbase-domain.example/api/health
curl https://your-pocketbase-domain.example/_/
curl -I https://your-app-domain.example/api/health
```

In split-domain mode, the first three should succeed and the last one should **not** proxy PocketBase anymore.

## Notes

- The frontend resolves the PocketBase base URL from `VITE_POCKETBASE_URL` first; if you leave it blank, it falls back to the current origin.
- In split-domain mode, the PocketBase admin UI is still at `https://admin.example.com/_/`.
- If you need to pin a PocketBase release, set `PB_VERSION` before the build.
- The older manual Nginx/systemd deployment docs are preserved for history; this Coolify path is the recommended one for the security baseline.
