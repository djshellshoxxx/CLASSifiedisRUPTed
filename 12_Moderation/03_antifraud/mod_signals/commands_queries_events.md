# PS-101-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-ID-001.

**Decision labels:** Event payload size and aggregate thresholds are PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-04.R01 | Commands: `sgn.create`, `sgn.update`. Queries: `sgn.list_by_subject`, `sgn_aggregate.read`. Events: `signal.recorded`, `signal.suppressed`, `signal.expired`, `signal.redacted`. | MVP |
| PS-101-04.R02 | Every state-changing command carries an idempotency key (CTR-EVT-001 R03). | MVP |
| PS-101-04.R03 | `sgn.update` requires `expected_revision`. | MVP |
| PS-101-04.R04 | `sgn.list_by_subject` returns IDs, types, value buckets and windows only. No raw input. | MVP |
| PS-101-04.R05 | `sgn_aggregate.read` returns counts only and withholds cells with fewer than 5 subjects. | MVP |

## Data / schema
Command envelope: `command_type`, `idempotency_key`, `actor_ref` (principal ID), `expected_revision` (update only), `payload`.

Event payload `signal.recorded` v1.0.0: `signal_id`, `signal_type`, `subject_ref`, `value`, `confidence_bucket`, `window_start`, `window_end`, `expires_at`. `event_type` matches CTR-EVT-001 R10.

## Commands / queries / events
| Name | Caller | Idempotency key | Revision | Errors |
|---|---|---|---|---|
| `sgn.create` | sys_ producer | (`source_event_ref`, `signal_type`) | n/a | SIGNAL.TYPE_UNKNOWN, SIGNAL.VALUE_OUT_OF_RANGE, SIGNAL.WINDOW_INVALID, SIGNAL.FORBIDDEN_FIELD, SYS.NOT_FOUND |
| `sgn.update` (suppress) | mod_ with case grant | (mod, `signal_id`, reason) | required | SIGNAL.REASON_INVALID, EVT.REVISION_CONFLICT, CAP.GRANT_NOT_ACTIVE |
| `sgn.list_by_subject` | mod_ with case grant | none (read) | n/a | SYS.NOT_FOUND |
| `sgn_aggregate.read` | sys_ scorer | none (read) | n/a | SYS.FORBIDDEN |

Example request:
```json
{"command_type":"sgn.update","idempotency_key":"k_01J...","expected_revision":2,
 "payload":{"signal_id":"sgn_...","reason_code":"appeal_upheld"}}
```

Versioning: adding a signal type is MINOR; changing a field class is MAJOR (CTR-SCH-001 R10).

## States & transitions
Events map to transitions in PS-101-03.

## Validation & errors
Validation rules are in PS-101-02. Error envelope: CTR-ERR-001.

## Authorization
Capability IDs and scopes are in PS-101-05.

## Failure, idempotency, concurrency, offline
Duplicate command with same key and digest returns the original result. Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Details: PS-101-06.

## Privacy, retention, abuse
Event payloads carry no PRIVATE or LOCATION data. `max_data_class` is PSEUDONYMOUS for every event in this module.

## Observability and budgets
Each command and event increments a counter labeled by name and result (PS-101-08).

## Tests
- TEST-PS-101-06 (contract): `signal.recorded` v1.0.0 golden fixture validates against schema.
- TEST-PS-101-09 (integration): duplicate `sgn.create` returns the same `signal_id` and emits no second event.
- TEST-PS-101-10 (e2e): sign-up burst from F07 produces `auth_burst` signal; F12.S03.M01 reads aggregate only.

## Acceptance criteria
1. Every command and query has a row in the table and a golden request example.
2. Event schemas are registered in CTR-SCH-001 with SHA-256 digests.
3. No event contains a field outside PS-101-01.

## Assumptions & open decisions
- ASSUMPTION: scorer identity is a `sys_` principal with a `global` aggregate-only grant.
- D07 defaults (PROVISIONAL, unapproved).
