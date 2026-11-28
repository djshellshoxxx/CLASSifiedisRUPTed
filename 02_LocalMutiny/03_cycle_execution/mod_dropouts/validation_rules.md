# PS-022-02 — Validation rules: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-02.R01** Only a participant can withdraw themselves, and withdrawal is allowed while the cycle is proposed, committed or executing.
- **PS-022-02.R02** Peer notices are accepted only when signed by the participant they concern; timeouts and signals are accepted only from the local clock and local rules.
- **PS-022-02.R03** Phase and outcome are computed from verified handover evidence in the same transaction and never from a claim in the notice.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | withdrawing principal is a participant of the cycle | FORBIDDEN |
| V02 | cycle status is proposed, committed or executing | CONFLICT_STATE |
| V03 | publicReason is one of withdrew, unavailable, timeout | VALIDATION_FAILED |
| V04 | peer withdrawal statement signature verifies against a registered, non-revoked key of the participant it names and the cycle id matches | MUTINY_DROPOUT_STATEMENT_INVALID |
| V05 | claimedAt is not more than 5 minutes after the local clock | MUTINY_DROPOUT_STATEMENT_INVALID |
| V06 | phase and outcome equal the values computed from handover evidence held in this vault inside the same transaction | MUTINY_DROPOUT_PHASE_CONFLICT |
| V07 | no operation changes participantIds of a cycle or inserts a replacement; any such request is refused | MUTINY_REROUTE_FORBIDDEN |
| V08 | timeout dropouts are recorded only when the local clock is at or past the relevant deadline | MUTINY_DROPOUT_NOT_DUE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T03 | unit | PS-022-02.R01, PS-022-02.R03 | each rule V01..V08 violated in turn | documented error code and nothing recorded |
| TEST-PS-022-09.T09 | abuse | PS-022-05.R01, PS-022-05.R02, PS-022-07.R02, PS-022-01.R02, PS-022-02.R02 | forged withdrawal for another person; other principal calls withdraw; replay on new cycle | quarantined or FORBIDDEN; replay ignored |
| TEST-PS-022-09.T18 | abuse | PS-022-05.R03, PS-022-02.R02 | relay injects a withdrawal signed with the relay key naming Bob, a fabricated cancel notice, and a replayed old withdrawal of Bob from another cycle | all ignored or quarantined; no cycle cancelled and no reservation released |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
