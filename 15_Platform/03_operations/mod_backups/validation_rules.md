# PS-120-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-02.R01 | A backup job request is refused if any scope field is outside the closed scope set in PS-120-01 R02. | MVP |
| PS-120-02.R02 | A job whose window overlaps an existing `complete` or `running` set of the same scope and kind is refused (no overlap for one scope and kind). | MVP |
| PS-120-02.R03 | A job including any SECRET-class field, unhashed, is refused with `BACKUP.SECRET_IN_SCOPE`. | MVP |
| PS-120-02.R04 | Incremental job requires a `parent_set_id` whose status is `complete` and whose window ends at or before the new window starts. | MVP |
| PS-120-02.R05 | Manifest digest must match the SHA-256 of canonical JSON (JCS) of the manifest body before a set may move to `verifying`. | MVP |
| PS-120-02.R06 | Destination must be on the approved store list; any other destination is refused with `BACKUP.DESTINATION_NOT_APPROVED`. | MVP |

## Data / schema
Validation runs on the request and manifest against PS-120-01. Field-level diagnostics name the path and rule only.

## Commands / queries / events
Applied in `backup.schedule` and `backup.verify` (PS-120-04).

## States & transitions
Validation failure at schedule creates no set. Digest failure at verify moves `verifying` to `failed` (PS-120-03).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| BACKUP.SCOPE_INVALID | false | validation / 400 | R01 |
| BACKUP.WINDOW_OVERLAP | false | conflict / 409 | R02 |
| BACKUP.SECRET_IN_SCOPE | false | forbidden / 403 | R03 |
| BACKUP.PARENT_INVALID | false | unprocessable_state / 422 | R04 |
| BACKUP.MANIFEST_MISMATCH | false | internal / 500 | R05 |
| BACKUP.DESTINATION_NOT_APPROVED | false | forbidden / 403 | R06 |

## Authorization
Validation is run by the job executor under `sys` principal; it does not authorize.

## Failure, idempotency, concurrency, offline
Validation is deterministic. A job that fails validation is never retried automatically.

## Privacy, retention, abuse
Errors contain no object content or key material (CTR-ERR-001 R06).

## Observability & budgets
Metric: `backup_validation_failures_total{code}`. Budget: manifest validation <= 5 s for 10 million objects (ASSUMPTION).

## Tests
- TEST-PS-120-02-01 (unit): each rule R01–R06 has pass and fail fixture.
- TEST-PS-120-02-02 (integration): overlapping window returns `BACKUP.WINDOW_OVERLAP`.
- TEST-PS-120-02-03 (negative): SECRET plaintext fixture in scope is refused and not written.
- TEST-PS-120-02-04 (integration): manifest tampered by one byte fails with `BACKUP.MANIFEST_MISMATCH`.

## Acceptance criteria
1. Every code above is in the module catalog.
2. TEST-PS-120-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: manifest JCS canonicalization shares the CTR-EVT-001 library.
- PROVISIONAL (D07 default).
