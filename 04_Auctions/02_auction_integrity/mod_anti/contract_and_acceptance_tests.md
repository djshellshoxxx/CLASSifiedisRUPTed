# PS-036-09 — Contract and acceptance tests: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-036-09.R02** Linkage and scoring are covered by fixture-based unit tests and a labelled synthetic dataset with measured precision and recall.
- **PS-036-09.R03** Contract tests validate the event payload and that no check data leaks into bidder-facing payloads.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H; seller S with identity document listing keys K1, K2 and rotation K0 to K1; bidders B1 (unlinked), B2 (holds K2), B3 (attested same owner with S); synthetic dataset of 500 auctions with 25 labelled shill patterns; fixed clock 2026-11-05T12:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T01 | unit | PS-036-01.R01, PS-036-01.R03, PS-036-02.R01 | evaluate seller key, K2, K0 and attested B3 | all denied with the right internal reasons; B1 allowed; allow leaves no record |
| TEST-PS-036-09.T02 | unit | PS-036-02.R02, PS-036-02.R03 | each rule V01–V06 violated or satisfied | documented outcome and generic error code |
| TEST-PS-036-09.T03 | property | PS-036-03.R01 | random check, review and void event sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-036-09.T04 | integration | PS-036-03.R02, PS-036-03.R03 | flagged bidder wins; review opened then dismissed | result unchanged by the flag; check dismissed; confirmed only after void event |
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | alternation, probing, concentration, price pump features at their thresholds | scores add as specified; 59 does not flag, 60 flags, 85 marks high priority |
| TEST-PS-036-09.T06 | contract | PS-036-04.R02, PS-036-04.R03, PS-036-09.R02 | check, score, allow_pair, queries and the event | payloads validate against registry schemas; no check data in bid errors |
| TEST-PS-036-09.T07 | abuse | PS-036-05.R01, PS-036-05.R02, PS-036-05.R03 | bidder, seller and non-moderator try to read checks; allow_pair without operator role | FORBIDDEN or NOT_FOUND; no data returned |
| TEST-PS-036-09.T08 | chaos | PS-036-06.R01, PS-036-06.R02, PS-036-06.R03 | F07 cache unavailable; scoring job crashes; duplicate events | equality check still denies; linkage fails open with counter and alert; scoring retried; duplicates skipped |
| TEST-PS-036-09.T09 | abuse | PS-036-07.R01, PS-036-07.R02 | compare response time and body for denial and allow paths | identical error body family and timing within 5 ms; no reason leaked |
| TEST-PS-036-09.T10 | integration | PS-036-01.R02, PS-036-07.R03, PS-036-09.R03 | run synthetic dataset | precision at least 0.7 and recall at least 0.5 at threshold 60, report stored; no deny from heuristics |
| TEST-PS-036-09.T11 | load | PS-036-08.R01, PS-036-08.R02, PS-036-08.R03 | 10 000 cache entries, 50 bids per second for 5 minutes | check p95 ≤ 40 ms, score lag p95 ≤ 5 s, metrics exported without key labels |
| TEST-PS-036-09.T12 | unit | PS-036-09.R01 | traceability tool run | every PS-036 requirement maps to a passing test |
| TEST-PS-036-09.T13 | integration | PS-036-10.R01, PS-036-10.R02, PS-036-10.R03 | operator export for audit, restore host backup | checks round-trip; restore keeps the open-check unique index |
| TEST-PS-036-09.T14 | integration | PS-036-07.R03, PS-036-03.R01 | identity attestation revoked after denial | next check allows; past denial kept as history |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Deterministic linkage always denies and heuristics never deny.
- Denials are generic and indistinguishable in body and timing from other ineligibility.

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
