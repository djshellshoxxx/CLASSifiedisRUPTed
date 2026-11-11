# PS-148-08 — Observability and performance: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-08.R01** No telemetry leaves user devices (OBS-7); operator-side jobs are measured under OBS-1 to OBS-4 on the relay.
- **PS-148-08.R02** Compute and publish are batch operations with explicit time budgets.
- **PS-148-08.R03** Overdue publication is a visible alert for operators.

## Specification

**Metrics**
- classrup_governance_transparency_counter_events_total{metric} (relay)
- classrup_governance_transparency_compute_duration_ms (operator vault, local)
- classrup_governance_transparency_days_overdue (gauge)
- classrup_governance_transparency_dead_letter_total (relay)
- classrup_governance_transparency_processed_hours (relay gauge per period)

**Logs**
- info transparency.published {reportId, periodKey, version, correlationId}; no counts below 10 and no identifiers.

**Budgets**
- compute from a snapshot of 1 000 000 counted events p95 <= 2 s; publish p95 <= 300 ms.
- Counter increment p95 <= 20 ms per event at 50 events per second on the relay.
- Public report download p95 <= 150 ms at 50 req/s; snapshot generation p95 <= 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T13 | load | PS-148-08.R01, PS-148-08.R02 | 1 000 000 counted events; relay 50 req/s | compute p95 <= 2 s, publish p95 <= 300 ms, download p95 <= 150 ms |
| TEST-PS-148-09.T17 | integration | PS-148-08.R03 | injected clock reaches periodEnd + 30 days without publication, then + 37 days | overdue alert raised at 30 days and repeated after 7 more days |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
