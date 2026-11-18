# PS-034-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-COM-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-04.R01 | `close.run` is idempotent per `auc_` and `final_revision`; it carries `expected_revision`. | MVP |
| PS-034-04.R02 | `close.confirm_winner` carries `idempotency_key`, `expected_revision` and `close_hash`. | MVP |
| PS-034-04.R03 | Events are CTR-EVT-001 envelopes, `aggregate_type` = `auction`; `auction.closed` is PUBLIC; `auction.winner_confirmed` is PRIVATE to seller and winner. | MVP |
| PS-034-04.R04 | Query `close.get(auc_)` returns the public projection (no winner before confirmation, no reserve value). | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `close.run` | (`auc_`, `final_revision`) → close record | (sys, `auc_`, `final_revision`) |
| `auction.cancel` | (`auc_`, expected_revision, reason) | (actor, command, key) |
| `auction.cancel_operator` | (`auc_`, `cas_`, reason, dual approval) | (actor, command, key) |
| `close.confirm_winner` | (`auc_`, expected_revision, `close_hash`) → `trx_` | (winner, command, key) |

## Commands / queries / events
| Event (`schema_id`) | Visibility |
|---|---|
| `auction.closed` | PUBLIC: auc_, end_state, end_reason, reserve_met |
| `auction.winner_notified` | PRIVATE to winner: auc_, close_hash |
| `auction.winner_confirmed` | Seller and winner: auc_, trx_id |
| `auction.unconfirmed` | Seller and winner: auc_ |
| `auction.cancelled` | PUBLIC: auc_, reason |

Errors: PS-034-02 codes; `SYS.CONFLICT` on revision mismatch.

## States & transitions
Command outcomes map to PS-034-03.

## Validation & errors
Schema validation first; unknown fields rejected (`SYS.REQUEST_MALFORMED`).

## Authorization
Per PS-034-05.

## Failure, idempotency, concurrency, offline
Duplicate `close.run` returns existing record (`CLOSE.ALREADY_CLOSED` with the record ID, HTTP 409 only to non-system callers). Events at-least-once; dedupe on `event_id`.

## Privacy, retention, abuse
`auction.closed` omits winner and amounts beyond `winning_amount_minor` only when the auction is publicly priced (ASSUMPTION: amounts already public from bids). Winner identity only in private events.

## Observability & budgets
`close.run` p95 ≤ 500 ms; `close.get` p95 ≤ 150 ms (ASSUMPTION).

## Tests
- TEST-PS-034-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-034-04-02 (contract): public `auction.closed` contains no `acc_`.
- TEST-PS-034-04-03 (integration): duplicate `close.run` yields one record.
- TEST-PS-034-04-04 (integration): `close.get` before confirmation has `winner` absent.

## Acceptance criteria
1. All commands and events registered.
2. Public projection contract test passes on 1,000 closed auctions.
3. Replay of `close.run` returns identical `close_hash`.

## Assumptions & open decisions
- ASSUMPTION: 24-hour idempotency retention.
- See [DECISIONS.md](../../../DECISIONS.md) D06 (signed statements) and D04 (PROVISIONAL).
