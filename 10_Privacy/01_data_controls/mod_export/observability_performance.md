# PS-078-08 — Observability and performance: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-08.R01** The PWA sends no telemetry (OBS-7); job timings, sizes and failures stay in local diagnostics.
- **PS-078-08.R02** Export throughput meets the budget on a mid-range phone without freezing the UI.
- **PS-078-08.R03** Failures name the failing module for support exports of diagnostics.

## Specification

**Metrics**
- Local diagnostics: classrup_privacy_export_jobs_total{status}
- Local diagnostics: classrup_privacy_export_duration_s (histogram)
- Local diagnostics: classrup_privacy_export_bytes (histogram)

**Logs**
- info export.status {jobId, from, to, correlationId} — no record contents.
- warn export.section_failed {jobId, moduleId, errorCode, correlationId}.

**Budgets**
- Export of 50 000 records and 200 MB media completes in ≤ 120 s on a 2022 mid-range Android device; main-thread blocks ≤ 50 ms.
- Manifest build and signing ≤ 300 ms; verification ≤ 300 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T14 | load | PS-078-08.R01, PS-078-08.R02, PS-078-08.R03 | 50 000 records and 200 MB media | ≤ 120 s, main-thread block ≤ 50 ms, manifest sign ≤ 300 ms, no telemetry |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
