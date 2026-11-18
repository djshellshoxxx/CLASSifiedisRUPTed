# PS-039-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-09. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (consumer contract tests), notifications (event contract tests), QA; shared F15, F16, F07, F10 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-09.R01: Each contract in the other process files has at least one test with an objective pass or fail rule. Tests are identified `TEST-PS-039-NN-Tnn`.
- PS-039-09.R02: Tests use a controllable clock and fixed fixtures. No test depends on wall-clock time or on the order of other tests.
- PS-039-09.R03: Accessibility and offline tests are included for the calendar view and for write queuing as they apply to this module.

## Fixtures
- Listing `rl_example_0001` owned by `participant_id_owner_01`, timezone `Europe/Berlin`, no active blocks.
- Requester `participant_id_requester_07` and a second requester `participant_id_requester_08`.
- Lifecycle service principal `svc_lifecycle_test`.
- Synthetic clock fixed at `2026-11-10T08:00:00Z`, advanced by test steps.
- Window `2026-12-01T09:00:00Z` to `2026-12-15T09:00:00Z`.

## Test catalogue
| Test ID | Scope | Setup | Pass criteria | Fail criteria |
|---|---|---|---|---|
| TEST-PS-039-01-T01 | domain schema | create one window, one block, one claim | Stored record matches field types, nullability and defaults in domain_schema.md for all three | Any field missing, wrong type, or default differs |
| TEST-PS-039-02-T01 | validation | submit each code trigger in validation_rules.md | Exactly the listed code returned, with the listed retryable flag | Different code, missing code, or extra code |
| TEST-PS-039-03-T01 | state machine | walk every allowed transition | Each transition produces its listed event and revision + 1 | Transition outside table is accepted |
| TEST-PS-039-03-T02 | hold expiry | hold, advance clock past TTL, attempt commit | Commit returns AVAIL_CLAIM_STATE_INVALID; claim state is expired | Commit succeeds, or state stays held after expiry |
| TEST-PS-039-04-T01 | commands | run each command example from commands_queries_events.md | Response matches documented shape; events match documented names and schema_version | Shape or name mismatch |
| TEST-PS-039-04-T02 | idempotency replay | same hold twice with same key | Second response identical with replayed true; one claim exists | Two claims, or replay without flag |
| TEST-PS-039-05-T01 | authorization matrix | every row of the matrix in authorization_capabilities.md | Each allowed cell succeeds and each N cell returns AVAIL_NOT_AUTHORIZED or the listed not-found code | Any cell differs from matrix |
| TEST-PS-039-05-T02 | visibility | anonymous calendar read after hold | Response contains only open, requested, unavailable; no IDs | Any ID, pseudonym or held/committed distinction present |
| TEST-PS-039-06-T01 | concurrency | 50 parallel holds on same period | Exactly one succeeds; 49 return AVAIL_CLAIM_CONFLICT or AVAIL_UNAVAILABLE | More than one success |
| TEST-PS-039-06-T02 | partial failure | kill process after hold commit before response, then retry | Retry returns original claim; claim count is one | Duplicate claim or lost claim |
| TEST-PS-039-07-T01 | disclosure | read logs and public responses for one hold | No participant ID, claim ID or coordinate in logs or public payloads | Any forbidden field found |
| TEST-PS-039-07-T02 | abuse caps | 21 holds in one hour from one requester | 21st returns AVAIL_RATE_LIMITED | 21st succeeds |
| TEST-PS-039-08-T01 | performance | load run per observability_performance.md | p95 and error rate within listed budgets for 30 minutes | Any budget exceeded |
| TEST-PS-039-08-T02 | log fields | sample 1000 log lines | Only fields in the log field list present | Any extra or forbidden field |
| TEST-PS-039-09-T01 | consumer contract | lifecycle stub calls commit and release | Stub receives documented shape; errors are handled per failure table | Undocumented field or unhandled code |
| TEST-PS-039-10-T01 | export round trip | export owner data, import into empty scope | Re-export is byte-identical except export_id | Any record missing or altered |
| TEST-PS-039-10-T02 | rollback | restore backup and replay events | State equals pre-backup state plus replayed events | Stale claim or missing committed claim |

## Accessibility and offline tests
- TEST-PS-039-09-T02: Calendar view exposes each interval with a text label that includes the date and status, passes an automated contrast check, and does not rely on colour alone. Fail if any interval lacks a text label.
- TEST-PS-039-09-T03: Offline hold request is queued locally as pending and sent once on reconnect with the same idempotency key. Fail if the request is sent twice with different keys or is shown as confirmed before server acknowledgement.

## Test data rules
- No real names, emails, addresses or coordinates appear in fixtures. Participant IDs are placeholders.
- Fixtures are reset between test runs.

## Open decisions
- A-AVAIL-27: Load test targets (50 holds per second, 500 calendar reads per second) are provisional and must be confirmed against the deployment size chosen in a later phase.
