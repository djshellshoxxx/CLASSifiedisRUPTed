# PS-001-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (golden fixtures, R09), CTR-EVT-001 (envelope, idempotency), CTR-ERR-001 (code registry), CTR-CAP-001 (authorization matrix). **QA gate owner:** QA Lead (F17).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-09.R01 | Every command, query and event in PS-001-04 has contract tests against its CTR-SCH-001 schema and fixtures. | MVP |
| PS-001-09.R02 | Every error code in PS-001-02 has one negative test asserting code, category and retryable flag. | MVP |
| PS-001-09.R03 | Every row of the PS-001-03 transition table and the PS-001-05 matrix has one test. | MVP |
| PS-001-09.R04 | Property test: any command sequence keeps PS-001-01 invariants; revision +1 per accepted command. | MVP |
| PS-001-09.R05 | Offline test: queued archive replays after reconnect exactly once. | MVP |
| PS-001-09.R06 | Archive and restore controls and confirmations pass WCAG 2.1 AA checks (Accessibility Lead, F14). | MVP |

## Data / schema
Fixtures under `fixtures/listing.archived/1.0.0/` and `fixtures/listing.restored/1.0.0/` (CTR-SCH-001 R09).

## Commands / queries / events
Contract scope: [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Transition coverage: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Negative coverage: [validation_rules.md](validation_rules.md).

## Authorization
Matrix coverage: [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault-injection and offline tests: TEST-PS-001-09-09, -13.

## Privacy, retention, abuse
Privacy and abuse tests: TEST-PS-001-09-11, -12.

## Observability & budgets
Load test against budgets in [observability_performance.md](observability_performance.md): TEST-PS-001-09-15.

## Tests
| Test ID | Type | Scenario |
|---|---|---|
| TEST-PS-001-09-01 | unit | Reason enum rejects free text and unknown values |
| TEST-PS-001-09-02 | unit | Revision mismatch → `EVT.REVISION_CONFLICT`, no write |
| TEST-PS-001-09-03 | integration | Archive of PUBLISHED emits `listing.archived` (revision +1), de-indexes ≤ 60 s |
| TEST-PS-001-09-04 | integration | Restore re-runs validators; failure leaves ARCHIVED, no event |
| TEST-PS-001-09-05 | integration | Owner restore of moderator archive → `ARCHIVE.MODERATION_LOCKED` |
| TEST-PS-001-09-06 | integration | Archive blocked by open `cyc_`; succeeds after it closes |
| TEST-PS-001-09-07 | property | Random sequences keep invariants and monotonic revision |
| TEST-PS-001-09-08 | integration | Same key replays original response; different digest → key reuse error |
| TEST-PS-001-09-09 | fault injection | Timeout after commit, client retry, one event |
| TEST-PS-001-09-10 | authorization | Full PS-001-05 matrix incl. `SYS.NOT_FOUND` vs `SYS.FORBIDDEN` |
| TEST-PS-001-09-11 | abuse | 11th transition in 24 h → `ARCHIVE.TRANSITION_RATE_LIMITED` |
| TEST-PS-001-09-12 | privacy | Events and logs have no free text, coordinates or case ID in owner view |
| TEST-PS-001-09-13 | e2e | Device A archives; offline device B queued restore reconciles to conflict |
| TEST-PS-001-09-14 | a11y | Screen-reader announcement on archive success and error |
| TEST-PS-001-09-15 | load | Budgets in PS-001-08 at 2× expected peak |

## Acceptance criteria
1. All 15 tests pass in CI with the fixtures above.
2. Every error code in PS-001-02 is emitted by at least one test.
3. No test calls a real third-party service.
4. Security and privacy sign-off by F10 and F16 is recorded by those owners. Not claimed here.

## Assumptions & open decisions
- D01 PROVISIONAL: envelope and dedupe behavior.
- D08 PROVISIONAL: offline queue behavior tested in -09, -13.
- PENDING CTR-LST-001: fixture for active references is a stub until the contract exists.
