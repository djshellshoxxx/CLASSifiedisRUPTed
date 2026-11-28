# PS-114-10 — Import, export, backup and rollback: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-10.R01** Caches are derived data and are excluded from export, import and backup.
- **PS-114-10.R02** Rolling back a release deletes the cache versions of the newer release on the next activation and keeps users' data untouched.
- **PS-114-10.R03** A kill file lets the static host retire a bad build within one update check (at most 1 hour) by replacing it with a named known-good build, or by unregistering the worker when none can be installed, without touching IndexedDB.

## Specification

- **export:** No export section; Cache Storage contains no user records.
- **import:** Not applicable.
- **backup:** Not backed up; caches can be rebuilt from the network at any time. The static host keeps the previous 3 builds so that rollback and kill-switch replacement are redeploys.
- **migration rollback:** Rollback is redeploying the previous static build (CTR-IOX-001 IOX-4); the older worker installs, activates after consent, and the allowlist cleanup removes the newer precache. /sw-kill.json { "formatVersion": 1, "minReleaseSeq": 42, "killedBuilds": ["<buildId>"], "knownGood": "<buildId>" } is fetched network-only with cache no-store; a worker whose buildId is listed or whose releaseSeq is below minReleaseSeq deletes its classrup- caches and is replaced by knownGood (installed and activated without waiting) or unregisters itself when knownGood is absent or fails to install.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T17 | integration | PS-114-10.R01, PS-114-10.R02 | roll back to build A after B activated | cache cleanup removes B caches, app loads, no user data lost |
| TEST-PS-114-09.T19 | e2e | PS-114-10.R03, PS-114-03.R04 | kill file names active build B with knownGood A; then a kill file names B with no knownGood | within one update check B's caches are deleted and A activates; in the second case the worker unregisters and all classrup- caches are deleted; IndexedDB vault untouched in both |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
