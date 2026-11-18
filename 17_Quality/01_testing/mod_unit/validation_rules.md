# PS-137-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-02.R01 | Manifest build rejects any `test_id` not matching `^TEST-PS-\d{3}-\d{2}-\d{2}$` | MVP |
| PS-137-02.R02 | Manifest build fails if `test_file` does not exist or contains no executable test case (0 test cases = fail) | MVP |
| PS-137-02.R03 | A SPEC.md requirement ID with no mapped unit test is reported; count must be 0 before module leaves SPEC-DRAFT-COMPLETE | MVP |
| PS-137-02.R04 | Quarantine reason 20..500 chars and must reference a tracking note ID | MVP |
| PS-137-02.R05 | Coverage values outside 0.00..100.00 or with more than 2 decimals are rejected | MVP |

## Data / schema
Validation operates on `TestManifestEntry`, `CoverageSnapshot`, `QuarantineRecord` from PS-137-01.

## Commands / queries / events
Validation runs inside `unit.MapTest`, `unit.RecordCoverage`, `unit.QuarantineTest` (PS-137-04). Read-only check mode `unit.CheckManifest` runs in CI without writes.

## States & transitions
Not applicable: validation is stateless. Failed validation leaves the previous manifest revision in place.

## Validation & errors
| Code | Trigger | Retryable | User message key | Diagnostic (privacy-safe) |
|---|---|---|---|---|
| UNIT.TEST_ID_INVALID | regex fails | no | unit.test_id_invalid | test_id pattern, no file content |
| UNIT.TEST_ID_DUPLICATE | same test_id in two rows | no | unit.test_id_duplicate | both file paths |
| UNIT.TEST_FILE_MISSING | path absent or no test cases | no | unit.test_file_missing | path only |
| UNIT.REQ_UNMAPPED | SPEC requirement without test | no | unit.req_unmapped | requirement ID |
| UNIT.QUARANTINE_REASON_INVALID | reason length or tracking ID fails | no | unit.quarantine_reason_invalid | length only |
| UNIT.COVERAGE_OUT_OF_RANGE | percent invalid | no | unit.coverage_out_of_range | field name |

Errors are typed per CTR-ERR-001; no stack traces or test output in user-facing messages.

## Authorization
Validators run with CI service identity. Validation rules are versioned with the manifest schema.

## Failure, idempotency, concurrency, offline
Validation is deterministic for the same repository commit: same input yields the same error list order (sorted by `test_id`). Re-running validation has no side effects.

## Privacy, retention, abuse
Error diagnostics must not echo test fixture values. Tracking note IDs are references only; do not paste ticket content into reasons.

## Observability & budgets
Counter per error code per CI run. Full manifest check p95 <= 30 s for 5,000 TEST-IDs (ASSUMPTION).

## Tests
- TEST-PS-137-02-01 (unit): each error code triggered by a minimal fixture.
- TEST-PS-137-02-02 (property): any string not matching regex is rejected (generated inputs, PS-136 harness).
- TEST-PS-137-02-03 (integration): SPEC requirement with deleted test produces UNIT.REQ_UNMAPPED.

## Acceptance criteria
1. All six error codes have one unit test each.
2. Validation output is byte-identical across two runs on the same commit.
3. No validation error contains fixture values or stack traces.

## Assumptions & open decisions
- ASSUMPTION: tracking note ID format is `NOTE-<n>` in the repository issue tracker; format to confirm.
- D07 PROVISIONAL (D07 default, unapproved): quarantine retention reasons are kept as audit records.
