# PS-054-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-09.R01 | Schema fixture (valid and invalid) for every route and event. | MVP |
| PS-054-09.R02 | State table fully covered; property test over random refresh and revoke interleavings. | MVP |
| PS-054-09.R03 | Negative tests for token reuse, cross-account access, timing, and rate limits. | MVP |
| PS-054-09.R04 | Accessibility: session management screens meet WCAG 2.1 AA; device list readable by screen reader. | MVP |

## Data / schema
Fixtures contain synthetic tokens only.

## Commands / queries / events
Contract tests replay each command with fixed keys.

## States & transitions
TEST-PS-054-05 and -06.

## Validation & errors
One test per code in [validation_rules](validation_rules.md).

## Authorization
One test per row in [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
TEST-PS-054-11 to -14.

## Privacy, retention, abuse
TEST-PS-054-15 to -17.

## Observability & budgets
Recovery suite runtime ≤ 4 min in CI.

## Tests
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-054-01 | unit | field class lint |
| TEST-PS-054-02 | unit | storage dump has no plaintext |
| TEST-PS-054-03 | unit | malformed token table |
| TEST-PS-054-04 | integration | unknown vs expired timing band |
| TEST-PS-054-05 | unit | state table rows |
| TEST-PS-054-06 | property | refresh interleavings |
| TEST-PS-054-07 | contract | routes vs CTR-EVT-001 and CTR-ERR-001 |
| TEST-PS-054-08 | integration | create replay returns SYS.CONFLICT; one session exists |
| TEST-PS-054-09 | unit | authorization matrix |
| TEST-PS-054-10 | unit | cross-account NOT_FOUND |
| TEST-PS-054-11 to -14 | integration | concurrency, outage, offline exclusion, propagation |
| TEST-PS-054-15 to -20 | integration/e2e | logs, limits, notice, metrics, load, redaction |

## Acceptance criteria
1. TEST-PS-054-01 to -20 pass in CI.
2. Contract tests pass against pinned CTR versions.

## Assumptions & open decisions
- ASSUMPTION: load profile 2 000 validations/s.
