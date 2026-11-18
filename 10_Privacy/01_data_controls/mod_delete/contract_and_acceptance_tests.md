# PS-077-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10; QA Lead, F17). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (TEST-CTR-PRV-001-06, -07, -12), CTR-EVT-001, CTR-ERR-001, CTR-FED-001 (R07), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-09.R01 | Every error code `DEL.*` in PS-077-02 has a contract test asserting category, HTTP status and `retryable` value. | MVP |
| PS-077-09.R02 | Event payload schemas for `deletion.*` and `record.deleted` pass CTR-SCH-001 lint. | MVP |
| PS-077-09.R03 | Deletion propagation test seeds one subject across ≥ 6 store classes and asserts absence after completion. | MVP |
| PS-077-09.R04 | Federation tombstone contract test verifies origin-only signing (CTR-FED-001 R07). | MVP |
| PS-077-09.R05 | Test fixtures contain synthetic data only; no real personal data. | MVP |

## Data / schema
Fixture schema: `subject`, `targets[]` (one per store class), `expected_absent_values[]`. Synthetic values only.

## Commands / queries / events
Tests drive PS-077-04 commands through the public API and assert emitted events.

## States & transitions
Scenarios cover all rows in PS-077-03.

## Validation & errors
Negative fixtures for each error row in PS-077-02.

## Authorization
Tests run for subject, counterparty, operator and executor principals (PS-077-05 matrix).

## Failure, idempotency, concurrency, offline
Fault injection: store timeout, executor crash mid-run, duplicate request, stale revision.

## Privacy, retention, abuse
Test artifacts purged after run; no production data.

## Observability & budgets
Suite runtime ≤ 15 min in CI (ASSUMPTION).

## Tests
- TEST-PS-077-09-01 (contract): all DEL.* codes in registry.
- TEST-PS-077-09-02 (integration): six-store propagation with hold on one target.
- TEST-PS-077-09-03 (e2e, offline): cancel queued offline and replayed after reconnect within window.

## Acceptance criteria
1. TEST-PS-077-09-01 to -03 pass in CI before any implementation merge.
2. Each acceptance criterion in PS-077-01 to -08 maps to at least one TEST ID.
3. Accessibility test: deletion confirmation dialog keyboard-operable (F14 reference).

## Assumptions & open decisions
- PENDING: test data generator and fixture registry (QA, F17).
- PROVISIONAL (D08 default) for offline e2e expectations.
