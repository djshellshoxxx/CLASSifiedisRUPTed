# PS-086-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R06 equivocation, R07 tombstones), CTR-EVT-001 (R02 revision, R08 hash chain), CTR-ID-001 (`cfl_` PENDING; `nod_`, `fpr_`, `cas_`), CTR-SCH-001 (PENDING `conflict.record` 1.0.0), CTR-PRV-001 (RET-EVD).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-01.R01 | A conflict record has exactly one `kind` from the closed enum `{equivocation, revision_gap}`. | MVP |
| PS-086-01.R02 | An equivocation record holds two distinct event references (`first_event_id`, `second_event_id`), each with its raw signed bytes. The two `event_id` values differ. | MVP |
| PS-086-01.R03 | Uniqueness on (`origin_node`, `aggregate_type`, `aggregate_id`, `revision`, `kind`). A second detection of the same pair links to the existing record and adds no duplicate row. | MVP |
| PS-086-01.R04 | `origin_node` and the peer that delivered each conflicting event (`delivered_by_fpr`) are stored separately. They may differ only when relay forwarding is allowed (CTR-FED-001 step 6). | MVP |
| PS-086-01.R05 | Raw evidence bytes are stored as received and never re-serialized (CTR-SCH-001 R08). | MVP |

## Data / schema
| Field | Type and constraint | Class |
|---|---|---|
| `cfl_id` | `cfl_` + 26 base32 (ulid class; prefix PENDING) | PUBLIC |
| `revision` | integer ≥ 1 | PUBLIC |
| `kind` | closed enum `equivocation`, `revision_gap` | PUBLIC |
| `origin_node` | `nod_` ID | PUBLIC |
| `delivered_by_fpr` | `fpr_` ID | PSEUDONYMOUS |
| `aggregate_type` | registry enum (CTR-SCH-001) | PUBLIC |
| `aggregate_id` | ID per CTR-ID-001 | PSEUDONYMOUS |
| `first_event_id`, `second_event_id` | `evt_` ID, distinct | PUBLIC |
| `first_payload_digest`, `second_payload_digest` | 64 lowercase hex SHA-256; may be equal (equal digest, different `event_id`) | PUBLIC |
| `evidence_bytes_ref` | storage reference to raw envelopes (never inline in logs) | PSEUDONYMOUS |
| `status` | closed enum `open`, `reviewed`, `closed` (PS-086-03) | PUBLIC |
| `opened_at` | RFC 3339 UTC ms, server-set | PUBLIC |
| `linked_case_id` | nullable `cas_` ID | PSEUDONYMOUS |
| `schema_version` | `1.0.0` | PUBLIC |

## Commands / queries / events
Defined in PS-086-04. This file defines the record shape only.

## States & transitions
Defined in PS-086-03.

## Validation & errors
Rules in PS-086-02.

## Authorization
Field visibility in PS-086-05. No end-user role reads conflict records.

## Failure, idempotency, concurrency, offline
Record writes follow PS-086-06.

## Privacy, retention, abuse
Conflict records contain IDs and digests. Raw envelope bytes are the only content and are classed by their own `max_data_class`, which is never above what federation may carry (CTR-FED-001 R03). Retention per PS-086-07.

## Observability & budgets
Gauge `fed_conflicts_open` by `kind`. Budgets in PS-086-08.

## Tests
- TEST-PS-086-01-01 (unit): each field enforces its class and enum; `kind` outside the enum is refused.
- TEST-PS-086-01-02 (unit): `first_event_id = second_event_id` is refused.
- TEST-PS-086-01-03 (integration): two detections of the same pair produce one row.
- TEST-PS-086-01-04 (integration): stored evidence bytes equal received bytes (hash compare).

## Acceptance criteria
1. Schema enforced at write path; TEST-PS-086-01-01 and -02 pass.
2. Uniqueness holds under concurrent detection; TEST-PS-086-01-03 passes.
3. Evidence is byte-identical; TEST-PS-086-01-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- PENDING CTR-ID-001: `cfl` prefix (class ulid, owner F11).
- PENDING CTR-SCH-001: `conflict.record` 1.0.0.
- PROVISIONAL (D01 default, unapproved): origin node is sole authority for its aggregates.
- PROVISIONAL (D07 default, unapproved): evidence retention per PS-086-07.
