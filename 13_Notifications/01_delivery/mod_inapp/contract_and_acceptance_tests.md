# PS-103-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-09.R01 | Every row of the PS-103-03 table has a test; non-table pairs expect `INAPP.STATE_NOT_ALLOWED`. | MVP |
| PS-103-09.R02 | Contract tests validate producer, recipient and event schemas and all error codes in CI. | MVP |
| PS-103-09.R03 | Each producer module (listings, cycles, auctions, bookings, messages) has an integration test that creates at least one template-conforming notification. | MVP |
| PS-103-09.R04 | Template CI check runs on every registry change (forbidden-class scan, parameter names). | MVP |

## Data / schema
Fixtures: synthetic accounts, blocks, templates for each producer, two devices per account. No real personal data.

## Commands / queries / events
Test IDs `TEST-PS-103-09-nn`.

## States & transitions
All six states and eight rows exercised.

## Validation & errors
Negative corpus for each code in PS-103-02.

## Authorization
Table-driven suite of PS-103-05 matrix.

## Failure, idempotency, concurrency, offline
Fault injection: producer retries, relay outage, offline queue flush, two-device races.

## Privacy, retention, abuse
Leakage and retention tests from PS-103-07.

## Observability & budgets
Load and alert tests from PS-103-08.

## Tests
- `TEST-PS-103-09-01` unit: transition table exhaustive.
- `TEST-PS-103-09-02` contract: schemas validate; event payloads omit `params`.
- `TEST-PS-103-09-03` integration: listing-created producer notification appears in recipient inbox within 2 s.
- `TEST-PS-103-09-04` integration: blocked sender notification suppressed.
- `TEST-PS-103-09-05` offline: read and dismiss queued and flushed once.
- `TEST-PS-103-09-06` e2e (keyboard and screen reader): inbox list navigable; unread state announced; focus order preserved after dismiss; WCAG 2.1 AA (ASSUMPTION scope).
- `TEST-PS-103-09-07` privacy: template CI check rejects a template with a coordinate placeholder.

## Acceptance criteria
1. 100 % of transitions and codes covered in CI.
2. Producer integration tests pass for all listed producers.
3. Accessibility tests pass for inbox screens.

## Assumptions & open decisions
- ASSUMPTION: producer modules provide template stubs before this suite runs.
- D08 (PWA offline writes), PROVISIONAL default applies to TEST-PS-103-09-05 (unapproved).
