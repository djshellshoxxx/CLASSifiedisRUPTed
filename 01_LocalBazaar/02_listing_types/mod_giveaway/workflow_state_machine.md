# PS-005-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, append-only), CTR-ERR-001, CTR-COM-001 R01/R07 (no settlement state is created). PENDING CTR-LST-001 (listing reserve/reopen, F01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-03.R01 | Eight states exactly: SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED, HANDOVER_RECORDED, RECEIPT_CONFIRMED, CLOSED_UNCONFIRMED. No other state. | MVP |
| PS-005-03.R02 | Terminal states: REJECTED, WITHDRAWN, EXPIRED, RECEIPT_CONFIRMED, CLOSED_UNCONFIRMED. No transition leaves them (`GIVE.INVALID_TRANSITION`). | MVP |
| PS-005-03.R03 | Only one claim per listing may be ACCEPTED or later; accepting a claim rejects all other SUBMITTED claims for that listing in the same transaction. | MVP |
| PS-005-03.R04 | Handover is a self-reported giver statement (`HANDOVER_RECORDED`). It is never shown as verified transfer. Recipient confirmation is a self-reported statement (`RECEIPT_CONFIRMED`). | MVP |
| PS-005-03.R05 | No transition creates a `trx_`, `clm_` or settlement state (CTR-COM-001 R01, R05). | MVP |
| PS-005-03.R06 | Handover confirmation window: 30 days after `handover_at` (ASSUMPTION). Window closure moves to CLOSED_UNCONFIRMED. | MVP |
| PS-005-03.R07 | Open claims auto-expire 7 days after `submitted_at` (ASSUMPTION). | MVP |
| PS-005-03.R08 | Dispute of an item's condition is out of scope. Reports go to F12 reporting flow; a dispute record is Future (F09 pattern). | Future |

## Data / schema
State stored in `giveaway_claim.state` ([domain_schema](domain_schema.md)). Each change increments `revision` and appends one event.

## Commands / queries / events
Transitions are triggered by commands in [commands_queries_events](commands_queries_events.md). Timer events are `sys` principals.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | submit | claimant ≠ giver; listing claimable; limits ok (PS-005-02) | SUBMITTED | emit `giveaway_claim.submitted` |
| SUBMITTED | withdraw | actor = claimant | WITHDRAWN (CLAIMANT_WITHDREW) | emit |
| SUBMITTED | reject | actor = giver | REJECTED | emit |
| SUBMITTED | accept | actor = giver; no ACCEPTED claim on listing | ACCEPTED | emit; reject other SUBMITTED (LISTING_RESERVED); request F01 reserve |
| SUBMITTED | timer 7 d | — | EXPIRED (TIMEOUT) | emit |
| SUBMITTED | listing ended (F01 event) | — | REJECTED (LISTING_ENDED) | emit |
| ACCEPTED | withdraw | actor = claimant | WITHDRAWN (CLAIMANT_WITHDREW) | emit; request F01 reopen |
| ACCEPTED | rescind | actor = giver | WITHDRAWN (GIVER_RESCINDED) | emit; request F01 reopen |
| ACCEPTED | record_handover | actor = giver | HANDOVER_RECORDED | emit; set `handover_at` |
| HANDOVER_RECORDED | confirm_receipt | actor = claimant; ≤ 30 d | RECEIPT_CONFIRMED | emit |
| HANDOVER_RECORDED | timer 30 d | — | CLOSED_UNCONFIRMED | emit |
| any open | feature disabled (flag) | sys | REJECTED or WITHDRAWN (FEATURE_DISABLED) | emit |
| terminal | any | — | (none) | `GIVE.INVALID_TRANSITION` |

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| GIVE.INVALID_TRANSITION | false | conflict / 409 | transition not in table |
| GIVE.CLAIM_NOT_OPEN | false | conflict / 409 | accept/reject on non-SUBMITTED claim |
| GIVE.LISTING_ALREADY_RESERVED | false | conflict / 409 | accept lost race |
| GIVE.HANDOVER_NOT_ALLOWED | false | unprocessable_state / 422 | handover before ACCEPTED or by non-giver |
| GIVE.CONFIRMATION_WINDOW_CLOSED | false | conflict / 409 | receipt after 30 d |

## Authorization
Guards check actor role per [authorization_capabilities](authorization_capabilities.md). Relation (giver, claimant) is derived at decision time (CTR-CAP-001 R05).

## Failure, idempotency, concurrency, offline
Guards are evaluated under the listing lock; see [failure_recovery_idempotency](failure_recovery_idempotency.md). Offline transitions are pending until server acknowledgment (D08, PROVISIONAL default, unapproved).

## Privacy, retention, abuse
State history is kept per [privacy_retention_abuse](privacy_retention_abuse.md). Notifications carry generic text only (CTR-PRV-001 R10).

## Observability & performance
Metric `giveaway_claim_transitions_total{from,to,outcome}`. Transition p95 ≤ 400 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-005-03-01: every row of the transition table, positive and guard-failing.
- TEST-PS-005-03-02: terminal states reject all events (property test).
- TEST-PS-005-03-03: accept fan-out rejects all other SUBMITTED claims atomically.

## Acceptance criteria
1. Transition table is exhaustive; any unlisted pair yields `GIVE.INVALID_TRANSITION`.
2. No state or event reads as "paid", "completed" or "verified transfer".
3. Exactly one ACCEPTED-or-later claim per listing under concurrent accepts (CTR-EVT R02 revision check).

**Assumptions and open decisions:** Handover is self-attested; D04 (PROVISIONAL default: explicit per-party attestations, no atomic real-world guarantee, unapproved) and D06 (PROVISIONAL default: signed statements only, unapproved) apply. See [DECISIONS.md](../../../DECISIONS.md). Timers (7 d, 30 d) are ASSUMPTION.
