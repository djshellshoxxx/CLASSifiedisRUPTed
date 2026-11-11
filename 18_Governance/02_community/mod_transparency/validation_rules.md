# PS-148-02 — Validation rules: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-02.R01** Inputs are validated against closed vocabularies so counters can never carry identifying text.
- **PS-148-02.R02** Computation and publication validate suppression, coverage, reviewer separation and period state.
- **PS-148-02.R03** Every violation maps to one stable error code.
- **PS-148-02.R04** Receivers verify two distinct operator signatures, compiler on the draft and reviewer on the report, against the relay's signed operator list and refuse self-reviewed reports.
- **PS-148-02.R05** Differencing is prevented across periods and versions: one period granularity per relay and suppression of small changes between a correction and the version it supersedes.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | periodKey matches YYYY-Qn (n 1..4) or YYYY-MM and the period has ended (relay time) before compute | GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |
| V02 | legal request type in court_order, law_enforcement, data_subject, other and outcome in complied, partial, rejected | VALIDATION_FAILED |
| V03 | legal request increment is an integer 1..1000 and no free text is accepted | VALIDATION_FAILED |
| V04 | counter dimension belongs to the closed vocabulary of its metric bound to the producer enum; events with origin vault, spam events with mode vault_filter and decided events whose publisherId is not an operator key of this relay are ignored, not counted | VALIDATION_FAILED |
| V05 | computed tables contain no cell with value 1..9 (shown under_10), apply complementary suppression per row (shown suppressed) and publish no total for a metric with any suppressed cell | GOVERNANCE_TRANSPARENCY_SUPPRESSION |
| V06 | reviewer key differs from the compiler key and both are operatorKeys of the relay's latest verified classrup.platform.tenant_config/v1 (F15.S04.M03) | GOVERNANCE_TRANSPARENCY_SELF_REVIEW |
| V07 | publish only for a received draft in awaiting_review whose contentCid the reviewer recomputed from the same snapshot or explicitly inspected | CONFLICT_STATE |
| V08 | at most 1 published version per (relayId, periodKey) unless the new version supersedes it with a correction note | CONFLICT_STATE |
| V09 | schema major version supported | UNSUPPORTED_SCHEMA_VERSION |
| V10 | one period granularity per relay, fixed by its first published report; a periodKey of the other granularity, or one overlapping any published period, is rejected | GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |
| V11 | in a correction every cell whose absolute change from the superseded version is 1..9 is suppressed in the new version; compute fails otherwise | GOVERNANCE_TRANSPARENCY_SUPPRESSION |
| V12 | the snapshot is a classrup.governance.transparency_counts/v1 signed by the relay's current key (or the previous key inside the 7-day rotation overlap), for the same relayId and periodKey, frozen, with coverage derived from processing checkpoints | VALIDATION_FAILED |
| V13 | receivers verify the compiler signature on the embedded draft and the reviewer signature on the report over the same contentCid, signers distinct and both operator keys of the relay | GOVERNANCE_TRANSPARENCY_SELF_REVIEW |
| V14 | two different verified reports for the same (relayId, periodKey, version) mark both conflicted and neither is shown as current | CONFLICT_STATE |
| V15 | report body <= 64 KiB JCS and snapshot <= 256 KiB | PAYLOAD_TOO_LARGE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | import the 2026-Q3 snapshot and compute | report immutable with contentCid and snapshotCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T02 | unit | PS-148-02.R02, PS-148-02.R03 | violate each rule V01-V15 | documented error code returned; nothing published |
| TEST-PS-148-09.T03 | property | PS-148-07.R03, PS-148-02.R05 | random counter tables, month and quarter series and v1/v2 correction pairs | no published cell between 1 and 9; complementary suppression and withheld totals prevent recovery; differencing across granularities is impossible because V10 rejects the second granularity; v1/v2 differences never reveal a value 1..9 |
| TEST-PS-148-09.T05 | integration | PS-148-03.R02, PS-148-02.R04 | O1 publishes its own draft; O2 publishes; X countersigns; V receives each | GOVERNANCE_TRANSPARENCY_SELF_REVIEW for O1 and for X's report in V; O2's report verified with both signatures against the operator list |
| TEST-PS-148-09.T12 | abuse | PS-148-02.R01, PS-148-07.R01 | legal request with free text; 101 increments in a day | rejected by schema; RATE_LIMITED; scope key present in body |
| TEST-PS-148-09.T20 | abuse | PS-148-07.R04, PS-148-02.R05 | publish quarterly 2026-Q3 then compute 2026-08; publish a correction where one cell changes from 15 to 12 | monthly compute rejected with GOVERNANCE_TRANSPARENCY_PERIOD_INVALID; the changed cell is suppressed in v2 |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
