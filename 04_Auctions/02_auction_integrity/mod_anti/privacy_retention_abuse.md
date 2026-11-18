# PS-036-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-07.R01 | Schedule and extension log fields are PUBLIC. No account identifiers are stored in this module. | MVP |
| PS-036-07.R02 | Extension log retained with the auction for 24 months after close (PROVISIONAL, D07 default), then purged. | MVP |
| PS-036-07.R03 | Advisory signals consumed (reputation, F12 signals) are referenced by ID only; scores are not stored here. | MVP |
| PS-036-07.R04 | Per auction, bids that trigger extension are rate-limited by BIDS (PS-033-02 R07); this module does not add a second limit. | MVP |

## Data / schema
Retention fields: `retain_until`. No personal fields to pseudonymize.

## Commands / queries / events
Purge runs as `sys`; emits `auction.schedule_purged` with count only.

## States & transitions
ACTIVE → PURGED (close + 24 months).

## Validation & errors
Not applicable; purge does not run under legal hold (F10 `legal_hold` flag checked).

## Authorization
Purge is `sys`. Public read is unchanged.

## Failure, idempotency, concurrency, offline
Purge idempotent per auction. Never purges a schedule whose close record is in dispute.

## Privacy, retention, abuse
Abuse: bid-stalling (bots placing bids in the final window to prolong an auction indefinitely) and collusion (accounts bidding in pairs to extend). Controls: the 10-extension cap, the bid rate limit (BIDS), and advisory signals to F04.S02.M03 `mod_fraud` as counts with `auc_` only. The extension rule itself does not depend on account identity, so it cannot be used to deanonymize bidders.

## Observability & budgets
Metrics: `antisnip_stall_signals_total` (count of auctions with ≥ 5 extensions), `antisnip_purged_total`.

## Tests
- TEST-PS-036-07-01 (lint): no account identifier field exists in schedule or log.
- TEST-PS-036-07-02 (abuse): 10 extensions reached → 11th in-window bid produces `EXTENSION_CAP_REACHED`, no further extension.
- TEST-PS-036-07-03 (integration): purge at close + 24 months removes log rows.
- TEST-PS-036-07-04 (negative): advisory signal fixture produces a signal count but no schedule change.

## Acceptance criteria
1. Retention job matches R02.
2. Schema scan finds no account identifiers.
3. Stall-signal count matches fixture expectations.

## Assumptions & open decisions
- ASSUMPTION: 5-extension stall threshold for signal count.
- PROVISIONAL: D07 retention default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
