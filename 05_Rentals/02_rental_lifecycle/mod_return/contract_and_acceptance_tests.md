# PS-043-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-09. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** Stage 4 implementers, test owners, Prompt 3 completeness review.

## Purpose and scope
Maps every requirement in PS-043-01 to PS-043-10 to executable tests with objective pass and fail criteria, names the fixtures, and defines contract tests against upstream and downstream stubs. Test IDs follow `TEST-PS-043-NN-Tnn`, where NN is the process number; the registry base ID is `TEST-PS-043-NN`.

**Exclusions:** performance load runs beyond the profile in PS-043-08; security penetration testing (not yet scheduled; not claimed).

## Requirements
- PS-043-09.R01: Every requirement ID R01-R06 in PS-043-01 to PS-043-10 is covered by at least one test (coverage matrix in Table 1).
- PS-043-09.R02: Every test has a deterministic fixture, an objective pass criterion and a fail criterion; no test relies on wall-clock time (A-return-31).
- PS-043-09.R03: Accessibility tests run on the returned-at control and the pending-offline state in the PWA.
- PS-043-09.R04: Contract tests run against stubs of mod_handoff (projection) and moderation intake; both are versioned with this module.
- PS-043-09.R05: Each test ID appears in exactly one spec file as its primary home.

## Table 1 — coverage by file
| Process | Requirements | Test IDs |
|---|---|---|
| PS-043-01 domain schema | R01-R06 | TEST-PS-043-01-T01 to T05 |
| PS-043-02 validation rules | R01-R06 | TEST-PS-043-02-T01 to T05 |
| PS-043-03 state machine | R01-R06 | TEST-PS-043-03-T01 to T05 |
| PS-043-04 interfaces and events | R01-R05 | TEST-PS-043-04-T01 to T04 |
| PS-043-05 authorization | R01-R05 | TEST-PS-043-05-T01 to T04 |
| PS-043-06 failure and idempotency | R01-R05 | TEST-PS-043-06-T01 to T06 |
| PS-043-07 privacy, retention, abuse | R01-R05 | TEST-PS-043-07-T01 to T05 |
| PS-043-08 observability | R01-R05 | TEST-PS-043-08-T01 to T04 |
| PS-043-09 this file | R01-R05 | TEST-PS-043-09-T01 to T04 |
| PS-043-10 import, export, rollback | R01-R05 | TEST-PS-043-10-T01 to T05 |

## Table 2 — tests
| ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-043-01-T01 | schema matches Table 1 of domain_schema.md | DDL diff against spec is empty (names, types, nullability, defaults) | any difference |
| TEST-PS-043-01-T02 | PII lint on schema | no column name or comment matches the forbidden list (name, email, phone, address, latitude, longitude, ip) | any match |
| TEST-PS-043-01-T03 | timing boundaries | due-60 min: on_time; due-61 min: early; due+60 min: on_time with lateness 0; due+61 min: late with lateness 2 (ceil of 61 min is 61; check exact value 61) | any other value |
| TEST-PS-043-01-T04 | atomic transition | fault injected after transition row write and before commit leaves no row change and no outbox row | any partial write |
| TEST-PS-043-01-T05 | one active return per rental | 10 concurrent InitiateReturn calls on one rental create 1 row; 9 receive RETURN_ALREADY_OPEN | any count other than 1 and 9 |
| TEST-PS-043-02-T01 | every error code triggered | each code in validation_rules.md Table 3 is produced by a unit test with its trigger | any code without a passing test |
| TEST-PS-043-02-T02 | note length boundary | 280 code points accepted; 281 rejected with RETURN_NOTE_TOO_LONG; NFC-equivalent input counted after normalization | any other result |
| TEST-PS-043-02-T03 | forbidden characters | U+202E, U+0000 and newline in a note each rejected with RETURN_NOTE_INVALID_CHARACTERS | any accepted |
| TEST-PS-043-02-T04 | returned_at window | server_now + 300 s accepted; + 301 s rejected; before handoff_at rejected; malformed rejected with RETURN_RETURNED_AT_INVALID | any other result |
| TEST-PS-043-02-T05 | check order | request failing both authentication and schema_version returns the authentication error | any other error first |
| TEST-PS-043-03-T01 | transition matrix | each allowed pair in the transition table succeeds; each other pair (9 x 9 minus allowed) returns RETURN_INVALID_TRANSITION with no write | any mismatch |
| TEST-PS-043-03-T02 | abandonment timer | initiated return untouched at 71 h 59 min 59 s; abandoned at 72 h 0 min 1 s | any other state |
| TEST-PS-043-03-T03 | terminal states | commands and timers on the 5 terminal states produce no transition | any transition |
| TEST-PS-043-03-T04 | revision increments | after N transitions revision equals N + 1 and transition rows have revisions 1 to N + 1 with no gaps | any gap |
| TEST-PS-043-03-T05 | timer versus command race | 50 runs with owner confirm and owner_response timer at the same instant: exactly one transition, loser error or skip | two transitions or none |
| TEST-PS-043-04-T01 | request and response examples | every example in commands_queries_events.md validates against the JSON schema generated from Table 1 | any validation failure |
| TEST-PS-043-04-T02 | event payload | every emitted event contains the envelope fields and no renter_note or owner_note key | any missing field or note key |
| TEST-PS-043-04-T03 | schema_version | value 1 accepted; 0 and 2 rejected with RETURN_SCHEMA_VERSION_UNSUPPORTED | any other result |
| TEST-PS-043-04-T04 | additive compatibility | consumer fixture built against v1 ignores an added optional field | consumer error |
| TEST-PS-043-05-T01 | authorization matrix | each cell of the matrix in authorization_capabilities.md is tested with the stated outcome (7 actors x 11 actions) | any cell mismatch |
| TEST-PS-043-05-T02 | non-disclosure | non-party GetReturn for an existing and a non-existing return produces byte-identical bodies and status | any difference |
| TEST-PS-043-05-T03 | block takes effect | block set at T; mutating command at T plus 1 s returns RETURN_PARTICIPANT_BLOCKED; read at T plus 1 s succeeds for own record | any other result |
| TEST-PS-043-05-T04 | read cache bound | revoked read permission is honoured within 60 s | honoured after 60 s |
| TEST-PS-043-06-T01 | replay | the same command twice returns identical bytes; second has Idempotent-Replayed: true; one transition row | any difference |
| TEST-PS-043-06-T02 | payload mismatch | same key with a changed field returns RETURN_IDEMPOTENCY_PAYLOAD_MISMATCH | any other result |
| TEST-PS-043-06-T03 | lost response | commit then drop response; client retry returns stored response; one transition | any duplicate transition |
| TEST-PS-043-06-T04 | duplicate publish | relay publishes an event twice; consumer fixture applies it once | applied twice |
| TEST-PS-043-06-T05 | two scheduler workers | two workers run the timer sweep over 1,000 eligible rows; each row transitions at most once | any row transitioned twice |
| TEST-PS-043-06-T06 | offline replay | queue of 5 commands replayed after 3 simulated network drops produces exactly the expected transitions and the UI shows pending until ack | extra transition or premature confirmed label |
| TEST-PS-043-07-T01 | no note leakage | a fixture note string appears in zero log lines, events and metrics across the full test run | any match |
| TEST-PS-043-07-T02 | deletion | after deletion completes, the participant_id does not appear in any return row of that participant | any match |
| TEST-PS-043-07-T03 | export redaction | export for one party includes own notes and shows the counterparty note as `[redacted-counterparty]` | counterparty note present |
| TEST-PS-043-07-T04 | rate limit | fourth InitiateReturn for one rental in 24 h returns RETURN_RATE_LIMITED with Retry-After | any other result |
| TEST-PS-043-07-T05 | legal hold | row with legal_hold_ref survives the retention job after its expiry date | row deleted |
| TEST-PS-043-08-T01 | metric labels | label set contains no forbidden keys and series count stays under 500 in the test run | any forbidden key or count above 500 |
| TEST-PS-043-08-T02 | log allowlist | log lines contain only Table 3 fields | any other field |
| TEST-PS-043-08-T03 | budgets | load profile from PS-043-08 meets Table 2 p95 and 5xx budgets on the reference staging size | any budget breached |
| TEST-PS-043-08-T04 | alert firing | injected 1% 5xx for 6 min fires the Command 5xx alert; no alert at 0.2% | alert missing or false alert |
| TEST-PS-043-09-T01 | coverage matrix | every requirement ID in PS-043-01 to PS-043-10 maps to at least one test ID in this repository | any unmapped ID |
| TEST-PS-043-09-T02 | deterministic clock | full suite run twice with fixed fake clock yields identical results | any difference |
| TEST-PS-043-09-T03 | upstream contract | projection stub and moderation stub pass consumer-driven contract tests | any failing contract |
| TEST-PS-043-09-T04 | accessibility | returned-at control and pending-offline state have no serious automated accessibility violations and have text equivalents | any serious violation |

## Fixtures
- Clock: fake clock, default now = 2026-11-14T17:00:00Z (A-return-31).
- Participants: `renter_fixture` = 01J8XPART00000000000000001; `owner_fixture` = 01J8XPART00000000000000002; `moderator_fixture`; `blocked_fixture`. No real names or contact details.
- Rental: rental_id 01J8XRNT000000000000000001, handoff_at 2026-11-10T09:00:00Z, due_at 2026-11-14T18:00:00Z, return_point_refs [01J8XRPT000000000000000001].
- Notes: fixture note strings are unique random tokens so leakage tests can grep for them.

## Open decisions
- A-return-31: Test runs use a fake clock and fixed fixtures; Stage 4 may add randomized property tests but the pass criteria above stay fixed.
