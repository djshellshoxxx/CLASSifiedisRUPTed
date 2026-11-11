# PS-092-08 — Observability and performance: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-08.R01** Relay appeal intake, queue age and decision latency are measured per CTR-OBS-001 without statement text in logs.
- **PS-092-08.R02** Receive and decide meet the write budget (p95 ≤ 300 ms) at 50 req/s.
- **PS-092-08.R03** Overdue appeals are observable and alerting.

## Specification

**Metrics**
- classrup_moderation_appeals_total{outcome=filed|upheld|overturned|reduced|withdrawn|moot}
- classrup_moderation_appeal_reassignments_total{reason}
- classrup_moderation_appeal_age_ms (gauge: now - oldest undecided appeal)
- classrup_moderation_appeals_overdue_total

**Logs**
- relay info appeal.decided {appealId, outcome, correlationId} — no statement text, no keys.
- warn appeal.overdue {appealId, ageDays, correlationId}.

**Budgets**
- receive and decide p95 ≤ 300 ms; list_queue p95 ≤ 150 ms for 50 items.
- Assignment of 1 000 queued appeals completes in ≤ 5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T12 | load | PS-092-08.R01, PS-092-08.R02, PS-092-08.R03 | 50 req/s mixed receive and decide for 5 minutes; assign 1 000 appeals; 20 appeals pass day 14 undecided | p95 ≤ 300 ms, assignment ≤ 5 s, overdue metric counts 20, no statement text in logs |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
