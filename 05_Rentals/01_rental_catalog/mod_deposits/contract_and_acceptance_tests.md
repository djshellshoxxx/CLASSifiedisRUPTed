# PS-040-09 — Contract and acceptance tests: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-040-09.R02** Money and proof rules are covered by property tests with a reference model for amounts, partial forfeits and release remainders.
- **PS-040-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped, reordered and contradictory statements.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with confirmed reservation B; deposit EUR 100.00 declared value EUR 300.00 method cash; stub F09 claims; hostile in-memory relay; fixed clock 2026-12-05T09:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T01 | unit | PS-040-01.R01, PS-040-01.R02, PS-040-01.R03, PS-040-02.R03 | propose, supersede with new terms, agree on old cid | second proposal supersedes; agreement on old cid RENTALS_DEPOSIT_TERMS_STALE; amounts immutable |
| TEST-PS-040-09.T02 | unit | PS-040-02.R01, PS-040-02.R02 | each rule V01–V08 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-040-09.T03 | property | PS-040-03.R01 | random statement and event sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-040-09.T04 | integration | PS-040-03.R02, PS-040-04.R03 | payment claimed only, confirming only, expired, then acknowledged | funded only at acknowledged or final; proof labels follow COM-4 |
| TEST-PS-040-09.T05 | property | PS-040-01.R02, PS-040-03.R02 | random partial forfeits and releases | retained plus released equals funded; never above funded; integer minor units |
| TEST-PS-040-09.T06 | integration | PS-040-03.R03 | forfeit claim unanswered for 14 days; owner silent for 7 days after return | claim becomes disputed, never accepted; overdue decision banner shown, no auto release or forfeit |
| TEST-PS-040-09.T07 | integration | PS-040-04.R01, PS-040-04.R02, PS-040-06.R01, PS-040-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on released with identical cids; duplicates skipped |
| TEST-PS-040-09.T08 | contract | PS-040-04.R01, PS-040-04.R02, PS-040-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-040-09.T09 | abuse | PS-040-05.R01, PS-040-05.R02, PS-040-05.R03 | release signed by renter; response by owner; payment event for foreign context | quarantined or ignored; no state change |
| TEST-PS-040-09.T10 | integration | PS-040-06.R02, PS-040-06.R03 | two contradictory forfeit claims; dispute port failing once | deposit frozen for dispute; claim retried; no partial state |
| TEST-PS-040-09.T11 | abuse | PS-040-07.R01, PS-040-07.R02, PS-040-07.R03 | inspect logs, notifications and relay payloads; 51 inbound statements in a day | no amounts or evidence outside encrypted envelopes; 51st dropped and counted |
| TEST-PS-040-09.T12 | integration | PS-040-03.R01, PS-040-04.R03 | reservation cancelled after funding | deposit moves to release_pending; owner attests full release; released after renter acknowledges |
| TEST-PS-040-09.T13 | load | PS-040-08.R01, PS-040-08.R02, PS-040-08.R03 | 2 000 deposits, throttled mobile profile | command p95 ≤ 120 ms, verify p95 ≤ 30 ms, no telemetry request |
| TEST-PS-040-09.T14 | unit | PS-040-09.R01 | traceability tool run | every PS-040 requirement maps to a passing test |
| TEST-PS-040-09.T15 | integration | PS-040-10.R01, PS-040-10.R02, PS-040-10.R03 | export, import into fresh vault, restore | terms and statements round-trip; unverifiable statements kept as history |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-02.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody notice shown; axe zero serious issues |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No state shows a deposit as funded, released or forfeited on a payment claim alone, and silence never settles money.
- No code path in the platform or a relay moves or holds deposit funds.

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
