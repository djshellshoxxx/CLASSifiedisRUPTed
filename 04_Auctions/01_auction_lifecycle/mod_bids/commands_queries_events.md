# PS-033-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-04.R01 | `bids.place` carries `idempotency_key` and `expected_auction_revision` (the revision the bidder saw). | MVP |
| PS-033-04.R02 | Bid history query returns ≤ 100 bids per page, public fields only. | MVP |
| PS-033-04.R03 | Events are CTR-EVT-001 envelopes with `aggregate_type` = `auction`, `max_data_class` = PUBLIC for `bids.bid.accepted` and `bids.bid.outbid`. | MVP |
| PS-033-04.R04 | Command body ≤ 4 KB. | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `bids.place` | (`auc_`, `amount_minor`, `currency`, `expected_auction_revision`) → `bid_` | (`acc_`, command, key) |
| `bids.void` | (`bid_`, `cas_` case ID, reason enum, expected_revision) | (actor, command, key) |
| `bids.list_history` | (`auc_`, cursor) → public bid rows (query) | n/a |
| `bids.get_own` | (`auc_`) → caller's own bids incl. status (query) | n/a |

## Commands / queries / events
| Event (`schema_id`) | Visibility |
|---|---|
| `bids.bid.accepted` | PUBLIC: auc_, sequence, amount_minor, bidder_view |
| `bids.bid.outbid` | PUBLIC: auc_, bid_id, new sequence |
| `bids.bid.rejected` | Private to bidder: auc_, error code |
| `bids.bid.voided` | Public: auc_, bid_id, reason enum |

Errors: PS-033-02 codes; `SYS.CONFLICT` when `expected_auction_revision` is stale (the bidder must re-read).

## States & transitions
Command outcomes map to PS-033-03.

## Validation & errors
Schema validation first; unknown fields rejected. `expected_auction_revision` mismatch → `SYS.CONFLICT` with current revision number only.

## Authorization
Per PS-033-05. History query is public; own-bid query is `bid.read` (self).

## Failure, idempotency, concurrency, offline
Same key and digest → original result. Different digest → `SYS.CONFLICT`. Events at-least-once; dedupe on `event_id`.

## Privacy, retention, abuse
Public events contain `bidder_view` (`prf_`), never `acc_`. `placed_at` is not in any event payload in MVP.

## Observability & budgets
`bids.place` p95 ≤ 200 ms; history query p95 ≤ 150 ms (ASSUMPTION).

## Tests
- TEST-PS-033-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-033-04-02 (contract): public event payloads contain no `acc_` and no timestamp.
- TEST-PS-033-04-03 (integration): duplicate place returns same `bid_id`.
- TEST-PS-033-04-04 (integration): stale `expected_auction_revision` returns `SYS.CONFLICT` without writing.

## Acceptance criteria
1. All commands and events registered.
2. Public-event privacy scan passes on 10,000 sample events.
3. Replay test passes.

## Assumptions & open decisions
- ASSUMPTION: 24-hour idempotency retention.
- Pseudonymous bidder display (`prf_`) during open auctions is an ASSUMPTION. See [DECISIONS.md](../../../DECISIONS.md) D10 (OPEN; pseudonym rules).
