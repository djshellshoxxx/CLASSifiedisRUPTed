# PS-134-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-04.R01 | RegisterScenario and RecordResult are idempotent by key; replay within 24 h returns stored response | MVP |
| PS-134-04.R02 | RunScenario is idempotent by (test_id, commit, device); duplicate request returns existing run_id | MVP |
| PS-134-04.R03 | Commands versioned v1 per CTR-SCH-001 | MVP |
| PS-134-04.R04 | Query ListByFlow returns <= 100 rows per page | MVP |

## Data / schema
Event example:
```json
{"event":"e2e.RunCompleted","v":1,"run_id":"<ulid>","test_id":"TEST-PS-134-03-02","result":"errored","first_failed_step":null,"commit":"<sha40>","idempotency_key":"<ulid>"}
```

## Commands / queries / events
| Name | Signature | Idempotency key | Errors |
|---|---|---|---|
| e2e.RegisterScenario | (scenario fields) | test_id + content_hash | SCENARIO_INCOMPLETE, FLOW_UNKNOWN, FIXTURE_NOT_SYNTHETIC |
| e2e.RunScenario | (test_id, commit, device, environment) | test_id + commit + device | ILLEGAL_TRANSITION, DURATION_EXCEEDED |
| e2e.RecordResult | (run_id, result, first_failed_step, artifact_refs) | run_id + result | ILLEGAL_TRANSITION, SCHEMA_INVALID |
| e2e.QuarantineScenario | (test_id, reason, tracking_note) | test_id + reason hash | ILLEGAL_TRANSITION, UNAUTHORIZED |
| Query ListByFlow | (flow, page) | none | none |
| Query GetRun | (run_id) | none | NOT_FOUND |

Events: `e2e.ScenarioRegistered`, `e2e.RunCompleted`, `e2e.ScenarioQuarantined`. Envelope per CTR-EVT-001.

## States & transitions
Per PS-134-03.

## Validation & errors
Codes per PS-134-02 with `E2E.` prefix. Retryability per CTR-ERR-001.

## Authorization
Per PS-134-05.

## Failure, idempotency, concurrency, offline
Event delivery at-least-once; consumers dedupe on idempotency_key. RecordResult after `finished_at` returns ILLEGAL_TRANSITION.

## Privacy, retention, abuse
Payloads carry IDs and codes only; no step text or artifact content.

## Observability & budgets
Command p95 <= 200 ms (ASSUMPTION). RunCompleted lag to dashboard <= 60 s.

## Tests
- TEST-PS-134-04-01 (unit): RunScenario duplicate key returns same run_id.
- TEST-PS-134-04-02 (contract): RunCompleted validates against CTR-EVT-001 envelope.
- TEST-PS-134-04-03 (unit): RecordResult after finish rejected.

## Acceptance criteria
1. Commands and queries implemented exactly as listed.
2. Replay tests pass for every state-changing command.
3. No event carries step text or artifact content.

## Assumptions & open decisions
- CTR-ID-001 ID format OPEN; ULID shown as placeholder.
- CTR-EVT-001 DRAFT; field names local until approved.
