# PS-106-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-04.R01 | Preference writes use `expected_revision` and `idempotency_key`. | MVP |
| PS-106-04.R02 | Mark-read and archive are idempotent per `ntf_id`. | MVP |
| PS-106-04.R03 | List query is cursor-paginated, 50 items per page, newest first; p95 ≤ 150 ms. | MVP |
| PS-106-04.R04 | Events carry IDs, states and codes; no object content. | MVP |

## Data / schema
**Commands**

| Command | Actor | Idempotency key | expected_revision | Errors |
|---|---|---|---|---|
| `inbox.set_preferences` | user (self) | client key | required | INPREF.CATEGORY_UNKNOWN, INPREF.SECURITY_REQUIRED, INPREF.RETENTION_INVALID, SYS.CONFLICT |
| `inbox.mark_read` | user (self) | client key | n/a | INPREF.BATCH_TOO_LARGE, SYS.NOT_FOUND |
| `inbox.archive` | user (self) | client key | n/a | SYS.NOT_FOUND, INPREF.INVALID_STATE |

**Queries**: `inbox.list` (self; filter by category and state), `inbox.unread_count` (self; returns integer).

**Events**

| event_type | aggregate_type | max_data_class |
|---|---|---|
| inbox_preference.updated | inbox_preference | PSEUDONYMOUS |
| notification.inbox_recorded | notification | PSEUDONYMOUS |
| notification.marked_read | notification | PSEUDONYMOUS |
| notification.archived | notification | PSEUDONYMOUS |
| notification.inbox_pruned | notification | PSEUDONYMOUS |

Example payload `notification.marked_read`: `{"ntf_id":"ntf_…","category":"transactional"}`.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Mark-read queued offline per D08 pending queue; replay safe.

## Privacy, retention, abuse
Events omit `object_ref` to avoid revealing activity on objects to event subscribers (ASSUMPTION: subscribers are internal).

## Observability & budgets
Command p95 ≤ 100 ms; unread count p95 ≤ 50 ms.

## Tests
- TEST-PS-106-04-01 (contract): events validate against CTR-EVT-001 and contain no `object_ref`.
- TEST-PS-106-04-02 (integration): repeated mark-read returns same state, one event.
- TEST-PS-106-04-03 (integration): list pagination stable across concurrent inserts.
- TEST-PS-106-04-04 (unit): unread count equals count of `unread` items in fixtures.

## Acceptance criteria
1. Commands and queries match the tables.
2. No content in events (scan).
3. Pagination test passes with 10 000 items.

## Assumptions & open decisions
- ASSUMPTION: `object_ref` omitted from events.
- Prefix `inp_` PENDING CTR-ID-001.
