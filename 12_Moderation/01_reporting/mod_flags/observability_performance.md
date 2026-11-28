# PS-094-08 — Observability and performance: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-08.R01** Relay report intake is measured per CTR-OBS-001 and logs contain no report details or reporter keys; the PWA sends no telemetry (OBS-7).
- **PS-094-08.R02** Vault file completes locally within 150 ms p95 for a 256 KiB snapshot, and the report sheet meets PWA budgets (OBS-5).
- **PS-094-08.R03** Relay intake lag between received and linked is observable and alerting.

## Specification

**Metrics**
- classrup_moderation_reports_total{outcome=received|duplicate|rejected|withdrawn|forwarded_refused} (relay)
- classrup_moderation_report_statements_total{type=receipt|linked|outcome} (relay)
- classrup_moderation_report_intake_lag_ms (relay gauge: now - oldest received report without case)
- Local diagnostics counter reports_prepared (vault, exportable, never sent)

**Logs**
- relay info report.received {reportId, reasonCode, correlationId} — no reporter key, no details.
- vault local log report.delivery_state {reportId, syncState} — kept in vault diagnostics only.

**Budgets**
- Vault file p95 ≤ 150 ms; relay receive p95 ≤ 300 ms at 50 req/s; list_mine p95 ≤ 100 ms for 50 items.
- Relay intake lag p95 ≤ 5 s; alert when a report stays unlinked for 24 h.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T13 | load | PS-094-08.R01, PS-094-08.R03 | 50 report receives per second for 5 minutes on relay | p95 ≤ 300 ms, intake lag p95 ≤ 5 s, no reporter key in logs |
| TEST-PS-094-09.T14 | unit | PS-094-08.R02, PS-094-09.R01 | vault file with 256 KiB snapshot on Moto G profile; traceability tool run | p95 ≤ 150 ms; every PS-094 requirement maps to a passing test |
| TEST-PS-094-09.T16 | e2e | PS-094-03.R02, PS-094-08.R02 | mobile reporter files a report offline then reconnects | single report, delivery status progresses Saved, Sent, Relay acknowledged honestly, axe zero serious issues |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
