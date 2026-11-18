# PS-116-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-03.R01 | Entry state is one of six values in the transition table; no other state is persisted. | MVP |
| PS-116-03.R02 | `applied` is reached only on a server acknowledgment with `server_ref`. Local timeout never produces `applied`. | MVP |
| PS-116-03.R03 | `not_applied` is entered only on a non-retryable code. It is never silently removed. | MVP |
| PS-116-03.R04 | `sending` to `queued` on retryable failure with `next_attempt_at` = now + backoff (PS-116-06). | MVP |
| PS-116-03.R05 | Entries for one `aggregate_id` replay in `created_at` order; a later entry waits while an earlier one is `sending`. | MVP |
| PS-116-03.R06 | Terminal states: `applied`, `discarded`. `not_applied` leaves only by user action. | MVP |

## Data / schema
State is the `state` field of PS-116-01. Transition log is local, kept until the entry is purged.

## Commands / queries / events
Transitions are triggered by `offline.send_attempt`, `offline.ack_received`, `offline.error_received`, `offline.user_discard`, `offline.user_retry` (PS-116-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | enqueue | validation passes; caps not exceeded | queued | write entry; update badge count |
| queued | send_attempt | online; `next_attempt_at` <= now; no earlier sibling sending | sending | `attempts`+1 |
| sending | ack_committed | `server_ref` returned | applied | purge payload ciphertext (RET-EPH) |
| sending | timeout or network_error | retryable | queued | set `next_attempt_at` |
| sending | error_retryable | code retryable=true | queued | honour `retry_after_ms` if present |
| sending | error_non_retryable | code retryable=false | not_applied | store `result_code` |
| queued | schema_unsupported | unknown MAJOR | upgrade_required | keep payload |
| upgrade_required | registry_updated | MAJOR now supported | queued | none |
| queued, not_applied | user_discard | user confirms | discarded | purge payload; write deletion completion record (CTR-PRV-001 R12) |
| not_applied | user_retry | user confirms; revalidated against current state | queued | new `idempotency_key`; new `expected_revision` |

## Validation & errors
Invalid transitions are programming errors; they are logged as `OFFLINE.ILLEGAL_TRANSITION` (internal, 500, not retryable) and the entry is left unchanged.

## Authorization
User actions require the signed-in account to match `account_ref`.

## Failure, idempotency, concurrency, offline
Transitions are atomic per entry. Two tabs share state through a single IndexedDB writer lock; the second tab queues its transition.

## Privacy, retention, abuse
Purge on `applied` happens in the same transaction as the state change, so no ciphertext survives acknowledgment.

## Observability & budgets
Metric: `offline_transitions_total{from,to}`. Budget: replay of 500 entries completes within 60 s on a 4G link (ASSUMPTION).

## Tests
- TEST-PS-116-03-01 (unit): every row of the transition table, plus one illegal transition per state.
- TEST-PS-116-03-02 (integration): local timeout with server commit → entry is `queued`, then `applied` via same key; never `applied` on timeout alone.
- TEST-PS-116-03-03 (offline e2e): airplane mode for 2 h with 50 entries; all replay in order after reconnect.
- TEST-PS-116-03-04 (concurrency): two tabs send same entry; server sees one commit.

## Acceptance criteria
1. Transition table is the only source of state changes (static check).
2. TEST-PS-116-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: backoff schedule and caps defined in PS-116-06.
- PROVISIONAL (D08 default): no `applied` state without server acknowledgment.
