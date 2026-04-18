# Coolify Setup

This is the preferred deployment path for Story 017.

It assumes a Coolify-managed VPS where the public app is served through Coolify's reverse proxy/TLS and PocketBase stays private on the internal Docker network.

## What this deployment does

- builds the Svelte app into static assets
- serves the app from a small Nginx container
- proxies `/api/` and `/_/` to a separate PocketBase container
- keeps the PocketBase service off the public network
- stores PocketBase data in a persistent Docker volume

## Required environment variables

Set these in Coolify as secrets or app variables:

- `PB_ADMIN_EMAIL` — PocketBase superuser / admin email
- `PB_ADMIN_PASSWORD` — PocketBase superuser / admin password
- `PB_VERSION` — optional PocketBase release tag for reproducible builds (for example `v0.x.x`)
- `VITE_POCKETBASE_URL` — leave blank for same-origin deployments

The runtime container also uses these values internally:

- `POCKETBASE_BIND=0.0.0.0:8090`
- `POCKETBASE_DATA_DIR=/pb/data`

## Recommended Coolify wiring

1. Create a new **Docker Compose** app in Coolify.
2. Point Coolify at this repository and the branch you want to deploy.
3. Use the repo root `docker-compose.yml`.
4. Expose the `web` service publicly and attach your domain to it.
5. Do **not** publish the `pocketbase` service port to the public internet.
6. Mount a persistent volume for the `pocketbase` service at `/pb/data`.
7. Let Coolify handle TLS termination for the public domain.

## First deploy checklist

- confirm `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` are set before the first deploy
- confirm `PB_VERSION` is either pinned or intentionally left on the default
- confirm the PocketBase volume is persistent across redeploys
- confirm the public app loads over HTTPS
- confirm `/api/health` works through the public app domain
- confirm PocketBase is not reachable on a public host port

## Smoke checks

Before deploying, run the local compose smoke to verify the service-to-service path inside Docker:

```bash
npm run smoke:compose
```

That check should fail if the web container cannot reach PocketBase on the internal network.

After deploy, test from outside the host:

```bash
curl https://your-domain.example/api/health
curl https://your-domain.example/
curl https://your-domain.example/_/
```

The first two should return successfully. The admin route should only be reachable through the public app domain, not via a separate public PocketBase port.

## Notes

- The app is intentionally same-origin, so the frontend resolves the PocketBase base URL from the current origin unless `VITE_POCKETBASE_URL` is explicitly set.
- If you need to pin a PocketBase release, set `PB_VERSION` before the build.
- The older manual Nginx/systemd deployment docs are preserved for history; this Coolify path is the recommended one for the security baseline.
