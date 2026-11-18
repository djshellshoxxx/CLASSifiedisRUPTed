# PS-077-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (accountable role: Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001, CTR-CAP-001, CTR-ID-001 (PENDING: `dsr_` prefix, ulid class, for data-subject requests; shared with mod_export).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-01.R01 | One `data_subject_request` row per deletion request; `scope` is a closed enum: `account`, `content_item`, `message`, `attachment`, `profile_field`. | MVP |
| PS-077-01.R02 | Unique partial index: at most one non-terminal request per (`subject_acc_id`, `scope`, `target_id`). A duplicate returns the existing row. | MVP |
| PS-077-01.R03 | Completion record holds IDs, per-store counts, state and timestamps only. Zero content fields (CTR-PRV-001 R12). | MVP |
| PS-077-01.R04 | `account` scope sets `cooling_off_until` = `requested_at` + 72 h (ASSUMPTION). Other scopes have no cooling-off. | MVP |
| PS-077-01.R05 | Request rows carry no personal data after completion; only `subject_acc_id` (PSEUDONYMOUS) and counts remain. | MVP |

## Data / schema
```json
{
  "id": "dsr_<ULID>",
  "subject_acc_id": "acc_<ULID>",
  "request_type": "deletion",
  "scope": "account | content_item | message | attachment | profile_field",
  "target_id": "string | null (prf_, lst_, msg_, att_ per scope)",
  "state": "see PS-077-03",
  "requested_at": "RFC 3339 UTC, ms",
  "cooling_off_until": "timestamp | null",
  "executed_at": "timestamp | null",
  "hold_refs": ["cas_<ULID>, max 20"],
  "completion": {"store_counts": {"<store_class>": "int"}, "held_count": "int", "failed_count": "int"},
  "aggregate_revision": "int >= 1",
  "schema_version": "1.0.0",
  "data_class": "PSEUDONYMOUS"
}
```
Provenance: `requested_by` (`acc_` or `ope_` for legal-hold-only paths), `channel` (`pwa` | `api`).

## Commands / queries / events
Defined in PS-077-04. Schema-level constraints: `scope` and `target_id` must be consistent (`account` requires `target_id = null`).

## States & transitions
Defined in PS-077-03. Row is immutable after terminal state except redaction of personal fields.

## Validation & errors
Field rules in PS-077-02. Error codes `DEL.*` and `SYS.*` only (CTR-ERR-001 R02).

## Authorization
Owner-only creation (`self`). Read of own completion record only. No operator field may be written by a subject request.

## Failure, idempotency, concurrency, offline
Row creation is idempotent on (`subject_acc_id`, `scope`, `target_id`, active state). `aggregate_revision` increments on each state change (CTR-EVT-001 R02). Offline: request may be queued under D08 and submitted once; the server row is authoritative.

## Privacy, retention, abuse
Request row: RET-AUD (12 months). Completion record: RET-AUD. Personal fields removed at completion. Abuse controls in PS-077-07.

## Observability & budgets
`del_requests_total{scope}`; row write p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-077-01-01 (unit): scope/target consistency rules reject `account` with a `target_id`.
- TEST-PS-077-01-02 (integration): duplicate request returns the same row; no second row.

## Acceptance criteria
1. Schema matches the JSON above and passes CTR-SCH-001 registry lint.
2. Completion record contains no field outside the R03 allowlist (checked by TEST-PS-077-01-02 fixture).
3. `dsr_` prefix either registered in CTR-ID-001 or the module is blocked (listed in TODO.md).

## Assumptions & open decisions
- PENDING: `dsr_` prefix in CTR-ID-001 (owner F15).
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- ASSUMPTION: 72 h cooling-off for account scope.
