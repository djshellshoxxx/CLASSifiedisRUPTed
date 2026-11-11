# PS-031-08 — Observability and performance: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-08.R01** The PWA sends no telemetry (OBS-7); counters and diagnostics stay in the vault.
- **PS-031-08.R02** Milestone commands meet p95 ≤ 150 ms excluding attachment hashing, and hashing of 25 MB runs in a worker without blocking the UI longer than 50 ms per slice.
- **PS-031-08.R03** Payment event handling meets p95 ≤ 50 ms per event.

## Specification

**Metrics**
- classrup_services_milestones_total{outcome=submitted|approved|changes_requested|settled|cancelled} (local counter)
- classrup_services_milestone_hash_mismatch_total (local counter)

**Logs**
- info milestone.approved {milestoneId, correlationId} in the local diagnostics log - no file names, notes or amounts.

**Budgets**
- vault command p95 ≤ 150 ms; payment event p95 ≤ 50 ms; list_for_booking p95 ≤ 80 ms for 10 milestones.
- SHA-256 of 25 MB in a Web Worker ≤ 600 ms on a mid-range phone.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T11 | load | PS-031-08.R01, PS-031-08.R02, PS-031-08.R03 | hash 25 MB file and run 100 mixed commands on throttled mobile profile | hashing ≤ 600 ms in worker, command p95 ≤ 150 ms, no telemetry request |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
