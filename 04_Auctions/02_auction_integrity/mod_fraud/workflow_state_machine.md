# PS-037-03 — Workflow state machine: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-03.R01** Reviews move opened, in_review, optionally void_proposed, and end voided or dismissed; both are terminal.
- **PS-037-03.R02** Voiding requires propose and confirm by two different moderators within 72 hours of the proposal, otherwise the proposal lapses back to in_review.
- **PS-037-03.R03** Every terminal transition emits auctions.review.closed, and a void additionally emits auctions.result.voided, in the same host transaction.

## Specification

### AuctionReview lifecycle

Initial **opened**; terminal **voided**, **dismissed**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| opened -> in_review | auctions.review.assign by moderator | conflict check passed; evidence snapshot captured |
| opened -> dismissed | auctions.review.dismiss or 30 days without assignment | emits auctions.review.closed |
| in_review -> dismissed | auctions.review.dismiss by moderator | findings stored; emits auctions.review.closed |
| in_review -> in_review | auctions.review.cancel_auction by moderator | open auction cancelled with reason host_policy; review continues for enforcement recommendation |
| in_review -> void_proposed | auctions.review.propose_void by moderator | result eligible, reason and findings stored |
| void_proposed -> voided | auctions.review.confirm_void by a second moderator | signs void statement; emits auctions.result.voided and auctions.review.closed |
| void_proposed -> in_review | second moderator rejects or 72 h lapse | proposal cleared |

```mermaid
stateDiagram-v2
  [*] --> opened
  opened --> in_review: auctions.review.assign by moderator
  opened --> dismissed: auctions.review.dismiss or 30 days without assignment
  in_review --> dismissed: auctions.review.dismiss by moderator
  in_review --> in_review: auctions.review.cancel_auction by moderator
  in_review --> void_proposed: auctions.review.propose_void by moderator
  void_proposed --> voided: auctions.review.confirm_void by a second moderator
  void_proposed --> in_review: second moderator rejects or 72 h lapse
  voided --> [*]
  dismissed --> [*]
```

### Timeouts and scheduled transitions

- Unassigned reviews are dismissed with reason expired after 30 days; void proposals lapse after 72 hours; a high-priority review with no assignment after 24 hours raises an operator alert. The host sweep runs every 5 minutes.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T03 | unit | PS-037-03.R01, PS-037-03.R02 | propose by M1, confirm by M1, confirm by M2 after 73 hours, confirm by M2 within 72 hours | second and third refused or lapsed; fourth voids and signs |
| TEST-PS-037-09.T04 | integration | PS-037-03.R03, PS-037-04.R02, PS-037-06.R02 | confirm void while a payment is acknowledged concurrently | one wins by lease order; void refused AUCTIONS_RESULT_NOT_VOIDABLE if payment first; no partial void |
| TEST-PS-037-09.T05 | property | PS-037-03.R01 | random command sequences on one review | only declared transitions succeed; voided and dismissed never change |
| TEST-PS-037-09.T15 | e2e | PS-037-03.R03, PS-037-01.R03 | two moderators in two browsers void a sale; bidder and seller vaults open notice | statuses correct on all four; notice has no names; axe zero serious issues |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
