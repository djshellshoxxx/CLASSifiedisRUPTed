# PS-079-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (R07 hold events, R12 deletion record), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-04.R01 | Commands: `retention.policy.publish`, `retention.policy.activate`, `retention.hold.apply`, `retention.hold.release`. Queries: `retention.policy.get_active`, `retention.hold.list_active` (counts and IDs only). | MVP |
| PS-079-04.R02 | Internal: `retention.sweep.run` (sys), idempotent per run window. | MVP |
| PS-079-04.R03 | State-changing commands require `Idempotency-Key` (CTR-EVT-001 R03). | MVP |
| PS-079-04.R04 | Hold events carry `cas_` ID, selector type and counts; never subject IDs. Hold events on LOCATION_PRECISE data are local-only (CTR-PRV-001 R07 analogue; OPEN R07 item). | MVP |
| PS-079-04.R05 | Events: `max_data_class` ≤ PSEUDONYMOUS. | MVP |

## Data / schema
Apply hold body: `{"case_id": "cas_...", "selector": {"record_type": "dispute_record"}, "ends_at": "2027-06-30T00:00:00Z", "approver_ids": ["ope_...", "ope_..."]}`.

## Commands / queries / events
| Operation | Idempotency | Emits | Errors |
|---|---|---|---|
| policy.publish | key + digest | `retention.policy_published` | RETAIN.UNKNOWN_CLASS, RETAIN.POLICY_NOT_APPROVED, SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW |
| policy.activate | key | `retention.policy_superseded` | RETAIN.INVALID_TRANSITION |
| hold.apply | key + `cas_` | `hold.applied` | PRV.HOLD_SCOPE_INVALID, RETAIN.HOLD_TOO_LONG, CAP.DUAL_APPROVAL_REQUIRED |
| hold.release | key | `hold.released` | CAP.GRANT_NOT_ACTIVE (inactive hold), CAP.SELF_APPROVAL_FORBIDDEN |
| sweep.run (sys) | run window | `record.expired`, `record.purged` | RETAIN.SWEEP_BACKLOG |

## States & transitions
Emissions follow PS-079-03.

## Validation & errors
Per PS-079-02.

## Authorization
Commands require capabilities in PS-079-05; sweep requires `sys_` grant.

## Failure, idempotency, concurrency, offline
Repeated `hold.apply` with identical body returns original hold. Offline clients cannot issue retention commands.

## Privacy, retention, abuse
Events and responses contain no subject content. Hold selectors are coded types.

## Observability & budgets
Command p95 ≤ 250 ms; sweep run start within 5 min of schedule (ASSUMPTION).

## Tests
- TEST-PS-079-04-01 (contract): all RETAIN.* and referenced PRV/CAP codes present in registries.
- TEST-PS-079-04-02 (idempotency): repeated hold apply → one `hold.applied` event.

## Acceptance criteria
1. Every command/event listed exists in the API contract.
2. No event contains subject IDs (negative fixture).
3. Sweep run is idempotent on rerun (TEST-PS-079-04-02 extension).

## Assumptions & open decisions
- ASSUMPTION: sweep start tolerance 5 min.
- OPEN (R07): event locality for hold events outside location class.
