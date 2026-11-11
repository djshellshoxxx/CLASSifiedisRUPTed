# PS-016-03 — Workflow state machine: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-03.R01** Reports have no state transitions; a new evaluation creates a new report and the previous report for the same subject revision remains for audit until retention.
- **PS-016-03.R02** Staleness is computed from the local clock at read time and a stale report is never accepted for consent or commit decisions.
- **PS-016-03.R03** The pure function has no side effects other than the optional storage of its report.

## Specification

**Note:** FeasibilityReport is immutable derived output with no lifecycle; staleness is computed from staleAt at read time. Subject state machines live in F02.S01.M01 and F02.S03.M01.

### Timeouts and scheduled transitions

- Reports expire for decisions after 10 minutes and are purged after 30 days.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T06 | unit | PS-016-03.R01, PS-016-03.R02 | report older than 10 minutes used for consent | MUTINY_FEASIBILITY_STALE |
| TEST-PS-016-09.T12 | integration | PS-016-03.R03, PS-016-07.R03 | report cited by a signed revision, 30 days later | standalone report purged, cited hash retained in revision evidence |

## Dependencies

Module depends on: F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
