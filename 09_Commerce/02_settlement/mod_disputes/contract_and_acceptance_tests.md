# PS-070-09 — Contract and acceptance tests: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-09.R01** Every requirement is covered by at least one automated test.
- **PS-070-09.R02** Contract tests validate command outputs, statements and event payloads against the schema registry.
- **PS-070-09.R03** Mediation and fork scenarios are covered by deterministic multi-vault integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Three in-memory vaults A (opener), B (respondent) and M (mediator) with a test relay double; a Deal context with an acknowledged cash claim; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund | no executable field exists; advisory refund stored; no payment API called |
| TEST-PS-070-09.T03 | unit | PS-070-02.R02, PS-070-02.R03 | rules V01 to V11 violated in turn | documented error code and nothing stored |
| TEST-PS-070-09.T04 | property | PS-070-03.R01, PS-070-03.R02 | random command sequences | only declared transitions succeed; terminal states have no exits |
| TEST-PS-070-09.T05 | integration | PS-070-03.R04 | clock advanced 7, 14 and 30 days at the corresponding states | respondentSilent set, proposal expires back to evidence, case lapses with resolution lapsed |
| TEST-PS-070-09.T06 | integration | PS-070-03.R03, PS-070-06.R03 | two conflicting accepted outcomes delivered to vault B | case frozen with COMMERCE_DISPUTE_FORK, both retained, no auto-resolution |
| TEST-PS-070-09.T07 | contract | PS-070-04.R01, PS-070-04.R02, PS-070-09.R02 | execute each command and ingest in the other vaults | outputs, envelopes and events validate against registry schemas |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01 | both parties select mediator M; M proposes no_fault_close | evidence shared only for items the parties chose; case resolved without acceptance |
| TEST-PS-070-09.T10 | abuse | PS-070-05.R01, PS-070-05.R02, PS-070-05.R03 | non-party signer, mediator not accepted by both, relay moderator without selection | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-070-09.T11 | integration | PS-070-06.R01, PS-070-06.R02 | replay of command ID; delivery interrupted at each sync state | original result; UI shows only the highest reached sync state |
| TEST-PS-070-09.T12 | abuse | PS-070-07.R03, PS-070-07.R01 | 6 cases in one day; 21 evidence statements in an hour; oversized evidence | 6th case, 21st statement and oversized item refused or rate limited |
| TEST-PS-070-09.T13 | integration | PS-070-07.R02, PS-070-01.R02 | principal deletion completes during an open case | did pseudonymized, signatures flagged, evidence blobs crypto-shredded, counterparty copy untouched |
| TEST-PS-070-09.T14 | load | PS-070-08.R01, PS-070-08.R02, PS-070-08.R03 | 1 000 cases and a 200-statement timeline | commit p95 ≤ 120 ms, render ≤ 200 ms, sweep ≤ 500 ms, no telemetry |
| TEST-PS-070-09.T15 | e2e | PS-070-03.R04, PS-070-09.R03 | opener and respondent complete a return_agreed outcome on two devices | both screens show resolved with the no-money-movement note; axe zero serious issues |
| TEST-PS-070-09.T16 | unit | PS-070-09.R01 | traceability tool run | every PS-070 requirement maps to a passing test |
| TEST-PS-070-09.T17 | integration | PS-070-10.R01, PS-070-10.R02, PS-070-10.R03 | export, import into fresh vault with one forged statement, roll back one release | valid cases round-trip, forged statement quarantined, open cases import with sync state reset |

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- No dispute state, event or outcome invokes any payment, refund, freeze or release operation.
- A mediator sees only evidence the parties chose to share and only after both accepted the mediator.
- Conflicting accepted outcomes always freeze the case.

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
