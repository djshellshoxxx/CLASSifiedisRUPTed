# PS-114-01 — Domain schema: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-01.R01** The module owns no persisted entity; it defines cache namespaces, the build-time precache manifest and the routing table as configuration.
- **PS-114-01.R02** Cache names follow classrup-precache-v{buildId} for the Workbox precache and classrup-img-v1-<partition> for runtime public images, where buildId is the 8-character content hash of the build and partition is the first 16 hex characters of SHA-256 of the principal DID and a per-device random salt.
- **PS-114-01.R03** The routing table is data (an ordered list of rules) so it can be unit tested without a browser.
- **PS-114-01.R04** Image cache entries are keyed by content address under the synthetic same-origin URL /__media/sha256-<base64url>, so the same blob fetched from any relay is one entry and the relay that served it is not recorded.

## Specification

**Note:** Library and service worker module: no domain entities. Cache Storage entries are derived, disposable and reproducible from the network; image entries are keyed by content address (blob:sha256-<base64url> of F15.S02.M03) in per-principal partitions, so no schema or retention record is kept.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T01 | unit | PS-114-01.R01, PS-114-01.R02, PS-114-01.R03 | routing table evaluated for 30 sample URLs (shell, /__media/ path, relay media, relay command, mailbox, cross-origin) | each URL maps to the documented strategy and cache name |
| TEST-PS-114-09.T22 | integration | PS-114-01.R04, PS-114-04.R04 | img1 fetched from r1, then the same content address requested while only r2 (honest) is bound and then offline | second and third requests served from the cache entry keyed by content address without contacting a relay; r1 response headers match the F15.S02.M01 media contract |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
