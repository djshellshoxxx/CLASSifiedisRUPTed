# PS-041-09 — Contract and acceptance tests: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-041-09.R02** The comparison and the amount rules are covered by property tests with a reference model over random checklists.
- **PS-041-09.R03** Two-vault tests with a hostile relay cover duplicate, dropped and reordered statements and silent counterparties.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with attested handoff (tent-pole ok) and attested return (tent-pole damaged), reservation ended 2026-12-07T09:00:00Z, declared value EUR 300.00, deposit EUR 100.00 funded; stub F09 case port; fixed clock 2026-12-08T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-01.R03, PS-041-02.R03 | claim with 2 items summing to total and one whose sum is off by 1 minor unit | first stored with claim cid; second RENTALS_DAMAGE_EXCEEDS_VALUE or VALIDATION_FAILED |
| TEST-PS-041-09.T02 | unit | PS-041-02.R01, PS-041-02.R02 | each rule V01–V08 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-041-09.T03 | property | PS-041-02.R02, PS-041-03.R01 | random handoff and return checklists | worsened set equals the reference model; claims without worsened items refused; basis mismatch refused on receipt |
| TEST-PS-041-09.T04 | integration | PS-041-03.R02, PS-041-03.R03 | renter silent for 7 days; owner silent on a counter for 7 days | both escalate to a dispute and never to accepted; events once |
| TEST-PS-041-09.T05 | property | PS-041-03.R01 | random statement and event sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-041-09.T06 | integration | PS-041-04.R01, PS-041-04.R03 | accept path with funded deposit; accept path without deposit | agreed amount triggers deposit forfeit prefill, or payment context; resolved emitted once |
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T08 | contract | PS-041-04.R01, PS-041-04.R03, PS-041-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-041-09.T09 | abuse | PS-041-05.R01, PS-041-05.R02, PS-041-05.R03 | response signed by owner; claim signed by renter; claim after the window | quarantined or FORBIDDEN; RENTALS_DAMAGE_WINDOW; no state change |
| TEST-PS-041-09.T10 | integration | PS-041-06.R02, PS-041-06.R03 | two contradictory responses; case port failing once | claim frozen for escalation; case retried; escalation never without a request in flight |
| TEST-PS-041-09.T11 | abuse | PS-041-07.R01, PS-041-07.R02, PS-041-07.R03 | inspect logs, notifications, relay payloads; 51 inbound statements in a day; duplicate claim | no amounts or evidence outside encrypted envelopes; 51st dropped; RENTALS_DAMAGE_DUPLICATE |
| TEST-PS-041-09.T12 | integration | PS-041-03.R01, PS-041-01.R03 | not_returned claim at day 13 and day 15 overdue | RENTALS_DAMAGE_WINDOW at day 13; allowed at day 15 with overdue history as basis |
| TEST-PS-041-09.T13 | load | PS-041-08.R01, PS-041-08.R02, PS-041-08.R03 | two 30-item reports and 2 000 claims on throttled mobile profile | p95 ≤ 150 ms, sweep ≤ 100 ms, no telemetry request |
| TEST-PS-041-09.T14 | unit | PS-041-09.R01 | traceability tool run | every PS-041 requirement maps to a passing test |
| TEST-PS-041-09.T15 | integration | PS-041-10.R01, PS-041-10.R02, PS-041-10.R03 | export, import into fresh vault, restore | claims and statements round-trip; basis recomputation flags mismatches |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-02.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No claim is accepted by silence and no amount is shown as paid on a payment claim alone.
- Every claim carries a comparison the receiver can recompute from the two attested reports.

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
