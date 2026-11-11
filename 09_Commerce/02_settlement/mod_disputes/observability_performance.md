# PS-070-08 — Observability and performance: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-08.R01** The PWA sends no telemetry (OBS-7); case counters, deadlines and errors stay in local diagnostics.
- **PS-070-08.R02** Relays that publish a mediator directory follow CTR-OBS-001 for that endpoint.
- **PS-070-08.R03** Local commit and ingest meet the stated budgets.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_disputes_total{status}
- Local diagnostics: classrup_commerce_dispute_deadline_overdue (gauge)
- Local diagnostics: classrup_commerce_dispute_statements_total{outcome=applied|stored_blocked|quarantined|dropped}
- Relay only: classrup_commerce_mediator_directory_requests_total

**Logs**
- info dispute.status {caseId, from, to, correlationId} — no descriptions, notes or evidence content.

**Budgets**
- open, propose, accept p95 ≤ 120 ms local commit; evidence statement commit p95 ≤ 100 ms excluding metadata stripping and blob upload.
- Case timeline render for 200 statements ≤ 200 ms; sweep over 1 000 cases ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T14 | load | PS-070-08.R01, PS-070-08.R02, PS-070-08.R03 | 1 000 cases and a 200-statement timeline | commit p95 ≤ 120 ms, render ≤ 200 ms, sweep ≤ 500 ms, no telemetry |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
