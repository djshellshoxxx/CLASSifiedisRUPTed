# PS-114-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-09.R01 | Contract tests cover the build manifest schema, the cacheability rules and the purge triggers. | MVP |
| PS-114-09.R02 | Offline acceptance: signed-in user can read last-synced public listings and shell with network disabled. | MVP |
| PS-114-09.R03 | Browser matrix: Chromium, Firefox, Safari (desktop and iOS 17+ ASSUMPTION). | MVP |
| PS-114-09.R04 | Offline page and stale notice meet WCAG 2.2 AA and are announced to screen readers. | MVP |

## Data / schema
Fixtures: builds N and N+1, public, private, region and cross-origin responses; quota-limited storage.

## Commands / queries / events
Contract test on manifest schema and purge triggers.

## States & transitions
All rows of workflow_state_machine.

## Validation & errors
One failing fixture per PS-114-02 rule.

## Authorization
Matrix fixtures from PS-114-05.

## Failure, idempotency, concurrency, offline
Fault injection from PS-114-06.

## Privacy, retention, abuse
Classes and clear-data tests from PS-114-07.

## Observability & budgets
Suite ≤ 10 min.

## Tests
- TEST-PS-114-09-01 (contract): manifest schema validation.
- TEST-PS-114-09-02 (e2e): offline read of last-synced listing after reload.
- TEST-PS-114-09-03 (a11y): offline page and stale notice.
- TEST-PS-114-09-04 (performance): warm-cache FCP budget.

## Acceptance criteria
1. Contract and offline e2e green.
2. Browser matrix run before MVP gate (not yet run).
3. Accessibility checks pass.

## Assumptions & open decisions
- ASSUMPTION: iOS version floor.
- No Dxx blocks test scope.
