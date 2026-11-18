# PS-097-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-FED-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-04.R01 | `spam.evaluate` is internal (`sys_` only), idempotent on (subject_ref, model_version). | MVP |
| PS-097-04.R02 | Evaluate p95 ≤ 200 ms for listings and services; ≤ 50 ms for message metadata features. | MVP |
| PS-097-04.R03 | Reviewer commands require `Idempotency-Key` and `expected_revision`. | MVP |
| PS-097-04.R04 | Events are `spam.<past-tense verb>` (CTR-EVT-001 R10); payloads contain no features, text or scores. | MVP |

## Data / schema
| Command | Body | Event |
|---|---|---|
| `spam.evaluate` (sys_) | `subject_type`, `subject_ref`, `author_ref`, `text_ref?` (in-process only), `model_version` | `spam.evaluated`, `spam.quarantined`, `spam.rejected` |
| `spam.release` (mod_) | `spm_id`, `expected_revision`, `review_ref` | `spam.released` |
| `spam.reject` (mod_) | `spm_id`, `expected_revision`, `review_ref` | `spam.rejected` |

Queries: `spam.get_status` (author: state and generic category only), `spam.list_queue` (mod, case or review scope, cursor ≤ 100, ordered by `created_at` then `spm_id`).

## Commands / queries / events
Example:
```http
POST /v1/moderation/spam/evaluate   (internal, sys_ credential only)
{"subject_type": "lst", "subject_ref": "lst_01JA10...", "author_ref": "acc_01JA11...", "model_version": "1.4.0"}

202 {"spm_id": "spm_01JA12...", "state": "pending_evaluation", "revision": 1}
```
Event payload: `spm_id`, `subject_type`, `subject_ref`, `decision`, `reason_code`, `confidence`, `model_version`. `max_data_class` = PSEUDONYMOUS.

## States & transitions
Event per transition in [PS-097-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-097-02](validation_rules.md).

## Authorization
Capabilities in [PS-097-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retry policy in [PS-097-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Events never include `confidence` for message subjects (prevents probing the classifier through sends).

## Observability & budgets
Span `spam.<command>` with `request_id`, code, duration, model_version.

## Tests
- `TEST-PS-097-04-01` contract: schemas validate; events contain no feature or text fields.
- `TEST-PS-097-04-02` integration: duplicate `spam.evaluate` returns the same verdict.
- `TEST-PS-097-04-03` negative: `spam.evaluate` from `acc_` credential → `SYS.FORBIDDEN`.
- `TEST-PS-097-04-04` contract: `msg` events omit `confidence`.

## Acceptance criteria
1. Each command and event documented with schema, idempotency and errors.
2. Latency budgets met in load test.
3. No event leaks classifier internals.

## Assumptions & open decisions
- ASSUMPTION: `text_ref` is an in-process handle to content inside the evaluating service; it is not transmitted in events.
- D07 (retention), PROVISIONAL default applies to verdict payload retention (unapproved).
