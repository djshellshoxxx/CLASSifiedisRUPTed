# PS-016-09 — Contract and acceptance tests: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-016-09.R02** Each check C01..C13 has a positive and a negative unit test with fixed clock and fixtures for 2-, 3-, 4- and 6-party subjects.
- **PS-016-09.R03** The MNY-5 tolerance arithmetic is tested at the exact boundary with bigint values.

## Specification

See the module test table below (all processes).

**Fixtures:** Cycle values EUR minor 12000, 11800, 11500 (3-party within tolerance); 2-party 5000 vs 5600 (outside); 4-party with one expired quote; 6-party ring; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T01 | unit | PS-016-01.R01, PS-016-01.R03, PS-016-02.R01, PS-016-09.R03 | each check C01..C13 failed in turn | corresponding error code returned and check marked fail |
| TEST-PS-016-09.T02 | unit | PS-016-02.R02 | gap exactly at tolerance, one minor unit above, and absolute minimum case | pass at boundary, fail one unit above, absolute minimum 500 applies when 5 percent is smaller |
| TEST-PS-016-09.T03 | property | PS-016-01.R02, PS-016-06.R01 | random subjects, same inputs twice | identical checks and inputHash |
| TEST-PS-016-09.T04 | unit | PS-016-01.R01, PS-016-09.R02 | 3-party fixture 12000, 11800, 11500 | all three participants within tolerance, overall feasible only when all bases are local or signed_projection |
| TEST-PS-016-09.T05 | unit | PS-016-02.R03, PS-016-07.R03 | peer item without local projection | check warn basis unverifiable, overall feasible_with_conditions |
| TEST-PS-016-09.T06 | unit | PS-016-03.R01, PS-016-03.R02 | report older than 10 minutes used for consent | MUTINY_FEASIBILITY_STALE |
| TEST-PS-016-09.T07 | contract | PS-016-04.R01, PS-016-04.R02, PS-016-09.R02 | check command and event | output and event validate against registry |
| TEST-PS-016-09.T08 | integration | PS-016-04.R03, PS-016-06.R01 | replay check with same key, then new key within same minute | stored report replayed, then same report returned by inputHash |
| TEST-PS-016-09.T09 | abuse | PS-016-05.R01, PS-016-05.R02, PS-016-05.R03, PS-016-07.R02 | other principal reads report; blocked pair and elsewhere-reserved item | NOT_FOUND; generic messages with no names or cycle ids |
| TEST-PS-016-09.T10 | unit | PS-016-06.R02, PS-016-06.R03 | quote service port times out | affected check warn unverifiable, overall not feasible |
| TEST-PS-016-09.T11 | unit | PS-016-07.R01 | participant list with excluded and blocked DIDs | no DID of the blocker in report; C12 blocks on disputed valuation |
| TEST-PS-016-09.T12 | integration | PS-016-03.R03, PS-016-07.R03 | report cited by a signed revision, 30 days later | standalone report purged, cited hash retained in revision evidence |
| TEST-PS-016-09.T13 | load | PS-016-08.R02, PS-016-08.R03 | 8-participant evaluation on emulated Moto G | p95 ≤ 20 ms |
| TEST-PS-016-09.T14 | unit | PS-016-08.R01, PS-016-08.R02 | metric counters after runs | counters present locally, nothing transmitted |
| TEST-PS-016-09.T15 | unit | PS-016-09.R01 | traceability tool run | every PS-016 requirement maps to a passing test |
| TEST-PS-016-09.T16 | integration | PS-016-10.R01, PS-016-10.R02, PS-016-10.R03 | export and import | reports are not exported; imported subjects re-run checks on first open |
| TEST-PS-016-09.T17 | a11y | PS-016-01.R01 | checklist screen | axe zero serious issues, basis chips announced |
| TEST-PS-016-09.T18 | unit | PS-016-02.R02 | absolute minimum reference 500 EUR minor converted with pinned quotes EUR->JPY 163/1 and EUR->BTC 1/60000 | 815 JPY and 8333 satoshi (HALF_EVEN, MNY-4); EUR settlement uses 500 unchanged |
| TEST-PS-016-09.T19 | unit | PS-016-02.R01, PS-016-03.R02 | C11 at revision time with a 30 h cross-currency deadline and a 14 d plus 23 d window; C11 at consent time 40 minutes before a 10-day trade proposal deadline; C06 with 20 minutes left and expired | MUTINY_DEADLINE_INVALID twice; consent allowed; warn then fail |
| TEST-PS-016-09.T20 | unit | PS-016-01.R01, PS-016-04.R02 | registry with profiles 3 and 4 registered, get(5), explicit effectiveProfile, explanation of a 4-party suggestion with the 3-party profile | engine default for 5; explicit profile used; MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-016-09.T21 | integration | PS-016-07.R04 | F10 export, deletion and retention sweep | section mutiny.feasibility declared excluded; erased principal's reports purged; reports purged after 30 days |
| TEST-PS-016-09.T22 | unit | PS-016-02.R03, PS-016-07.R03 | gap above tolerance with an unsigned local acceptance, then with an acceptedImbalances entry in the signed snapshot | first fails C05; second passes C05 with basis signed_projection |

## Acceptance criteria

- All tests T01–T22 pass in CI.
- No peer claim is ever presented as verified and overall feasible is impossible with any unverifiable or peer_claim basis.
- MNY-5 tolerance is exact at the boundary for bigint amounts.

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
