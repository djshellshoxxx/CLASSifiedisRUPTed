# PS-137-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-04.R01 | Every state-changing command carries an idempotency key and returns the same result on replay within 24 h | MVP |
| PS-137-04.R02 | Commands and events are versioned (`v1`); breaking change requires a new version per CTR-SCH-001 | MVP |
| PS-137-04.R03 | `unit.CheckManifest` performs no writes and completes in <= 30 s for 5,000 IDs | MVP |
| PS-137-04.R04 | Queries return at most 200 rows per page | MVP |

## Data / schema
Command payloads reference PS-137-01 fields. Event payload example:
```json
{"event":"unit.TestMapped","v":1,"test_id":"TEST-PS-137-01-01","module_path":"17_Quality/01_testing/mod_unit","revision":3,"idempotency_key":"<ulid>"}
```

## Commands / queries / events
| Name | Signature | Idempotency key | Version | Errors |
|---|---|---|---|---|
| unit.MapTest | (test_id, test_file, req_ids[]) | test_id + file content hash | v1 | TEST_ID_INVALID, TEST_FILE_MISSING, REQ_UNMAPPED |
| unit.RecordCoverage | (run_id, module_path, line_pct, branch_pct, ci_commit) | run_id + module_path | v1 | COVERAGE_OUT_OF_RANGE |
| unit.QuarantineTest | (test_id, reason, tracking_note) | test_id + reason hash | v1 | QUARANTINE_REASON_INVALID, ILLEGAL_TRANSITION |
| unit.ApproveQuarantine | (test_id, approver) | test_id + approval id | v1 | ILLEGAL_TRANSITION, UNAUTHORIZED |
| unit.RetireTest | (test_id) | test_id | v1 | TEST_ID_RETIRED |
| unit.CheckManifest | (commit) | none (read-only) | v1 | SCHEMA_INVALID |
| Query GetTestForId | (test_id) | n/a | v1 | TEST_NOT_FOUND |
| Query ListUnmapped | (module_path, page) | n/a | v1 | none |

Events: `unit.TestMapped`, `unit.CoverageRecorded`, `unit.TestQuarantined`, `unit.QuarantineExpired`, `unit.TestRetired`. Envelope per CTR-EVT-001.

## States & transitions
Command effects follow PS-137-03. Read-only queries have no transitions.

## Validation & errors
Codes are prefixed `UNIT.`; see PS-137-02 for table. Each error carries `retryable` per CTR-ERR-001.

## Authorization
Command-level checks in PS-137-05. Queries open to all engineering roles.

## Failure, idempotency, concurrency, offline
Duplicate command with same key returns stored response, no second event. Event delivery is at-least-once; consumers dedupe on `idempotency_key`.

## Privacy, retention, abuse
Payloads contain identifiers and hashes only. `reason` is free text limited to 500 chars and is scanned by the PS-137-07 redaction rule.

## Observability & budgets
Per-command latency p95 <= 300 ms (ASSUMPTION); event lag to consumers <= 60 s.

## Tests
- TEST-PS-137-04-01 (unit): replay of `unit.MapTest` with same key returns identical response, zero new events.
- TEST-PS-137-04-02 (contract): `unit.TestMapped` payload validates against CTR-EVT-001 envelope schema.
- TEST-PS-137-04-03 (integration): `unit.CheckManifest` on dirty tree writes nothing (row count unchanged).

## Acceptance criteria
1. All commands in table implemented as specified; no extra commands exposed.
2. Replay test passes for 100% of state-changing commands.
3. Event schemas versioned and validated in CI.

## Assumptions & open decisions
- ASSUMPTION: 24 h idempotency window is sufficient for CI retries.
- CTR-ID-001 ID format OPEN; ULID shown as placeholder.
- CTR-EVT-001 is DRAFT; field names here are local until that contract is approved.
