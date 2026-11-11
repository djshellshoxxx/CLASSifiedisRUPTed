# PS-058-08 — Observability and performance: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-08.R01** The PWA sends no telemetry; local diagnostics keep counters without DIDs or content.
- **PS-058-08.R02** Recompute for a subject with 500 reviews completes within 20 ms on a Moto G-class device, and reputation card render fits the PWA budget (LCP at most 2.5 s on the 4G profile).
- **PS-058-08.R03** Verification of a review (author signature plus ticket signature) takes at most 15 ms p95.

## Specification

**Metrics**
- local counter review_total{event=posted|received|quarantined|withdrawn,reason}
- local counter review_ticket_total{event=signed|received|quarantined}
- local histogram reputation_recompute_duration_ms

**Logs**
- info review.event {event, correlationId} in the local diagnostics log - no DIDs, ratings or comments.

**Budgets**
- verify review p95 <= 15 ms; recompute 500 reviews with selection p95 <= 20 ms; list 50 reviews p95 <= 50 ms on a Moto G-class device.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T12 | load | PS-058-08.R01, PS-058-08.R02, PS-058-08.R03 | verify 1 000 reviews and recompute a 500 review subject on emulated Moto G | verify p95 <= 15 ms, recompute p95 <= 20 ms; counters carry no DIDs |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
