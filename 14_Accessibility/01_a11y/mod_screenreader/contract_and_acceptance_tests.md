# PS-110-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-09.R01 | Every requirement in PS-110-01 through PS-110-08 maps to one or more test IDs. | MVP |
| PS-110-09.R02 | Manual test with at least NVDA, VoiceOver (iOS) and TalkBack (Android) on the current release of each before release; versions recorded in the test report. | MVP |
| PS-110-09.R03 | Contract tests run on every schema change. | MVP |

## Data / schema
Fixtures: 12 representative events (cycle consent recorded, offer received, payment claim created, claim disputed, message received, listing published, offline queued, sync failed, and four error states).

## Commands / queries / events
Replays of `scr.template.publish`, `announcement_template.published`.

## States & transitions
Covered by TEST-PS-110-03 series.

## Validation & errors
Negative fixtures per code in [PS-110-02](validation_rules.md).

## Authorization
Negative tests per [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection per [PS-110-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Log scan per [PS-110-07](privacy_retention_abuse.md).

## Observability & budgets
Latency tests per [PS-110-08](observability_performance.md).

## Tests
- TEST-PS-110-09-01 contract: schema samples validate.
- TEST-PS-110-09-02 e2e: cycle consent flow announced in each of three readers (manual).
- TEST-PS-110-09-03 a11y: automated accessible-name scan of catalog (tool PENDING research).
- TEST-PS-110-09-04 offline: announcements from bundled templates with network off.

## Acceptance criteria
1. Traceability matrix covers all PS-110 requirements.
2. Manual reader matrix passes for each of 12 fixtures.
3. Claim-state fixtures never speak "paid" for a CLAIMED state.

## Assumptions & open decisions
- ASSUMPTION: manual reader testing is required; automated tests cannot confirm spoken output.
- No Dxx decision directly affects testing.
