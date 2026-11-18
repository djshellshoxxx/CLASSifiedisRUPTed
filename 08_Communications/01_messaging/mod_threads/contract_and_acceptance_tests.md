# PS-061-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-PRV-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-09.R01 | Contract tests run in CI on every change to `thread.v1`, `message.v1`, `attachment.v1`. | MVP |
| PS-061-09.R02 | Each requirement ID in PS-061-01 to PS-061-08 maps to ≥ 1 test ID in this file's matrix. | MVP |
| PS-061-09.R03 | Accessibility: new incoming message is announced through a polite live region; no focus steal (WCAG 2.1 AA, Accessibility Lead). | MVP |
| PS-061-09.R04 | Offline/reconnect: queued sends flush in order; no duplicates (PS-061-06). | MVP |

## Data / schema
Test fixtures: `fixtures/threads/` with valid and invalid thread, message and attachment JSON, one EXIF-with-GPS JPEG, one PNG declared as JPEG, one 10 MiB + 1 byte file.

## Commands / queries / events
Contract test harness replays each command in [PS-061-04](commands_queries_events.md) against the schema registry.

## States & transitions
Matrix below covers transitions in [PS-061-03](workflow_state_machine.md).

## Validation & errors
Error-code coverage: every code in [PS-061-02](validation_rules.md) is asserted at least once.

## Authorization
Authorization matrix tests are in [PS-061-05](authorization_capabilities.md) (TEST-PS-061-05-01..04).

## Failure, idempotency, concurrency, offline
Fault injection: kill server between event append and response; network drop mid-upload.

## Privacy, retention, abuse
Privacy assertions: TEST-PS-061-07-01..05.

## Observability & budgets
Performance tests: TEST-PS-061-08-01..03.

## Tests
Test matrix (ID → type → PS requirement):

| Test ID | Type | Covers |
|---|---|---|
| TEST-PS-061-09-01 | contract | PS-061-04 command shapes |
| TEST-PS-061-09-02 | unit | PS-061-02 error codes |
| TEST-PS-061-09-03 | integration | PS-061-03 transition table |
| TEST-PS-061-09-04 | integration | PS-061-06 idempotent send |
| TEST-PS-061-09-05 | property | revision monotonic, no gaps |
| TEST-PS-061-09-06 | e2e | two accounts: open, send, attach, archive, read |
| TEST-PS-061-09-07 | e2e | dispute lock blocks send by both parties |
| TEST-PS-061-09-08 | a11y | live-region announce, keyboard-only send, 200% zoom |
| TEST-PS-061-09-09 | offline | 200 queued sends flush in order |
| TEST-PS-061-09-10 | negative | guessed IDs, cross-thread attachment reuse |

## Acceptance criteria
1. All TEST-PS-061-09-01..10 and the test IDs cited in PS-061-01..08 pass in CI.
2. Every requirement row in PS-061-01..08 has a test ID (checked by script in CI).
3. Accessibility checks pass with zero critical violations.

## Assumptions & open decisions
- ASSUMPTION: test fixtures are synthetic; no real user content.
- Test execution is future-phase work; this file specifies only.
