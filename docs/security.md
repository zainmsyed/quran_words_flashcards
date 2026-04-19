# Security Checks

This project uses a lightweight security gate to catch obvious dependency and secret mistakes before code lands.

## Run locally

```bash
npm run security-check
```

The check does two things:

1. Runs `npm audit` and fails on **high** or **critical** advisories.
2. Scans tracked text files for obvious secret leaks such as private keys, live API tokens, and hard-coded passwords.

Moderate `npm audit` findings are reported as warnings so the current dev toolchain can still pass while upgrades are scheduled.

## In CI

The same check runs in `.github/workflows/security.yml` on pushes and pull requests.

## When it fails

- **Dependency audit failure:** inspect the `npm audit` output, upgrade the affected dependency, rerun `npm install` if the lockfile changes, and commit the updated package files.
- **Secret scan failure:** move the value into an environment variable or secret store, remove the hard-coded value from the repository, and rotate the secret if it was real.

## Notes

- The scanner is intentionally lightweight; it is meant to catch obvious leaks, not replace a dedicated security review.
- Keep placeholder examples in docs obviously fake so the scan can distinguish them from real secrets.
