# PS-072-08 — Observability and performance: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-08.R01** The PWA sends no telemetry (OBS-7); run duration and mismatch counts stay in local diagnostics.
- **PS-072-08.R02** Scans are chunked so the main thread is blocked no longer than 50 ms at a time.
- **PS-072-08.R03** Run duration meets the budget for large vaults.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_recon_runs_total{status}
- Local diagnostics: classrup_commerce_recon_mismatches{kind}
- Local diagnostics: classrup_commerce_recon_duration_ms (histogram)

**Logs**
- info recon.completed {reportId, mismatchCount, durationMs, correlationId} — no record contents.

**Budgets**
- 20 000 claims scanned in ≤ 10 s in chunks of 500 with no main-thread block over 50 ms.
- Incremental run for one deal ≤ 200 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T12 | load | PS-072-08.R01, PS-072-08.R02, PS-072-08.R03 | 20 000 claims | duration ≤ 10 s; longest main-thread block ≤ 50 ms; no telemetry |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
