# PS-096-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-09.R01 | Every row of the PS-096-03 table has a passing test; every other pair expects `ENFORCE.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-096-09.R02 | Contract tests validate commands, events and errors against CTR-SCH-001 and CTR-ERR-001 in CI. | MVP |
| PS-096-09.R03 | Cross-module contract tests with F01 listings, F03 services, F08 messages and F02 cycle renegotiation consumer. | MVP |

## Data / schema
Fixtures: listing with active barter cycle (test IDs only); service booking; message thread; account with two moderators (applier, approver); synthetic case. No real personal data.

## Commands / queries / events
Test IDs `TEST-PS-096-09-nn`.

## States & transitions
All six states and all seven transitions exercised.

## Validation & errors
Negative corpus covers every code in PS-096-02.

## Authorization
Table-driven suite of PS-096-05 matrix.

## Failure, idempotency, concurrency, offline
Fault injection: owner outage, duplicate effect delivery, reverse/expire race.

## Privacy, retention, abuse
Leakage tests from PS-096-07.

## Observability & budgets
Load and alert tests from PS-096-08.

## Tests
- `TEST-PS-096-09-01` unit: transition table exhaustive.
- `TEST-PS-096-09-02` contract: schemas validate; no free-text fields.
- `TEST-PS-096-09-03` integration: hide on listing with active cycle → F02 receives renegotiation signal; cycle state unchanged.
- `TEST-PS-096-09-04` integration: suspend two-person flow end to end.
- `TEST-PS-096-09-05` property: active actions per target and type never exceed 1.
- `TEST-PS-096-09-06` e2e (keyboard, screen reader): moderator console apply and approve flows meet WCAG 2.1 AA (ASSUMPTION scope); target owner notice readable.
- `TEST-PS-096-09-07` federation: tombstone export accepted by peer fixture; non-tombstone refused.

## Acceptance criteria
1. 100 % of transitions and error codes covered in CI.
2. Cross-module tests pass three consecutive runs.
3. Accessibility tests pass for both moderator and owner screens.

## Assumptions & open decisions
- ASSUMPTION: F01, F03, F08 and F02 provide contract stubs before this suite runs.
- D04 (partial barter execution), PROVISIONAL default applies to renegotiation tests (unapproved).
