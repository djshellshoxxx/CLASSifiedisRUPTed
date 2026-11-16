# PS-005-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (fixtures R01–R13), CTR-ERR-001 (fixtures per code), CTR-SCH-001 R09 (golden fixtures), CTR-PRV-001 R01 (CI check). PENDING CTR-LST-001 (F01 contract fixtures).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-09.R01 | Every event type in PS-005-04 has a valid and invalid fixture per CTR-EVT-001 schema. | MVP |
| PS-005-09.R02 | Every GIVE.* code in PS-005-02 and PS-005-03 has a fixture that produces it, and its retryable flag matches the registry. | MVP |
| PS-005-09.R03 | Contract test against F01 stub: reserve/reopen commands accept giveaway events; PENDING CTR-LST-001. | MVP |
| PS-005-09.R04 | Negative and abuse suites: unauthorized read, forged IDs, oversized payload, free-text injection. | MVP |
| PS-005-09.R05 | Accessibility: claim action states announced by screen reader; touch targets ≥ 44 × 44 CSS px (ASSUMPTION). | MVP |
| PS-005-09.R06 | Offline/reconnect E2E: submit offline, reconnect, ack, no duplicate. | MVP |

## Data / schema
Fixtures stored under the module test directory (future phase). Each fixture declares schema version and expected outcome.

## Commands / queries / events
Covered by fixtures in PS-005-04 test IDs.

## States & transitions
Transition coverage: every row in the PS-005-03 table has one test.

## Validation & errors
Error fixtures assert `code`, `retryable`, `category`, and absence of input values.

## Authorization
Negative fixtures from PS-005-05 matrix, including `SYS.NOT_FOUND` parity.

## Failure, idempotency, concurrency, offline
Concurrency and replay fixtures from PS-005-06. Offline fixtures use D08 pending-queue behavior.

## Privacy, retention, abuse
Privacy fixtures: no free text, no coordinates, purge within 24 h (PS-005-07).

## Observability & performance
Budget tests from PS-005-08 run in performance environment.

## Tests
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-005-09-01 | contract | event envelope and schema fixtures |
| TEST-PS-005-09-02 | contract | error code and retryable fixtures |
| TEST-PS-005-09-03 | integration | F01 stub reserve/reopen |
| TEST-PS-005-09-04 | property | at most one ACCEPTED per listing under concurrency |
| TEST-PS-005-09-05 | e2e | giver publishes, claimant submits, giver accepts, handover, confirm |
| TEST-PS-005-09-06 | a11y | claim states announced; touch target size |
| TEST-PS-005-09-07 | offline | queued submit replay after reserve |

## Acceptance criteria
1. Every test ID in this file passes in CI before implementation sign-off.
2. Contract fixtures validate against CTR-EVT-001 and CTR-ERR-001 registries with zero drift.
3. E2E path TEST-PS-005-09-05 completes without any payment or settlement step.

**Assumptions and open decisions:** Touch target size is ASSUMPTION (WCAG 2.1 AA target-size guidance; F14 to confirm). Fixture ownership is QA Lead (F17). D08 governs offline fixtures; see [DECISIONS.md](../../../DECISIONS.md).
