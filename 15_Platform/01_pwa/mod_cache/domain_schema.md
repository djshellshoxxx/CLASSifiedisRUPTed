# PS-114-01 — Domain schema: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-01.R01** The module owns no persisted entity; it defines cache namespaces, the build-time precache manifest and the routing table as configuration.
- **PS-114-01.R02** Cache names follow classrup-precache-v{buildId} for the Workbox precache and classrup-img-v1 for runtime public images, where buildId is the 8-character content hash of the build.
- **PS-114-01.R03** The routing table is data (an ordered list of rules) so it can be unit tested without a browser.

## Specification

**Note:** Library and service worker module: no domain entities. Cache Storage entries are derived, disposable and fully reproducible from the network, so no schema or retention record is kept.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T01 | unit | PS-114-01.R01, PS-114-01.R02, PS-114-01.R03 | routing table evaluated for 30 sample URLs (shell, public image, api, private media, cross-origin) | each URL maps to the documented strategy and cache name |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
