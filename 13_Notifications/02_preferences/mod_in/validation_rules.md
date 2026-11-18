# PS-106-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-02.R01 | `categories` keys must be exactly {transactional, deadline, activity, security}; values boolean. | MVP |
| PS-106-02.R02 | `security` must be `true`. | MVP |
| PS-106-02.R03 | `retention_days` in {7, 30, 90, 365}. | MVP |
| PS-106-02.R04 | Batch mark-read accepts 1–100 `ntf_` IDs owned by the caller. | MVP |
| PS-106-02.R05 | `object_ref`, when present, has a registered CTR-ID-001 prefix. | MVP |

## Data / schema
| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| categories | R01 | INPREF.CATEGORY_UNKNOWN | false | err.inpref.category_unknown |
| categories.security | R02 | INPREF.SECURITY_REQUIRED | false | err.inpref.security_required |
| retention_days | R03 | INPREF.RETENTION_INVALID | false | err.inpref.retention_invalid |
| ids (batch) | R04 | INPREF.BATCH_TOO_LARGE | false | err.inpref.batch_too_large |
| ids (batch) | ownership | SYS.NOT_FOUND | false | err.sys.not_found |
| object_ref | R05 | ID.PREFIX_MISMATCH | false | err.id.prefix_mismatch |
| revision | matches stored | SYS.CONFLICT | true | err.sys.conflict |

## Commands / queries / events
Validation before write; rejected writes emit no event.

## States & transitions
Not applicable.

## Validation & errors
CTR-ERR-001 envelope. Unknown IDs in a batch do not reveal existence of others (SYS.NOT_FOUND for the whole batch with `details` listing field indexes only).

## Authorization
Ownership check precedes state check.

## Failure, idempotency, concurrency, offline
Validation is deterministic; safe to retry after fixing input.

## Privacy, retention, abuse
Logs record rule enums only.

## Observability & budgets
Counter per code. p95 ≤ 2 ms.

## Tests
- TEST-PS-106-02-01 (unit): each rule maps to one code and retryable flag.
- TEST-PS-106-02-02 (unit): batch of 101 IDs rejected; batch with one foreign ID rejected entirely.
- TEST-PS-106-02-03 (contract): error envelope matches CTR-ERR-001.
- TEST-PS-106-02-04 (negative): unknown category key rejected, not ignored.

## Acceptance criteria
1. Each rule has passing and failing fixture.
2. Batch is all-or-nothing.
3. No ID existence leak in errors.

## Assumptions & open decisions
- ASSUMPTION: batch size 100.
- Message keys pending mod_languages.
