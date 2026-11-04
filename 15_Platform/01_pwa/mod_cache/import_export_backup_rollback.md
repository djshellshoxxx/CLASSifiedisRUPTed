# PS-114-10 — Import, export, backup and rollback: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-10.R01** Caches are derived data and are excluded from export, import and backup.
- **PS-114-10.R02** Rolling back a release deletes the cache versions of the newer release on the next activation and keeps users' data untouched.
- **PS-114-10.R03** A kill switch file lets operators force every worker to unregister within one update check (at most 1 hour).

## Specification

- **export:** No export section; Cache Storage contains no user records.
- **import:** Not applicable.
- **backup:** Not backed up; caches can be rebuilt from the network at any time. The static host keeps the previous 3 builds so that rollback is a redeploy.
- **migration rollback:** Rollback is redeploying the previous static build (CTR-IOX-001 IOX-4); the older worker installs, activates after consent, and the allowlist cleanup removes the newer precache. /sw-kill.json {"unregister": true, "before": "<buildId>"} makes workers of the named build unregister and clear all classrup- caches.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T17 | integration | PS-114-10.R01, PS-114-10.R02, PS-114-10.R03 | roll back to build A after B activated | cache cleanup removes B caches, app loads, no user data lost |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
