# PS-042-08 — Observability and performance: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-08.R01** The PWA sends no telemetry (OBS-7); counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-042-08.R02** Signing and verification of a report with 20 photo hashes meet p95 ≤ 120 ms on a mid-range phone, excluding image re-encoding.
- **PS-042-08.R03** Re-encoding and hashing a 5 MB photo runs in a worker and completes in ≤ 800 ms without blocking the UI longer than 50 ms per slice.

## Specification

**Metrics**
- classrup_rentals_handoffs_total{state} (local counter)
- classrup_rentals_handoff_change_rounds (local histogram)
- classrup_rentals_statements_quarantined_total{code} (local counter)

**Logs**
- info handoff.attested {handoffId, correlationId} in the local diagnostics log - no item names, notes or photo names.

**Budgets**
- sign or verify report p95 ≤ 120 ms; get p95 ≤ 50 ms; photo re-encode and hash 5 MB ≤ 800 ms in a worker.
- Sweep over 2 000 handoffs ≤ 100 ms in slices of at most 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T12 | load | PS-042-08.R01, PS-042-08.R02, PS-042-08.R03 | 2 000 handoffs; 20-photo report; throttled mobile profile | sign/verify p95 ≤ 120 ms, 5 MB photo ≤ 800 ms in worker, no telemetry request |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
