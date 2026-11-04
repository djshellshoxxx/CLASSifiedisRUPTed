# PS-148-02 — Validation rules: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-02.R01** Inputs are validated against closed vocabularies so counters can never carry identifying text.
- **PS-148-02.R02** Computation and publication validate suppression, coverage, reviewer separation and period state.
- **PS-148-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | periodKey matches YYYY-Qn (n 1..4) or YYYY-MM and the period has ended before compute | GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |
| V02 | legal request type in court_order, law_enforcement, data_subject, other and outcome in complied, partial, rejected | VALIDATION_FAILED |
| V03 | legal request increment is an integer 1..1000 and no free text is accepted | VALIDATION_FAILED |
| V04 | counter dimension belongs to the closed vocabulary of its metric | VALIDATION_FAILED |
| V05 | computed tables contain no cell with value 1..9 and apply complementary suppression per row | GOVERNANCE_TRANSPARENCY_SUPPRESSION |
| V06 | reviewer key differs from the compiler key and is a registered operator key | GOVERNANCE_TRANSPARENCY_SELF_REVIEW |
| V07 | publish only for status computed with matching contentCid | CONFLICT_STATE |
| V08 | at most 1 published version per period unless the new version supersedes it with a correction note | CONFLICT_STATE |
| V09 | report body <= 64 KiB JCS and schema version supported | UNSUPPORTED_SCHEMA_VERSION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | compute 2026-Q3 | report immutable with contentCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T02 | unit | PS-148-02.R02, PS-148-02.R03 | violate each rule V01-V09 | documented error code returned; nothing published |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
