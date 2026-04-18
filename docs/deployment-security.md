# Deployment Security Baseline

This document captures the minimum security expectations for the invite-only deployment baseline.

## Goals

- keep the public app behind TLS
- keep PocketBase private on the internal network
- keep secrets out of source control and out of public logs
- keep the deployment reproducible on a generic VPS provider
- avoid exposing extra public ports or admin surfaces

## Boundary model

- Public traffic should terminate at the reverse proxy / Coolify edge.
- The web container should serve only the built SPA and proxy API/admin traffic to PocketBase.
- PocketBase should not publish a separate public host port.
- The database data directory should persist across container restarts.

## Secret handling

Set runtime secrets in the platform secret store or deployment environment, not in the repo:

- `PB_ADMIN_EMAIL`
- `PB_ADMIN_PASSWORD`
- `PB_VERSION` when you want a pinned PocketBase release

Keep passwords long and unique. Rotate them if they are exposed or reused.

## Container/runtime recommendations

- run the public app from a minimal container image
- keep the PocketBase service internal to the Compose network
- use a persistent volume for PocketBase data
- avoid opening PocketBase on the host firewall
- keep SSH restricted to trusted admin access only
- expose only the ports required for the reverse proxy path (typically 80/443 and SSH)

## Application-layer expectations

- keep invite-only onboarding enabled
- do not enable public self-signup unless the auth story explicitly changes
- treat answer-revealing UI as sensitive and avoid leaking it on the wrong card face
- keep auth/session storage defensive so storage-restricted browsers fail safely

## Maintenance expectations

- rebuild after dependency updates
- verify the public app route after each deploy
- verify the PocketBase admin path is still private to the intended reverse-proxy route
- keep backups and restore drills for a later story phase

## Basic verification checklist

- `npm run smoke:compose` passes locally and verifies the web container can reach PocketBase through the internal Compose network
- `curl https://your-domain.example/api/health` succeeds
- `curl https://your-domain.example/_/` only works through the intended public app domain
- direct access to a PocketBase host port is blocked
- `npm test` and `npm run build` pass before deploy
