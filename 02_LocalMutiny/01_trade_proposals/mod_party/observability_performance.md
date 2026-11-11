# PS-014-08 — Observability and performance: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-08.R01** Roster command outcomes are counted in local diagnostics without DIDs (OBS-7).
- **PS-014-08.R02** join for 8 parties completes within 30 ms p95.
- **PS-014-08.R03** Roster mismatch occurrences are visible in diagnostics for support.

## Specification

**Metrics**
- classrup_mutiny_roster_total{outcome=joined|left|removed|rejected} (local diagnostics)

**Logs**
- info party.joined {subjectType, count, correlationId} — no DIDs.

**Budgets**
- join p95 ≤ 30 ms for 8 parties; list_for_subject p95 ≤ 10 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T11 | load | PS-014-08.R02 | join 8 parties on emulated Moto G | p95 ≤ 30 ms |
| TEST-PS-014-09.T12 | unit | PS-014-08.R01, PS-014-08.R03, PS-014-09.R01, PS-014-09.R03 | diagnostics and traceability tool | no DIDs in diagnostics; every PS-014 requirement maps to a passing test |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
