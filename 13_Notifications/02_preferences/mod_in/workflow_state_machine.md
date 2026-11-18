# PS-106-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-03.R01 | Inbox item states: `unread`, `read`, `archived`, `pruned`. `pruned` is terminal. | MVP |
| PS-106-03.R02 | Mark-read is monotonic: `read` never returns to `unread`. | MVP |
| PS-106-03.R03 | Items older than `retention_days` at prune time move to `pruned`. | MVP |
| PS-106-03.R04 | Items beyond 1000 per account are pruned oldest-first (ASSUMPTION). | MVP |

## Data / schema
Transitions read `inbox_state`, `created_at` and `inp_.retention_days`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `ntf_` projected to inbox | category enabled in preference | unread | emit `notification.inbox_recorded` (no content) |
| (none) | projected, category disabled | none | not projected | none |
| unread | `inbox.mark_read` | owner | read | `read_at` set; emit `notification.marked_read` |
| unread or read | `inbox.archive` | owner | archived | emit `notification.archived` |
| read | `inbox.mark_unread` (not in MVP) | Future | n/a | n/a |
| any non-pruned | prune job: age > retention_days or cap exceeded | none | pruned | emit `notification.inbox_pruned`; delete projection |
| archived | prune job: age > retention_days | none | pruned | as above |

## Validation & errors
`INPREF.INVALID_STATE` on transition from pruned (non-retryable).

## Authorization
Owner transitions read/archive; sys transitions prune and record.

## Failure, idempotency, concurrency, offline
Mark-read repeated is no-op with same result. Prune is idempotent.

## Privacy, retention, abuse
Pruned items leave no content; event carries `ntf_id` only.

## Observability & budgets
Gauge `inbox_items{state}` aggregated, no per-account labels. Prune job completes ≤ 15 min per 1M accounts (ASSUMPTION).

## Tests
- TEST-PS-106-03-01 (unit): each transition row covered.
- TEST-PS-106-03-02 (property): no path from read to unread.
- TEST-PS-106-03-03 (integration): item beyond retention is pruned on next job run.
- TEST-PS-106-03-04 (integration): cap of 1000 prunes oldest first.

## Acceptance criteria
1. Transition table implemented one-to-one.
2. Monotonic read verified in property test.
3. Prune idempotent under double run.

## Assumptions & open decisions
- ASSUMPTION: 1000 item cap.
- No D-ID blocks state logic.
