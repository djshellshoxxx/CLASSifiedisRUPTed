# PS-087-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Commands section), CTR-EVT-001 (R03), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-04.R01 | `dedup.check_and_record` takes `origin_node`, `event_id`, `aggregate_id`, `revision`, `payload_digest`. | MVP |
| PS-087-04.R02 | Emits `dedup.duplicate_seen` (no payload) or `dedup.equivocation_detected` (IDs and digests only). | MVP |
| PS-087-04.R03 | `dedup.lookup` returns result for a key without mutating state. | MVP |

## Data / schema
Schemas `dedup.*@1.0.0` per CTR-SCH-001. Fields in [domain_schema.md](domain_schema.md).

| Operation | Actor | Event | Errors |
|---|---|---|---|
| dedup.check_and_record | sys_ (delivery/receive) | duplicate_seen / equivocation_detected | ENVELOPE_MALFORMED, EQUIVOCATION, WINDOW_EXCEEDED |
| dedup.lookup | sys_ | none | SYS.UNAVAILABLE |

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
The operation is itself idempotent: repeating the same call returns the same result.

## Privacy, retention, abuse
Events carry IDs and digests only.

## Observability & budgets
Event counts; equivocation event alerts.

## Tests
- TEST-PS-087-04-01 (contract): event schemas validate.
- TEST-PS-087-04-02 (idempotency): repeated check returns duplicate, one row.
- TEST-PS-087-04-03 (lookup): lookup does not change hit_count.

## Acceptance criteria
1. Operation table complete.
2. Repeats are stable.

## Assumptions & open decisions
- PENDING: consumer list (mod_delivery, mod_conflicts) in DEPENDENCY_MATRIX.md.
