# PS-111-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-09.R01 | Every release candidate has one conformance record per screen in the catalog. | MVP |
| PS-111-09.R02 | Automated scan runs in CI on every build; manual keyboard and reader pass per release. | MVP |
| PS-111-09.R03 | Contract tests run on every schema change. | MVP |

## Data / schema
Fixtures: synthetic screens for listing form, message thread, cycle consent, payment claim state, dispute form, and settings.

## Commands / queries / events
Replays of `wcag.record.submit` and `wcag.finding.transition`.

## States & transitions
Covered by TEST-PS-111-03 series.

## Validation & errors
Negative fixtures per [PS-111-02](validation_rules.md).

## Authorization
Negative tests per [PS-111-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Per [PS-111-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Per [PS-111-07](privacy_retention_abuse.md).

## Observability & budgets
Per [PS-111-08](observability_performance.md).

## Tests
- TEST-PS-111-09-01 contract: record schema validates.
- TEST-PS-111-09-02 a11y: automated scan of six fixture screens (tool PENDING research).
- TEST-PS-111-09-03 e2e: release gate blocks build with open blocker fixture.

## Acceptance criteria
1. Each release candidate has a complete record set.
2. Gate blocks in the blocker fixture.
3. Traceability covers all PS-111 requirements.

## Assumptions & open decisions
- ASSUMPTION: automated scan supplements, does not replace, manual testing.
- No Dxx decision directly affects testing.
