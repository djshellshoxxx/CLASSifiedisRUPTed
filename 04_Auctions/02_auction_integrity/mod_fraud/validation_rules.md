# PS-037-02 — Validation rules: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-02.R01** Review commands check the actor's host role, conflict of interest including keys F04.S02.M01 links to a party, and the review state before any effect.
- **PS-037-02.R02** Void decisions check the facts the host holds - a won result that is not voided and closed at most 60 days ago - the two-moderator rule and the reason enum before signing; payment state is never checked on the host because it lives only in the parties' vaults.
- **PS-037-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | actor holds the moderator role on this host, is not the seller or a bidder of the auction, and F04.S02.M01 linkage finds no link between the actor's key and the seller or any bidder | FORBIDDEN |
| V02 | review exists in the status required by the command | CONFLICT_STATE |
| V03 | void reason is one of the five enum values and findings has 20..2000 code points | VALIDATION_FAILED |
| V04 | confirming moderator differs from the proposing moderator | FORBIDDEN |
| V05 | the result exists with outcome won, is not already voided, and closedAtHost is at most 60 days before host now | AUCTIONS_RESULT_NOT_VOIDABLE |
| V06 | cancel_auction applies only when the auction status is scheduled or open | CONFLICT_STATE |
| V07 | the trigger (kind, ref) is not already attached to the auction's open review; other triggers are merged into it | AUCTIONS_REVIEW_DUPLICATE |
| V08 | confirmedCheckIds lists only ShillChecks referenced by this review's shill_suspected triggers | VALIDATION_FAILED |
| V09 | rescind_void runs only after moderation.appeal.decided with outcome overturned for this review's enforcementActionId | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T02 | unit | PS-037-02.R01, PS-037-02.R02, PS-037-02.R03 | each rule V01–V09 violated; void on an unsold result, a voided result and a result closed 61 days ago | documented code returned and nothing stored; assignee conflict refused |
| TEST-PS-037-09.T03 | unit | PS-037-03.R01, PS-037-03.R02, PS-037-02.R02 | propose by M1, confirm by M1, confirm by M2 after 73 hours, confirm by M2 within 72 hours | second and third refused or lapsed; fourth voids and signs |
| TEST-PS-037-09.T17 | abuse | PS-037-05.R02, PS-037-02.R01 | M4, whose key F04.S02.M01 links to bidder B2, tries to assign, propose and confirm | FORBIDDEN each time |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
