# PS-096-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-02.R01 | `action_type` ∈ {warn, hide, unpublish, remove_content, restrict_publish, suspend_account}. Else `ENFORCE.ACTION_UNKNOWN`. | MVP |
| PS-096-02.R02 | `target_id` prefix must match `target_type` (acc, lst, srv, rnt, auc, msg, thr) and the target must exist. Else `ENFORCE.TARGET_NOT_FOUND` (not_found, for unreadable targets too). | MVP |
| PS-096-02.R03 | `case_id` required and must be an open `cas_` where the applier holds a `case:<cas_>` grant. Else `ENFORCE.CASE_REQUIRED`. | MVP |
| PS-096-02.R04 | `expires_at` ≤ `effective_at` + 90 days; otherwise `ENFORCE.DURATION_TOO_LONG`. | MVP |
| PS-096-02.R05 | `msg` targets accept only `hide` and `remove_content`; account-level actions on a `msg` target are rejected. | MVP |
| PS-096-02.R06 | One active action of the same type per target. A second is `ENFORCE.ALREADY_ACTIVE`; use `supersede`. | MVP |
| PS-096-02.R07 | `reason_code` ∈ registry {SPAM, FRAUD_SIGNAL, HARASSMENT, PROHIBITED_ITEM, IMPERSONATION, FEDERATION_TOMBSTONE, APPEAL_REVERSED_RESTORE, POLICY_OTHER}. | MVP |

## Data / schema
Module prefix `ENFORCE` (slug `enforcement` abbreviated to fit CTR-ERR-001 R02, ≤ 8 characters).

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `ENFORCE.ACTION_UNKNOWN` | validation | 400 | false | `action_type` |
| `ENFORCE.TARGET_NOT_FOUND` | not_found | 404 | false | `target_id` |
| `ENFORCE.CASE_REQUIRED` | forbidden | 403 | false | `case_id` |
| `ENFORCE.DURATION_TOO_LONG` | validation | 400 | false | `expires_at` |
| `ENFORCE.TARGET_TYPE_MISMATCH` | validation | 400 | false | `target_type` |
| `ENFORCE.ALREADY_ACTIVE` | conflict | 409 | false | `action_type` |
| `ENFORCE.REASON_UNKNOWN` | validation | 400 | false | `reason_code` |
| `ENFORCE.TRANSITION_NOT_ALLOWED` | unprocessable_state | 422 | false | `state` |
| `ENFORCE.EFFECT_UNAVAILABLE` | unavailable | 503 | true | — |
| `ENFORCE.BULK_LIMIT` | validation | 400 | false | `target_ids` (> 50 per command, PS-096-07) |
| `ENFORCE.EXPORT_TOO_LARGE` | validation | 400 | false | `cursor` (> 10 000 rows, PS-096-10) |

## Commands / queries / events
Order of checks: auth, target existence, case grant, action/target compatibility, duration, reason, active-action uniqueness.

## States & transitions
Validation rejections write no `enf_event`.

## Validation & errors
`ENFORCE.EFFECT_UNAVAILABLE` is returned only when the action record was not written. After a write, effect delays are not errors; they appear as `effect_status = pending`.

## Authorization
`TARGET_NOT_FOUND` is returned for targets the applier cannot read (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Concurrent apply on the same target: unique partial index on active (`target_id`, `action_type`) enforces R06 under race.

## Privacy, retention, abuse
Error responses never echo the target's content or the case narrative.

## Observability & budgets
Counter `enforce_validation_error_total{code}`.

## Tests
- `TEST-PS-096-02-01` unit: each code on exact condition only.
- `TEST-PS-096-02-02` negative: `suspend_account` on a `msg` target → `ENFORCE.TARGET_TYPE_MISMATCH`.
- `TEST-PS-096-02-03` negative: 91-day `hide` → `ENFORCE.DURATION_TOO_LONG`.
- `TEST-PS-096-02-04` concurrency: 20 parallel `hide` on one listing → exactly one active row.

## Acceptance criteria
1. No invalid action is written.
2. Duplicate active actions impossible under concurrency test.
3. Error bodies contain no case narrative and no target content.

## Assumptions & open decisions
- ASSUMPTION: 90-day maximum duration and reason registry are defaults for Trust&Safety review.
- ASSUMPTION: `ENFORCE` is the error module prefix; the slug `enforcement` exceeds 8 characters.
