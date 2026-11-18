# PS-035-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-04.R01 | Every reserve command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-035-04.R02 | Command body ≤ 2 KB. | MVP |
| PS-035-04.R03 | Events are CTR-EVT-001 envelopes, `aggregate_type` = `auction`; events carry no reserve value. | MVP |
| PS-035-04.R04 | Status query returns `reserve_status` only. | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `reserve.set` | (`auc_`, `reserve_minor`, currency, expected_revision) | (seller, command, key) |
| `reserve.lower` | (`auc_`, `reserve_minor`, expected_revision) | (seller, command, key) |
| `reserve.status` | (`auc_`) → `reserve_status` (query) | n/a |

## Commands / queries / events
| Event (`schema_id`) | Visibility |
|---|---|
| `auction.reserve.set` | Seller only: auc_, revision (no value) |
| `auction.reserve.lowered` | Seller only: auc_, revision (no value) |
| `auction.reserve.met` | PUBLIC: auc_ |

Errors: PS-035-02 codes; `SYS.CONFLICT` on stale revision.

## States & transitions
Command outcomes map to PS-035-03.

## Validation & errors
Schema validation first; unknown fields rejected (`SYS.REQUEST_MALFORMED`).

## Authorization
Per PS-035-05. Status query is public.

## Failure, idempotency, concurrency, offline
Same key and digest → original result. Stale revision → `SYS.CONFLICT`. Events at-least-once; dedupe on `event_id`.

## Privacy, retention, abuse
No event or query response contains the reserve value for non-sellers. `reserve.status` never returns a value.

## Observability & budgets
`reserve.set` p95 ≤ 150 ms (ASSUMPTION).

## Tests
- TEST-PS-035-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-035-04-02 (contract): `reserve.status` response contains only the enum.
- TEST-PS-035-04-03 (integration): duplicate `reserve.set` returns same result.
- TEST-PS-035-04-04 (integration): stale revision returns `SYS.CONFLICT` without write.

## Acceptance criteria
1. All commands and events registered.
2. Non-seller response scan finds no reserve value.
3. Replay test passes.

## Assumptions & open decisions
- ASSUMPTION: 24-hour idempotency retention.
- See [DECISIONS.md](../../../DECISIONS.md) D10 (OPEN) for seller-side identity display rules.
