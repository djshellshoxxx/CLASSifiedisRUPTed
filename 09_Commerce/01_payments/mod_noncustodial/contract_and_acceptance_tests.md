# PS-069-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R01, R07, R11), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001 (R03). **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-09.R01 | Contract tests run against CTR-SCH-001 schemas for every command and event in PS-069-04. | MVP |
| PS-069-09.R02 | Adapter contract test: each registered adapter passes destination syntax vectors (valid, invalid, oversize, wrong chain). | MVP |
| PS-069-09.R03 | Accessibility: route screens meet WCAG 2.1 AA; destination and hint are readable as text, copyable, and not conveyed by colour alone. | MVP |
| PS-069-09.R04 | Offline: declare queue and "Sent, waiting" state tested on device airplane-mode and reconnect. | MVP |
| PS-069-09.R05 | No test fixture contains real personal data or real addresses; fixtures use reserved test values. | MVP |

## Data / schema
Fixtures: `fx_route_valid_onchain`, `fx_route_cash_hint`, `fx_route_custody_field`, `fx_adapter_suspended`, `fx_route_in_use`. Stored in test repository only.

## Commands / queries / events
Each command in PS-069-04 has at least one happy-path and one error-path test.

## States & transitions
Each row of the PS-069-03 table has one test (table-driven).

## Validation & errors
Each row of the PS-069-02 table has one test asserting code, retryable flag and message key.

## Authorization
Each row of the PS-069-05 matrix has one test.

## Failure, idempotency, concurrency, offline
Scenarios from PS-069-06 are automated: replay, timeout, race, offline queue.

## Privacy, retention, abuse
Canary and log-scan tests from PS-069-07 run in CI on every merge.

## Observability & budgets
Latency budget tests from PS-069-08 run nightly on staging.

## Tests
- TEST-PS-069-09-01 (contract): all command and event schemas validate; breaking change without version bump fails (`SCH.BREAKING_UNVERSIONED`).
- TEST-PS-069-09-02 (contract): adapter syntax vectors, 100% pass for each registered adapter.
- TEST-PS-069-09-03 (e2e): payer declares cash route, counterparty reads hint, claim references route (PS-071 interface).
- TEST-PS-069-09-04 (e2e): on-chain route declared, adapter suspended, route shows "Suspended", new claim refused.
- TEST-PS-069-09-05 (a11y): axe-core and manual screen-reader pass on route list and declare form.
- TEST-PS-069-09-06 (offline): queued declare survives app restart; no "Active" before ack.
- TEST-PS-069-09-07 (property): random valid routes never produce duplicate `destination_hash` within a trx.

## Acceptance criteria
1. TEST-PS-069-09-01 to -07 all pass in CI (later phase).
2. Zero use of real personal data in fixtures (automated check).
3. Accessibility checks report zero critical or serious violations.

## Assumptions & open decisions
- ASSUMPTION: test chains are local simulators; live testnet tests are optional.
- D09 (PROVISIONAL default, unapproved).
