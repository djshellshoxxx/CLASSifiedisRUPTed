# PS-087-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05, R06), CTR-EVT-001 (R02, R03), CTR-ID-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-01.R01 | Dedupe index key is `(origin_node, event_id)` (CTR-FED-001 R05). No other key is used for federated events. | MVP |
| PS-087-01.R02 | Equivocation key is `(origin_node, aggregate_id, revision)`; a second distinct `event_id` or `payload_digest` under it is equivocation. | MVP |
| PS-087-01.R03 | Index rows store digests and IDs only, never payload. | MVP |
| PS-087-01.R04 | Local command idempotency records use CTR-EVT-001 R03 scope (actor, command type, key), retained 7 days. | MVP |

## Data / schema
| Entity | Fields | Constraint |
|---|---|---|
| `dedupe_row` | `origin_node` (`nod_`), `event_id` (`evt_`), `aggregate_id`, `revision`, `payload_digest` (sha256), `first_seen_at`, `first_result`, `hit_count` | unique on `(origin_node, event_id)` |
| `equivocation_record` | `origin_node`, `aggregate_id`, `revision`, two `{event_id, payload_digest}` pairs, `detected_at` | retained as evidence (RET-EVD) |

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Internal service principal `sys_` only. No end-user access.

## Failure, idempotency, concurrency, offline
Check-and-record is a single atomic upsert (PS-087-06). Not an offline component.

## Privacy, retention, abuse
Rows contain no personal data. Retention in file 07.

## Observability & budgets
Index size and hit ratio in file 08.

## Tests
- TEST-PS-087-01-01 (key): same event_id from two origins creates two rows.
- TEST-PS-087-01-02 (privacy): row schema has no payload field.
- TEST-PS-087-01-03 (equivocation key): same revision with different event_id detected.

## Acceptance criteria
1. Keys match R01–R02.
2. No payload stored.

## Assumptions & open decisions
- ASSUMPTION: index retention window (see file 07).
