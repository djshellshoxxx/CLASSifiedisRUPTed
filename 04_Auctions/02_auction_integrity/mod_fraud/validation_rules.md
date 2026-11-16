# PS-037-02 — Validation rules: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-02.R01** Review commands check the actor's host role, conflict of interest and the review state before any effect.
- **PS-037-02.R02** Void decisions check result eligibility, the two-moderator rule and the reason enum before signing.
- **PS-037-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | actor holds the moderator role on this host and is not the seller or a bidder of the auction | FORBIDDEN |
| V02 | review exists in the status required by the command | CONFLICT_STATE |
| V03 | void reason is one of the five enum values and findings has 20..2000 code points | VALIDATION_FAILED |
| V04 | confirming moderator differs from the proposing moderator | FORBIDDEN |
| V05 | result state is pending_deal, awaiting_payment, non_payment or second_chance_offered and no payment is acknowledged or final | AUCTIONS_RESULT_NOT_VOIDABLE |
| V06 | cancel_auction applies only when the auction status is scheduled or open | CONFLICT_STATE |
| V07 | an open review for the same auction and trigger kind does not already exist | AUCTIONS_REVIEW_DUPLICATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T01 | integration | PS-037-01.R01, PS-037-01.R02, PS-037-04.R01, PS-037-02.R02 | shill score 90 event and a report event for the same auction | one review opened with both triggers attached at high priority |
| TEST-PS-037-09.T02 | unit | PS-037-02.R01, PS-037-02.R03 | each rule V01–V07 violated | documented code returned and nothing stored; assignee conflict refused |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
