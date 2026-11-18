# PS-088-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R04, R10–R13), CTR-EVT-001, CTR-ID-001 (`dlv_`, `fpr_`, `nod_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-01.R01 | A batch record `dlv_` lists event IDs and counts only, never payloads. | MVP |
| PS-088-01.R02 | Outbound queue row per (event_id, peer): `attempt`, `next_attempt_at`, `status`, `expires_at`. | MVP |
| PS-088-01.R03 | A batch holds ≤ 100 events and ≤ 1 MiB (CTR-FED-001 R10, ASSUMPTION). | MVP |
| PS-088-01.R04 | Per-event result is one of `accepted`, `duplicate`, `rejected` (code), `deferred` (code). | MVP |

## Data / schema
| Entity | Fields | Constraint |
|---|---|---|
| `dlv_` batch | `batch_id`, `peer` (`fpr_`), `event_ids[]`, `status`, `sent_at`, `acked_at` | ≤ 100 IDs |
| queue row | `event_id`, `peer`, `attempt` (int ≥ 0), `next_attempt_at`, `status`, `expires_at` | unique (event_id, peer) |
| result | `event_id`, `result`, `code` | code only when not accepted |

Transport fields (`sent_at`, `batch_id`) are not signed (CTR-FED-001 R04).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Batch retries safe by per-event dedupe (PS-087). Node-to-node only; PWA client writes are out of scope (D08 client queue owned by platform, not here).

## Privacy, retention, abuse
Queue rows hold IDs only; payload is read from the event log at send time. Retention in file 07.

## Observability & budgets
Queue depth and latency metrics in file 08.

## Tests
- TEST-PS-088-01-01 (schema): batch with 101 events fails.
- TEST-PS-088-01-02 (privacy): batch record has no payload field.
- TEST-PS-088-01-03 (uniqueness): duplicate (event, peer) queue row rejected.

## Acceptance criteria
1. Schemas validate.
2. Uniqueness enforced.

## Assumptions & open decisions
- ASSUMPTION: batch limits from CTR-FED-001.
