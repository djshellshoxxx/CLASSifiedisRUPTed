# PS-043-09 — Contract and acceptance tests: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-043-09.R02** Late-fee arithmetic and the 72 hour rule are covered by property tests with a reference model including DST zones.
- **PS-043-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped and reordered statements and silent owners.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with attested handoff, reservation ending 2026-12-07T09:00:00Z, grace 60 minutes, late fee EUR 5.00 per hour capped at EUR 40.00; fixed clock 2026-12-07T08:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-01.R03, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T02 | unit | PS-043-02.R01, PS-043-02.R03 | each rule V01–V07 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-043-09.T03 | property | PS-043-02.R02, PS-043-03.R02 | random return times, rates, caps and adjustments against reference model | fee equals model, never above cap, adjustments only decrease |
| TEST-PS-043-09.T04 | property | PS-043-03.R01 | random statement and event sequences | only declared transitions succeed; closed never changes |
| TEST-PS-043-09.T05 | integration | PS-043-03.R03, PS-043-06.R01 | owner silent for 72 hours; owner records receipt only; owner attests exact cid | attestedBy renter_only_silent_owner, owner_only, both respectively; events once per vault |
| TEST-PS-043-09.T06 | integration | PS-043-01.R03, PS-043-06.R02 | sweep runs twice across the grace boundary and across restart | one overdue event per vault; closure emitted once |
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02 | closure with open damage claim, funded deposit, damage window, owner waiver | closed only when all four checks pass; waiver ends the window early |
| TEST-PS-043-09.T08 | integration | PS-043-04.R01, PS-043-04.R02, PS-043-06.R03, PS-043-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested and closed with identical cids; duplicates skipped |
| TEST-PS-043-09.T09 | contract | PS-043-04.R01, PS-043-04.R03, PS-043-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-043-09.T10 | abuse | PS-043-05.R01, PS-043-05.R02, PS-043-05.R03 | attestation signed by renter; fee adjustment signed by renter; third-party key | quarantined or FORBIDDEN; no state change; raising a fee refused |
| TEST-PS-043-09.T11 | abuse | PS-043-07.R01, PS-043-07.R02, PS-043-07.R03 | backdated claim 5 days; 101 inbound statements in a day; inspect logs | receipt time used; 101st dropped; no amounts or notes in logs |
| TEST-PS-043-09.T12 | load | PS-043-08.R01, PS-043-08.R02, PS-043-08.R03 | 5 000 returns, throttled mobile profile | sign p95 ≤ 120 ms, sweep ≤ 100 ms, no telemetry request |
| TEST-PS-043-09.T13 | unit | PS-043-09.R01 | traceability tool run | every PS-043 requirement maps to a passing test |
| TEST-PS-043-09.T14 | integration | PS-043-10.R01, PS-043-10.R02, PS-043-10.R03 | export, import into fresh vault, restore | returns and statements round-trip; overdue flag preserved |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-02.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- The late fee equals the reference model in every case, never exceeds the cap and can only be lowered by the owner.
- A rental closes only when attested, damage window over or waived, no open claim and any funded deposit settled.

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
