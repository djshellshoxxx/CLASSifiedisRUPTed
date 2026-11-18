# PS-066-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001, CTR-FED-001 (R03). **Decisions:** D05, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-09.R01 | Contract suite runs in CI on every change to `meetup_plan` schema or related commands. | MVP |
| PS-066-09.R02 | Every error code in PS-066-02 is covered by a contract test that asserts code, category, HTTP status, retryable and message key. | MVP |
| PS-066-09.R03 | Every row of PS-066-03 has one test; every other pair has a negative test. | MVP |
| PS-066-09.R04 | Accessibility test: check-in and safe-exit controls are operable by keyboard and expose labels to screen readers (WCAG 2.1 AA). | MVP |
| PS-066-09.R05 | Offline test: queued safe exit delivered after reconnect in all scripted scenarios. | MVP |

## Data / schema
Fixtures: two parties, one trusted contact, one venue, one custom venue; window at fixed clock times; code vectors.

## Commands / queries / events
Contract tests replay recorded command sequences against the schema of each version.

## States & transitions
State table tests shared with PS-066-03.

## Validation & errors
Error contract tests shared with PS-066-02.

## Authorization
Matrix tests shared with PS-066-05.

## Failure, idempotency, concurrency, offline
Chaos scenarios: relay drop, duplicate delivery, clock skew of ±5 min, timer delay of 5 min.

## Privacy, retention, abuse
Privacy contract: lint and log scan tests shared with PS-066-07.

## Observability & budgets
Tests assert metric labels and log fields from PS-066-08.

## Tests
- TEST-PS-066-09-01 (contract): schema and event envelope validation for `meetup_plan` 1.0.0.
- TEST-PS-066-09-02 (contract): error table conformance.
- TEST-PS-066-09-03 (e2e): propose, confirm, check in from both parties, check out.
- TEST-PS-066-09-04 (e2e): propose, confirm, safe exit from one party; counterparty sees "meetup ended" only.
- TEST-PS-066-09-05 (a11y): keyboard and screen reader pass on check-in flow.
- TEST-PS-066-09-06 (offline): safe exit queued offline, delivered on reconnect.

## Acceptance criteria
1. All contract suites green in CI before merge.
2. Each requirement ID in PS-066-01 to -08 maps to at least one test ID.
3. Accessibility and offline tests pass on the reference mobile PWA profile.

## Assumptions & open decisions
- ASSUMPTION: reference devices are defined by the F14 accessibility profile.
- D08 (PROVISIONAL default, unapproved).
