# PS-068-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Tests 01–13), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001. **Decisions:** D03, D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-09.R01 | CTR-COM-001 tests 02, 03, 05, 07, 08, 09, 12 run for every adapter in CI. | MVP |
| PS-068-09.R02 | Each adapter has a replay suite from recorded provider responses (no live network in CI). | MVP |
| PS-068-09.R03 | Reorg vectors: at least 20 synthetic reorg sequences per chain. | MVP |
| PS-068-09.R04 | Accessibility: claim status labels and mismatch messages pass WCAG 2.1 AA. | MVP |

## Data / schema
Fixtures: recorded responses per provider per chain; known token contract addresses; look-alike addresses.

## Commands / queries / events
Replay of adapter sequences against event schemas.

## States & transitions
Table tests shared with PS-068-03.

## Validation & errors
Error table tests shared with PS-068-02.

## Authorization
Matrix tests shared with PS-068-05.

## Failure, idempotency, concurrency, offline
Provider outage and disagreement scenarios shared with PS-068-06.

## Privacy, retention, abuse
Lint tests shared with PS-068-07.

## Observability & budgets
Alert tests shared with PS-068-08.

## Tests
- TEST-PS-068-09-01 (contract): recorded-response replay per adapter.
- TEST-PS-068-09-02 (golden): 99/100/101% amount vectors.
- TEST-PS-068-09-03 (e2e): submit, verify, finalize on testnet fixture chain.
- TEST-PS-068-09-04 (e2e): reorg after FINAL yields REVERSED with both events.
- TEST-PS-068-09-05 (a11y): mismatch message announced to screen readers.

## Acceptance criteria
1. All CTR-COM-001 listed tests pass for crypto.
2. Reorg vector suite passes.
3. Every PS-068 requirement maps to a test ID.

## Assumptions & open decisions
- ASSUMPTION: testnet fixtures stand in for mainnet in CI.
- D03, D04 (PROVISIONAL, unapproved).
