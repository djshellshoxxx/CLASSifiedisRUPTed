# PS-036-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-04.R01 | `anti.evaluate_bid` consumes `bids.bid.accepted` by `event_id` and `bid_sequence`; idempotent. | MVP |
| PS-036-04.R02 | `anti.publish_policy` carries `idempotency_key` and dual approval IDs. | MVP |
| PS-036-04.R03 | Events are CTR-EVT-001 envelopes, `aggregate_type` = `auction`, `max_data_class` = PUBLIC. | MVP |
| PS-036-04.R04 | Schedule query returns ≤ 1 KB per auction. | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `anti.evaluate_bid` | (`auc_`, `bid_id`, `bid_sequence`, `server_accepted_at_utc`) | (`bid_id`) |
| `anti.publish_policy` | (`policy_id`, `policy_version`, fields, approvals) | (operator, command, key) |
| `anti.get_schedule` | (`auc_`) → schedule (query) | n/a |

## Commands / queries / events
| Event (`schema_id`) | Visibility |
|---|---|
| `auction.extended` | PUBLIC: auc_, extension_index, new_end_utc |
| `auction.extension_cap_reached` | PUBLIC: auc_ |
| `auction.schedule_ended` | PUBLIC: auc_, final effective_end_utc |

Errors: PS-036-02 codes; `SYS.CONFLICT` for stale `schedule_revision`.

## States & transitions
Outcomes map to PS-036-03.

## Validation & errors
Schema validation first; unknown fields rejected.

## Authorization
Per PS-036-05.

## Failure, idempotency, concurrency, offline
Duplicate evaluation → no-op. Events at-least-once; dedupe by `event_id`. Out-of-order bid events are buffered per auction and applied in sequence order; buffer limit 50 events, beyond which the evaluator reads the bid log directly.

## Privacy, retention, abuse
Public events carry no bidder identifiers, only `bid_id` where the bid is already public.

## Observability & budgets
`anti.evaluate_bid` p95 ≤ 50 ms; `anti.get_schedule` p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-036-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-036-04-02 (integration): duplicate `bids.bid.accepted` evaluated once.
- TEST-PS-036-04-03 (integration): out-of-order events (sequence 5 before 4) produce the same schedule as in-order.
- TEST-PS-036-04-04 (contract): public events contain no `acc_`.

## Acceptance criteria
1. All commands and events registered.
2. Out-of-order equivalence test passes on 10,000 random permutations.
3. Public event privacy scan passes.

## Assumptions & open decisions
- ASSUMPTION: 50-event reorder buffer.
- See [DECISIONS.md](../../../DECISIONS.md) D10 for account-based rules (not used in schedule events).
