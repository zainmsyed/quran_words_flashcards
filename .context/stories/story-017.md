# Story 017: Coolify deployment hardening baseline — TLS, proxy, headers, and least-privilege hosting

**Status:** complete  
**Created:** 2026-04-18  
**Last accessed:** 2026-04-18  
**Completed:** 2026-04-18

## Goal
Harden a Coolify-managed single-VPS deployment so the Svelte app and PocketBase run on the same host behind Coolify's reverse proxy/TLS, with private backend access, locked-down secrets, and least-privilege service settings.

## Verification
Run `docker compose config`, `npm run smoke:compose`, and the `docker build --target web` / `docker build --target pocketbase` checks locally, then confirm the Compose topology keeps PocketBase private and the public web service as the only exposed entrypoint.

## Scope
- Dockerfile
- docker-compose.yml
- .dockerignore
- docs/coolify-setup.md
- docs/deployment-security.md
- scripts/pocketbase-bootstrap.mjs
- scripts/dev-with-pocketbase.mjs
- scripts/coolify-compose-smoke.mjs
- package.json
- .env.example

## Out of scope
- Application code security fixes
- Automated dependency/secret scanning
- Backups, restore drills, and incident response runbooks
- WAF/CDN/DDoS services
- Public self-signup or auth redesign
- Standalone nginx/systemd deployment docs that bypass Coolify

## Dependencies
- None

## Checklist
- [x] Add or update the Coolify deployment templates so PocketBase is isolated privately and the public app is served over TLS.
  - Implemented: added a multi-target `Dockerfile`, a `docker-compose.yml` stack for the public web container and private PocketBase container, and a `.dockerignore` to keep the build context lean.
- [x] Document least-privilege runtime settings, secret injection, persistent storage, and firewall requirements for the deployment.
  - Implemented: added `docs/coolify-setup.md` and `docs/deployment-security.md` with Coolify-specific setup, secret, and firewall guidance.
- [x] Add or update bootstrap/dev helpers so the Coolify deployment path is reproducible without manual guesswork.
  - Implemented: updated `scripts/dev-with-pocketbase.mjs` to accept the same bind/data-dir settings used by the deployment docs and compose path.
- [x] Verify the hardened deployment path with local Compose/build checks that confirm the app is served by the web container and PocketBase stays private.
  - Verification: `docker compose config`, `npm run smoke:compose`, `docker build --target web`, and `docker build --target pocketbase` passed locally; the compose topology keeps PocketBase on the internal network and exposes only the web service.

## Issues
- None at code level. Live Coolify smoke is intentionally deferred outside this story.

## Completion Summary
- Implemented the Coolify-oriented deployment baseline for a generic VPS where the app and PocketBase share the same host.
- Added a multi-stage `Dockerfile` with separate `web` and `pocketbase` targets, plus a `docker-compose.yml` stack that keeps PocketBase private and serves the SPA through the public web container.
- Added a `.dockerignore` to keep build context lean and avoid shipping local-only files.
- Added Coolify/deployment docs covering secret handling, persistent storage, reverse-proxy/TLS behavior, and the expected smoke checks.
- Updated the local dev helper to accept the same bind/port settings used by the deployment path.
- Mechanically verified `npm test`, `npm run build`, `npm run smoke:compose`, the Docker Compose config, and both Docker build targets locally.
- Live Coolify smoke is intentionally out of scope for this story; if you later deploy to Coolify, run the smoke checks in the deployment docs then.
