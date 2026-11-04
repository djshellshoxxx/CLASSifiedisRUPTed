# PS-022-03 — Workflow state machine: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-03.R01** Before any handover evidence exists a dropout cancels the cycle and the vault releases its own reservations in the same transaction, and exactly one cancelled event is emitted per cycle.
- **PS-022-03.R02** After any handover evidence exists a dropout never cancels the cycle; it is recorded and the cycle moves to partially_executed with a recovery case, so already handed-over items are not abandoned.
- **PS-022-03.R03** No dropout, timeout or loss signal adds, removes or substitutes participants, and the next step for the others is only a fresh suggestion and fresh consent.
- **PS-022-03.R04** Late evidence arriving after cancellation never reopens the cycle; it is stored and may open a standalone recovery case.

## Specification

**Note:** DropoutRecord is append-only evidence without lifecycle. The effect of a dropout on the exchange is expressed in the Cycle state machine of F02.S03.M01 (proposed or committed to cancelled, executing to partially_executed) and in the RecoveryCase of F02.S03.M04.

### Timeouts and scheduled transitions

- Consent deadline: at consentDeadline on the local clock a proposed cycle is cancelled with reason consent_timeout, with dropout records for participants whose valid consent or reservation is missing.
- Execution deadline: at consentDeadline + executionWindowMs a committed cycle without handover evidence is cancelled with reason execution_timeout; with evidence it moves to partial execution.
- Both deadlines are evaluated on vault open and every 60 s while open; clock disagreement with relay receipt times counts as past the deadline.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T01 | integration | PS-022-01.R01, PS-022-03.R01, PS-022-04.R02 | Bob withdraws in committed 3-party cycle before any handover | cancelled in all three vaults, reservations released, exactly one cancelled event per vault |
| TEST-PS-022-09.T02 | integration | PS-022-01.R03, PS-022-03.R02, PS-022-06.R02 | Dan withdraws in 4-party cycle after Alice's handed_over evidence | outcome partially_executed, cycle not cancelled, recovery opened by F02.S03.M04 |
| TEST-PS-022-09.T04 | property | PS-022-03.R01, PS-022-03.R03 | random sequences of withdraw, timeout, late evidence, duplicate notices | cancelled iff evidence count 0 at record time; terminal cycles never reopen; participantIds unchanged |
| TEST-PS-022-09.T05 | integration | PS-022-03.R04, PS-022-06.R03 | handed_over attestation arrives after cancellation | cycle stays cancelled and a standalone recovery case is opened |
| TEST-PS-022-09.T06 | integration | PS-022-03.R01, PS-022-04.R03 | 6-party cycle with two silent participants at deadline on local clocks | cycle cancelled with dropout records basis local_clock; no signature produced for the silent ones |
| TEST-PS-022-09.T07 | abuse | PS-022-03.R03, PS-022-07.R03 | attempt to add, remove or replace a participant through revision, roster or dropout calls | MUTINY_REROUTE_FORBIDDEN everywhere; participantIds unchanged |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M04, F02.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
