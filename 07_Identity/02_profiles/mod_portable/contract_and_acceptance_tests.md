# PS-055-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-09.R01 | Golden bundle fixtures for each MINOR of `portable.bundle` (CTR-SCH-001 R09). | MVP |
| PS-055-09.R02 | Round-trip test: export → import on a second node reproduces all permitted fields. | MVP |
| PS-055-09.R03 | Tamper test: one-byte change in any field fails signature. | MVP |
| PS-055-09.R04 | Accessibility: export and import flows meet WCAG 2.1 AA; file picker labelled; progress announced. | MVP |

## Data / schema
Fixtures use synthetic profiles only.

## Commands / queries / events
Contract tests replay routes with fixed keys.

## States & transitions
TEST-PS-055-05, -06.

## Validation & errors
One test per code in [validation_rules](validation_rules.md).

## Authorization
One test per row in [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
TEST-PS-055-11 to -13.

## Privacy, retention, abuse
TEST-PS-055-14 to -17.

## Observability & budgets
Suite runtime ≤ 6 min in CI.

## Tests
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-055-01 | contract | manifest schema |
| TEST-PS-055-02 | unit | no acc_, reputation or moderation field in body |
| TEST-PS-055-03 | unit | failing fixture per validation step |
| TEST-PS-055-04 | unit | size check before parse |
| TEST-PS-055-05 | unit | state rows |
| TEST-PS-055-06 | integration | double apply |
| TEST-PS-055-07 | contract | routes |
| TEST-PS-055-08 | integration | idempotent export and apply |
| TEST-PS-055-09 | unit | authorization matrix |
| TEST-PS-055-10 | unit | download token reuse |
| TEST-PS-055-11 to -13 | integration | export fault, apply crash, concurrent apply |
| TEST-PS-055-14 to -20 | integration/e2e | class rules, LOCATION_PRECISE, rate limits, logs, metrics, latency, round trip (R02) |

## Acceptance criteria
1. TEST-PS-055-01 to -20 pass in CI.
2. Round-trip and tamper tests pass (R02, R03).

## Assumptions & open decisions
- ASSUMPTION: 25 MiB bundle budget.
