# PS-048-08 — Observability and performance: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-08.R01** The PWA sends no telemetry; local diagnostics hold counters of shares granted, expired and failed delivery without positions.
- **PS-048-08.R02** Setting a home cell completes within 100 ms locally and a share grant within 300 ms excluding transport.
- **PS-048-08.R03** Expiry is enforced within 30 seconds of effectiveExpiresAt while the app is open and before any read after unlock.

## Specification

**Metrics**
- local counter location_share_total{outcome=granted|revoked|expired|blocked}
- local gauge location_share_active

**Logs**
- info location.share {shareId, event} in the local diagnostics log - never positions, cells or DIDs.

**Budgets**
- set_home p95 <= 100 ms and grant p95 <= 300 ms on a Moto G-class device; expiry lag <= 30 s while the app is open; GPS one-shot timeout 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T11 | integration | PS-048-08.R01, PS-048-08.R02, PS-048-08.R03 | expiry with the clock advanced past effectiveExpiresAt while app open and after unlock | share ended within 30 s or before the first read |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
