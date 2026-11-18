# PS-078-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10; QA Lead, F17). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (TEST-CTR-PRV-001-11 export), CTR-SCH-001 (R09 golden fixtures), CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-09.R01 | Every `EXPORT.*` code has a contract test asserting category, HTTP status and `retryable`. | MVP |
| PS-078-09.R02 | Golden package fixture for each scope (`full`, `profile`, `messages`, `commerce_records`) with expected file list and hashes. | MVP |
| PS-078-09.R03 | Manifest schema validated against CTR-SCH-001 registry with golden fixtures per supported version. | MVP |
| PS-078-09.R04 | Redaction suite: counterparty names, emails, coordinates and secrets absent from packages unless permitted. | MVP |
| PS-078-09.R05 | Synthetic data only in all fixtures. | MVP |

## Data / schema
Fixture: `subject`, `counterparties[]`, `records[]`, `expected_manifest`.

## Commands / queries / events
Drive PS-078-04 through the public API; assert emitted events.

## States & transitions
Scenarios cover all rows of PS-078-03.

## Validation & errors
Negative fixtures per PS-078-02 rule.

## Authorization
Tests for subject, other user, operator and generator principals.

## Failure, idempotency, concurrency, offline
Fault injection: worker kill, network drop, duplicate request, expired token.

## Privacy, retention, abuse
Test packages deleted at end of run.

## Observability & budgets
Suite ≤ 20 min in CI (ASSUMPTION).

## Tests
- TEST-PS-078-09-01 (contract): all EXPORT.* codes registered.
- TEST-PS-078-09-02 (golden): four scope fixtures match hashes.
- TEST-PS-078-09-03 (e2e): request, wait, download, token consumed, package expired on time.

## Acceptance criteria
1. TEST-PS-078-09-01 to -03 pass in CI.
2. Redaction suite (R04) passes with zero leaks.
3. Accessibility: export request and download controls keyboard-operable (F14 reference).

## Assumptions & open decisions
- PENDING: CTR-PORT-001 golden fixture location.
- PROVISIONAL (D10 default) for encryption test vectors.
