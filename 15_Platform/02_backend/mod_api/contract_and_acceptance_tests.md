# PS-117-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-09.R01 | Every error code in PS-117-02, PS-117-06 has at least one contract test. | MVP |
| PS-117-09.R02 | CI runs the CTR-SCH-001 compatibility checker against the previous published OpenAPI document. | MVP |
| PS-117-09.R03 | Golden fixtures exist for every supported `from` version of the request envelope (CTR-SCH-001 R09). | MVP |

## Data / schema
Test fixture set: `fixtures/api/v1/*.json` (valid, invalid, boundary), with expected status and code.

## Commands / queries / events
Contract tests exercise `POST /v1/commands/*` and `GET` routes only.

## States & transitions
Tests cover PS-117-03 transitions via the public API (black-box).

## Validation & errors
Each negative fixture asserts code, HTTP status, `retryable`, `message_key`, and absence of input echo.

## Authorization
Tests run with fixtures for `acc_`, `ope_`, `mod_` and anonymous principals (PS-117-05 matrix).

## Failure, idempotency, concurrency, offline
Concurrency test: 50 identical and 50 distinct keys in parallel. Expected: one effect per key.

## Privacy, retention, abuse
Fixtures use synthetic IDs only (no real user data). Canary strings for redaction tests.

## Observability & budgets
Test suite runtime ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-117-09-01 (contract): error table conformance.
- TEST-PS-117-09-02 (contract): OpenAPI compatibility check.
- TEST-PS-117-09-03 (integration): concurrency matrix above.
- TEST-PS-117-09-04 (e2e, offline): PWA queue replay after 2 h offline with original key.
- TEST-PS-117-09-05 (accessibility): not applicable to api; PWA client tests cover localized messages via `message_key`.

## Acceptance criteria
1. 100% of error codes in PS-117-02 and PS-117-06 covered by contract tests.
2. Zero breaking-change findings in CI for MINOR releases.
3. Concurrency matrix passes 100 consecutive runs.

## Assumptions & open decisions
- ASSUMPTION: CI runtime budget.
- D08 (PROVISIONAL default, unapproved): offline replay test assumes 24 h key window.
