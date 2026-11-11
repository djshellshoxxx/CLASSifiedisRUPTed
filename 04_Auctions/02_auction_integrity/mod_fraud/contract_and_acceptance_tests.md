# PS-037-09 — Contract and acceptance tests: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-037-09.R02** The two-moderator rule, conflict checks and voidability are covered by deterministic unit and integration tests.
- **PS-037-09.R03** Contract tests validate review events, the void statement and its signature checks in vaults.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H; auction A sold to B1 with Deal awaiting payment; moderators M1, M2, M3 on H and M4 whose identity document lists a key of B2; seller S; bidders B1, B2; shill flags for B1 (score 90) and B2 (score 88); fixed clock 2026-11-13T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-04.R01, PS-037-04.R03 | shill score 90 event and a report on the auction's listing | one review opened with both triggers merged at high priority; auctions.review.opened emitted twice with the full triggers list |
| TEST-PS-037-09.T02 | unit | PS-037-02.R01, PS-037-02.R02, PS-037-02.R03 | each rule V01–V09 violated; void on an unsold result, a voided result and a result closed 61 days ago | documented code returned and nothing stored; assignee conflict refused |
| TEST-PS-037-09.T03 | unit | PS-037-03.R01, PS-037-03.R02, PS-037-02.R02 | propose by M1, confirm by M1, confirm by M2 after 73 hours, confirm by M2 within 72 hours | second and third refused or lapsed; fourth voids and signs |
| TEST-PS-037-09.T04 | integration | PS-037-06.R04, PS-037-04.R02 | vault-side race - in the winner vault a payment acknowledgement and the void statement arrive concurrently; in the seller vault the void arrives first | the local transaction that commits first decides; acknowledgement first gives void_after_payment with no state change; void first gives voided with the Deal kept; the host issued the same void in both cases and took no lock |
| TEST-PS-037-09.T05 | property | PS-037-03.R01 | random command sequences on one review | only declared transitions succeed; voided and dismissed never change |
| TEST-PS-037-09.T06 | contract | PS-037-04.R01, PS-037-09.R02 | each command, event and the void and rescission statements | payloads and signatures validate against registry schemas; vault rejects a wrong host key with AUCTIONS_RESULT_INVALID |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled through apply_cancel with host_policy, bids void, review closed once |
| TEST-PS-037-09.T08 | abuse | PS-037-05.R01, PS-037-05.R02, PS-037-05.R03 | seller, bidder and non-moderator call decisions; moderator who is a bidder is assigned | FORBIDDEN or NOT_FOUND; no state change |
| TEST-PS-037-09.T09 | integration | PS-037-06.R03, PS-037-09.R03 | void delivery dropped, duplicated and reordered by hostile relay | vaults converge on the void; duplicates skipped; second-chance offer withdrawn |
| TEST-PS-037-09.T10 | abuse | PS-037-07.R01, PS-037-07.R02, PS-037-07.R03, PS-037-01.R02 | inspect participant notices, logs, public projection, user exports | only reason category in notices; no evidence, findings or keys elsewhere; statement says host finding, not a ruling |
| TEST-PS-037-09.T11 | abuse | PS-037-07.R03 | moderator proposes 6 voids in 24 hours | operator alert fired on the 6th |
| TEST-PS-037-09.T12 | load | PS-037-08.R02, PS-037-08.R03 | 5 000 entry ledger snapshot and fan-out to 500 participants | snapshot ≤ 5 s, decision p95 ≤ 300 ms, fan-out ≤ 2 s |
| TEST-PS-037-09.T13 | unit | PS-037-09.R01 | traceability tool run | every PS-037 requirement maps to a passing test |
| TEST-PS-037-09.T14 | integration | PS-037-10.R01, PS-037-10.R02, PS-037-10.R03 | operator export, restore host backup | reviews round-trip; unique open-review index preserved; user exports contain no review data |
| TEST-PS-037-09.T15 | e2e | PS-037-03.R03 | two moderators in two browsers void a sale; bidder and seller vaults open the notice | statuses correct on all four; auctions.review.closed and auctions.result.voided in one host transaction; notice has no names and says the Deal stays until both cancel; axe zero serious issues |
| TEST-PS-037-09.T16 | chaos | PS-037-06.R02 | F12.S02.M01 fails during confirm; crash after statement signing before commit | review stays void_proposed; no void statement delivered, no EnforcementAction, host result row unchanged |
| TEST-PS-037-09.T17 | abuse | PS-037-05.R02, PS-037-02.R01 | M4, whose key F04.S02.M01 links to bidder B2, tries to assign, propose and confirm | FORBIDDEN each time |
| TEST-PS-037-09.T18 | integration | PS-037-01.R03 | review assigned, then new bids, a listing edit and an extension arrive | snapshots of target types listing and bid and the frozen ledger head, extension cids and result cid are unchanged |
| TEST-PS-037-09.T19 | integration | PS-037-04.R05, PS-037-03.R04 | void confirmed; seller appeals; appeal overturned | EnforcementAction recorded and actionId stored; moderation.appeal.decided matched on actionId; rescission statement issued; vaults show it as advisory and the review stays voided |
| TEST-PS-037-09.T20 | integration | PS-037-04.R04 | void issued in an auction where the seller and two bidders set pushOptIn; registry lookup | dispatch called once per opted-in recipient with template key and reference only; void and rescission roles resolve to the host key |
| TEST-PS-037-09.T21 | integration | PS-037-04.R03 | reports with targetType listing and bid for a hosted auction; a report on an unrelated listing | the two open or merge triggers on the auction's review; the unrelated report is ignored |
| TEST-PS-037-09.T22 | integration | PS-037-07.R04 | operator export, user export, deletion of a moderator and a subject | reviews only in the operator export; the user export carries auctions.voids; keys pseudonymized |
| TEST-PS-037-09.T23 | e2e | PS-037-08.R01 | network capture of a participant PWA receiving the void notice | zero telemetry or analytics requests |
| TEST-PS-037-09.T24 | integration | PS-037-01.R01 | flagged bidders B1 and B2; findings confirm only B1 | auctions.review.closed lists only B1's checkId in confirmedCheckIds; the host-local voided event carries subjectKeys [B1] and the void statement names nobody |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No result is voided without two different moderators, and no vault applies a void over an acknowledged or final payment.
- Participants only ever see a reason category and a host-signed statement, never evidence or other parties' keys.
- Every void is appealable through its EnforcementAction, and a successful appeal is shown as an advisory host-signed rescission.

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
