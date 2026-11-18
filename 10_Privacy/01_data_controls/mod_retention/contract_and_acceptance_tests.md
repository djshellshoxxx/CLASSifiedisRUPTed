# PS-079-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10; QA Lead, F17). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (TEST-CTR-PRV-001-06, -07, -08), CTR-SCH-001 (R09 golden migration fixtures), CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-09.R01 | Every `RETAIN.*` code has a contract test for category, status and retryable value. | MVP |
| PS-079-09.R02 | Policy migration golden fixtures for each supported lengthen and shorten path (CTR-SCH-001 R09). | MVP |
| PS-079-09.R03 | Hold overlap test: hold on `cas_` A does not block purge of unrelated records of same type. | MVP |
| PS-079-09.R04 | Auto-release test at `ends_at` using a controlled clock. | MVP |
| PS-079-09.R05 | Synthetic fixtures only. | MVP |

## Data / schema
Fixtures: `policies[]`, `records[]` with created dates and holds, `expected_purged[]`.

## Commands / queries / events
Drive PS-079-04 through API.

## States & transitions
Scenarios cover PS-079-03 table.

## Validation & errors
Negative fixtures per PS-079-02.

## Authorization
Tests for F10 approver, case operator, sys sweeper and subject.

## Failure, idempotency, concurrency, offline
Fault injection: sweep crash, hold applied mid-sweep, store timeout.

## Privacy, retention, abuse
Fixtures purged after run.

## Observability & budgets
Suite ≤ 15 min in CI (ASSUMPTION).

## Tests
- TEST-PS-079-09-01 (contract): RETAIN.* codes registered.
- TEST-PS-079-09-02 (property): random hold and expiry schedules never purge a held record.
- TEST-PS-079-09-03 (e2e): full lifecycle active → expired → purged with one hold and one auto-release.

## Acceptance criteria
1. TEST-PS-079-09-01 to -03 pass in CI.
2. Hold overlap test (R03) passes.
3. Migration golden fixtures pass for all paths.

## Assumptions & open decisions
- PENDING: fixture generator (F17).
- PROVISIONAL (D07 default).
