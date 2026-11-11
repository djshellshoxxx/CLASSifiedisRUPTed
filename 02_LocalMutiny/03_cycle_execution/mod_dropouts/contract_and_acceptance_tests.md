# PS-022-09 — Contract and acceptance tests: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-022-09.R02** Multi-vault tests with per-vault clocks cover 2-, 3-, 4- and 6-party cycles and the three phases.
- **PS-022-09.R03** A negative test proves no code path can change participantIds or substitute a participant.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults Alice, Bob, Carol, Dan and Erin..Gus (6); cycles C2, C3, C4, C6 committed; attestation fixtures for handed_over; per-vault clocks from 2026-11-04T10:00:00Z; fake relay with delays.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T01 | integration | PS-022-01.R01, PS-022-03.R01, PS-022-04.R02 | Bob withdraws in committed 3-party cycle before any handover | cancelled in all three vaults, reservations released, exactly one cancelled event per vault |
| TEST-PS-022-09.T02 | integration | PS-022-01.R03, PS-022-03.R02, PS-022-06.R02 | Dan withdraws in 4-party cycle after Alice's handed_over evidence | outcome partially_executed, cycle not cancelled, recovery opened by F02.S03.M04 |
| TEST-PS-022-09.T03 | unit | PS-022-02.R01, PS-022-02.R03 | each rule V01..V08 violated in turn | documented error code and nothing recorded |
| TEST-PS-022-09.T04 | property | PS-022-03.R01, PS-022-03.R03 | random sequences of withdraw, timeout, late evidence, duplicate notices | cancelled iff evidence count 0 at record time; terminal cycles never reopen; participantIds unchanged |
| TEST-PS-022-09.T05 | integration | PS-022-03.R04, PS-022-06.R03 | handed_over attestation arrives after cancellation | cycle stays cancelled and a standalone recovery case is opened |
| TEST-PS-022-09.T06 | integration | PS-022-03.R01, PS-022-04.R03 | 6-party cycle with two silent participants at deadline on local clocks | cycle cancelled with dropout records basis local_clock; no signature produced for the silent ones |
| TEST-PS-022-09.T07 | abuse | PS-022-03.R03, PS-022-07.R03 | attempt to add, remove or replace a participant through revision, roster or dropout calls | MUTINY_REROUTE_FORBIDDEN everywhere; participantIds unchanged |
| TEST-PS-022-09.T08 | contract | PS-022-04.R01, PS-022-04.R02, PS-022-09.R02, PS-022-09.R03 | commands, events and statements | outputs validate against classrup.mutiny.dropout_record/v1, cycle_withdrawal/v1 and registry |
| TEST-PS-022-09.T09 | abuse | PS-022-05.R01, PS-022-05.R02, PS-022-07.R02, PS-022-01.R02, PS-022-02.R02 | forged withdrawal for another person; other principal calls withdraw; replay on new cycle | quarantined or FORBIDDEN; replay ignored |
| TEST-PS-022-09.T10 | abuse | PS-022-07.R01, PS-022-04.R03 | local block of a participant mid-cycle | principal withdrawn with public reason unavailable; no statement or event reveals the block |
| TEST-PS-022-09.T11 | integration | PS-022-06.R01, PS-022-06.R02, PS-022-03.R01 | replay withdraw; crash inside the withdraw transaction after LockPort.releaseForSubject was called; abort of that transaction | one record; after abort the cycle and the holds are unchanged; after commit cancellation and release are both visible, never only one |
| TEST-PS-022-09.T12 | chaos | PS-022-06.R03 | relay down while withdrawing | local cancellation immediate; UI shows prepared; peers cancel by their own deadline |
| TEST-PS-022-09.T13 | abuse | PS-022-07.R03 | participant with 4 withdrawals in 30 days proposes again | recipient vault quarantines silently |
| TEST-PS-022-09.T14 | load | PS-022-08.R02, PS-022-08.R03 | withdraw with 8 participants; sweep 50 cycles on emulated Moto G | within budgets |
| TEST-PS-022-09.T15 | unit | PS-022-08.R01, PS-022-09.R01 | diagnostics and traceability tool | no identifiers or private reasons in diagnostics; every PS-022 requirement maps to a passing test |
| TEST-PS-022-09.T16 | integration | PS-022-07.R02, PS-022-07.R04 | identity erased locally; F10 export and retention sweep | section mutiny.dropouts exported; records pseudonymized and retained; privateReason stripped from exports to others; signatures still verify |
| TEST-PS-022-09.T17 | integration | PS-022-10.R01, PS-022-10.R02, PS-022-10.R03 | export, import, rollback | dropout records round-trip; imported cycles do not reopen |
| TEST-PS-022-09.T18 | abuse | PS-022-05.R03, PS-022-02.R02 | relay injects a withdrawal signed with the relay key naming Bob, a fabricated cancel notice, and a replayed old withdrawal of Bob from another cycle | all ignored or quarantined; no cycle cancelled and no reservation released |
| TEST-PS-022-09.T19 | integration | PS-022-01.R03, PS-022-03.R01, PS-022-03.R02 | Bob revokes his consent through F08 after commit, once before any handover and once after Alice's handed_over | first: dropout withdrew, cancelled, own reservations released in the same transaction; second: partially_executed with recovery |
| TEST-PS-022-09.T20 | contract | PS-022-04.R04, PS-022-04.R05 | registry lookup for classrup.mutiny.cycle_withdrawal/v1; payloads of participant_dropped and cancelled | signer role is the withdrawing participant; payloads carry participantIds, remainingParticipantIds and afterConsent |
| TEST-PS-022-09.T21 | integration | PS-022-06.R03, PS-022-03.R04 | vault opened with an own active lock whose cycle is already cancelled (orphan) | evaluate on open releases it through LockPort.releaseForSubject; no cycle reopens |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- Before any handover evidence a dropout always ends in cancellation with released reservations; after evidence it never cancels and always leads to partially_executed with recovery.
- No code path changes or substitutes cycle participants and no signed statement or event exposes a private reason.

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
