# PS-098-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-09.R01 | Every row of the PS-098-03 table has a test; non-table pairs expect `LIMITS.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-098-09.R02 | Contract tests validate check, policy commands, events and errors against CTR-SCH-001 and CTR-ERR-001. | MVP |
| PS-098-09.R03 | Each owning module (F01 listings, F02 proposals, F04 auctions, F05 bookings, F08 threads) has an integration test with the check call. | MVP |

## Data / schema
Fixtures: synthetic accounts in two jurisdictions; registered test cells; policies at each rollout step. No real personal data.

## Commands / queries / events
Test IDs `TEST-PS-098-09-nn`.

## States & transitions
All three states and six rows exercised.

## Validation & errors
Negative corpus covers every code in PS-098-02.

## Authorization
Table-driven suite of PS-098-05, including registered-caller checks.

## Failure, idempotency, concurrency, offline
Fault injection: policy service outage, concurrent creations, offline queued listing.

## Privacy, retention, abuse
Leakage tests from PS-098-07.

## Observability & budgets
Load and alert tests from PS-098-08.

## Tests
- `TEST-PS-098-09-01` unit: transition table exhaustive.
- `TEST-PS-098-09-02` contract: schemas validate; denial body has no counts.
- `TEST-PS-098-09-03` property: at most one active policy per key/scope/jurisdiction across 10 000 random operations.
- `TEST-PS-098-09-04` integration: F01 listing creation at quota boundary → allowed at N-1, denied at N.
- `TEST-PS-098-09-05` e2e (keyboard, screen reader): quota-denied message is announced and actionable; WCAG 2.1 AA (ASSUMPTION scope).
- `TEST-PS-098-09-06` offline: queued creation resolves to rejected after acknowledgement.

## Acceptance criteria
1. 100 % of transitions and codes covered in CI.
2. Owner-module integration tests pass for all five quota keys.
3. Accessibility tests pass for quota messages.

## Assumptions & open decisions
- ASSUMPTION: owner modules provide check stubs before this suite runs.
- D08 (PWA offline writes), PROVISIONAL default applies to test TEST-PS-098-09-06 (unapproved).
