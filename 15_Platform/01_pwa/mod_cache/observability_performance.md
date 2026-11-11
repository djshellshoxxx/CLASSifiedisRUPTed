# PS-114-08 — Observability and performance: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-08.R01** Cache effectiveness and update adoption are measured only locally in the vault diagnostics view (the PWA sends no telemetry, CTR-OBS-001 OBS-7) and in CI runs.
- **PS-114-08.R02** Cached shell navigation meets the PWA budgets of CTR-OBS-001 OBS-5 (LCP ≤ 2.5 s on Moto G-class with 4G profile).
- **PS-114-08.R03** Precache size and entry count are tracked in CI per commit and fail the build on budget violations.

## Specification

**Metrics**
- classrup_platform_sw_cache_total{outcome=hit|miss|digest_mismatch} (local diagnostics counter, route class image|shell only, never transmitted)
- classrup_platform_sw_update_total{outcome=prompted|accepted|deferred|killed}
- classrup_platform_sw_precache_bytes (CI gauge per build)

**Logs**
- console.debug only in development builds; production worker logs nothing. Errors are counted, not described.

**Budgets**
- Precache ≤ 1572864 bytes and ≤ 120 entries; initial JS ≤ 150 KiB gzip (OBS-5); service worker script itself ≤ 40 KiB gzip.
- Shell from cache: time to first render ≤ 300 ms after worker start on a Moto G-class device; image cache hit served in ≤ 20 ms; SHA-256 verification of a 1 MiB image ≤ 15 ms (SubtleCrypto).
- Activation cleanup completes in ≤ 500 ms for 5 stale caches.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T13 | load | PS-114-08.R03, PS-114-08.R02 | Lighthouse CI on Moto G-class 4G profile with warm and cold cache | LCP ≤ 2.5 s, precache within budget, initial JS ≤ 150 KiB gzip |
| TEST-PS-114-09.T14 | integration | PS-114-08.R01 | run an offline session with 10 image hits and watch network traffic | local counters updated, no telemetry request is made, counters contain no URLs or identifiers |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
