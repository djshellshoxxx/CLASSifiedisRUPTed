# PS-037-09 — Contract and acceptance tests: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-037-09.R02** The two-moderator rule, conflict checks and voidability are covered by deterministic unit and integration tests.
- **PS-037-09.R03** Contract tests validate review events, the void statement and its signature checks in vaults.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H; auction A sold to B1 with Deal awaiting payment; moderators M1, M2, M3 on H; seller S; bidders B1, B2; shill flag score 90; fixed clock 2026-11-13T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-01.R02, PS-037-04.R01, PS-037-02.R02 | shill score 90 event and a report event for the same auction | one review opened with both triggers attached at high priority |
| TEST-PS-037-09.T02 | unit | PS-037-02.R01, PS-037-02.R03 | each rule V01–V07 violated | documented code returned and nothing stored; assignee conflict refused |
| TEST-PS-037-09.T03 | unit | PS-037-03.R01, PS-037-03.R02 | propose by M1, confirm by M1, confirm by M2 after 73 hours, confirm by M2 within 72 hours | second and third refused or lapsed; fourth voids and signs |
| TEST-PS-037-09.T04 | integration | PS-037-03.R03, PS-037-04.R02, PS-037-06.R02 | confirm void while a payment is acknowledged concurrently | one wins by lease order; void refused AUCTIONS_RESULT_NOT_VOIDABLE if payment first; no partial void |
| TEST-PS-037-09.T05 | property | PS-037-03.R01 | random command sequences on one review | only declared transitions succeed; voided and dismissed never change |
| TEST-PS-037-09.T06 | contract | PS-037-04.R01, PS-037-04.R03, PS-037-09.R02 | each command, event and the void statement | payloads and signatures validate against registry schemas; vault rejects wrong host key |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled with host_policy, bids void, review closed once |
| TEST-PS-037-09.T08 | abuse | PS-037-05.R01, PS-037-05.R02, PS-037-05.R03 | seller, bidder and non-moderator call decisions; moderator who is a bidder is assigned | FORBIDDEN or NOT_FOUND; no state change |
| TEST-PS-037-09.T09 | integration | PS-037-06.R03, PS-037-09.R03 | void delivery dropped, duplicated and reordered by hostile relay | vaults converge on voided; duplicates skipped; second-chance offer withdrawn |
| TEST-PS-037-09.T10 | abuse | PS-037-07.R01, PS-037-07.R02, PS-037-07.R03 | inspect participant notices, logs, public projection | only reason category in notices; no evidence or keys elsewhere; statement says host finding, not a ruling |
| TEST-PS-037-09.T11 | abuse | PS-037-07.R03 | moderator proposes 6 voids in 24 hours | operator alert fired on the 6th |
| TEST-PS-037-09.T12 | load | PS-037-08.R01, PS-037-08.R02, PS-037-08.R03 | 5 000 entry ledger snapshot and fan-out to 500 participants | snapshot ≤ 5 s, decision p95 ≤ 300 ms, fan-out ≤ 2 s |
| TEST-PS-037-09.T13 | unit | PS-037-09.R01 | traceability tool run | every PS-037 requirement maps to a passing test |
| TEST-PS-037-09.T14 | integration | PS-037-10.R01, PS-037-10.R02, PS-037-10.R03 | operator export, restore host backup | reviews round-trip; unique open-review index preserved; user exports contain no review data |
| TEST-PS-037-09.T15 | e2e | PS-037-03.R03, PS-037-01.R03 | two moderators in two browsers void a sale; bidder and seller vaults open notice | statuses correct on all four; notice has no names; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No result is voided without two different moderators, and no result with an acknowledged payment is ever voided.
- Participants only ever see a reason category and a host-signed statement, never evidence or other parties' keys.

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
