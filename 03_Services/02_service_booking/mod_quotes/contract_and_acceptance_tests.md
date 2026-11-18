# PS-032-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-09. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines the module's acceptance test catalogue, fixtures and pass or fail criteria. Business outcome: a tester can decide, from this file and the linked process specs, whether quotes meet their contract before release.

Exclusions: test implementation, CI wiring and test-environment provisioning (later implementation prompt). This file creates no test code.

## Requirements
- PS-032-09.R01: Each test ID in Section 2 has objective pass and fail criteria. A criterion that needs human judgment is marked explicitly.
- PS-032-09.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases from every process file are covered by at least one test in this catalogue or a linked file.
- PS-032-09.R03: Accessibility, localization and budget checks are included in the catalogue (Section 2, T04 and T06).
- PS-032-09.R04: Contract tests validate request and response shapes against the schema versions in commands_queries_events.md.
- PS-032-09.R05: Fixtures in Section 3 use only synthetic identifiers and amounts. No real names, addresses, contact data or personal identifiers.
- PS-032-09.R06: A release gate passes only when every test in Section 4 passes. Partial passes are not accepted.

## 1. Test identifiers
Each process file owns its test IDs under its own number (`TEST-PS-032-01-Tnn` to `TEST-PS-032-10-Tnn`). This file defines the end-to-end and cross-cutting tests as `TEST-PS-032-09-Tnn`.

## 2. End-to-end and cross-cutting tests
| Test ID | Scenario | Pass criteria | Fail criteria |
|---|---|---|---|
| TEST-PS-032-09-T01 | Happy path: create, issue, accept | Status ends ACCEPTED; events created, issued, accepted delivered once each; history has 4 rows | Any status, event or history mismatch |
| TEST-PS-032-09-T02 | Two-party race on one revision (accept vs withdraw) | Exactly one command succeeds; the other returns the specified error code; no partial rows | Both succeed, or neither, or a row without history |
| TEST-PS-032-09-T03 | Offline accept queued and sent twice after reconnect | One ACCEPTED transition; second call replays; client shows pending until ack | Two transitions or client shows accepted before ack |
| TEST-PS-032-09-T04 | Accessibility check on quote view and accept dialog | Zero critical or serious automated findings; status and amounts readable without colour; focus order matches reading order | Any critical finding, or status conveyed by colour only |
| TEST-PS-032-09-T05 | Export then re-read of own quotes (round trip) | Exported record count equals stored count for caller; checksum verified | Missing or extra records |
| TEST-PS-032-09-T06 | Localization of error messages | Every code in validation_rules.md has a `message_key`; no raw English text in response body | Missing key or raw text |
| TEST-PS-032-09-T07 | Non-party and anonymous probing | Identical response bodies for absent and non-party IDs | Any difference in body, status or timing beyond 50 ms |
| TEST-PS-032-09-T08 | Feature flag off | All commands return QUOTES_FEATURE_DISABLED; reads still return data | Any write accepted, or reads blocked |

## 3. Fixtures
| Fixture | Content |
|---|---|
| F-A provider | participant_id `p_provider_example_01`, no block |
| F-B requester | participant_id `p_requester_example_02`, no block |
| F-C blocked pair | `p_blocked_example_03` blocked by requester |
| F-D operator | operator ID `op_example_01` with `quotes:hold` and case `case_example_0001` |
| F-E basic quote | EUR, one line 2000 × 4500, total 9000 |
| F-F giveaway | EUR, one line 1000 × 0, total 0 |
| F-G boundary amount | total 99999999999 |
| F-H expired | issued revision with `valid_until` one second in the past |
| F-I clock | injectable server clock for expiry tests |

## 4. Release gate
- Every TEST-PS-032-01 to 10 test ID in the process files passes, plus TEST-PS-032-09-T01 to T08.
- Zero open critical findings from accessibility, privacy (no personal data in payloads or logs) or security review.
- Budgets in observability_performance.md Section 2 are met under the load test.
- Any open decision marked in these files is either resolved in DECISIONS.md or explicitly accepted by the reviewer.

## 5. Process-file test catalogue
| Process file | Test IDs | Scope |
|---|---|---|
| domain_schema.md | TEST-PS-032-01-T01 to T06 | Model, money integer rule, immutability, uniqueness, hash, giveaway |
| validation_rules.md | TEST-PS-032-02-T01 to T06 | Field rules, error codes, evaluation order |
| workflow_state_machine.md | TEST-PS-032-03-T01 to T05 | Transitions, guards, expiry, terminal immutability |
| commands_queries_events.md | TEST-PS-032-04-T01 to T05 | Signatures, replay, events, schema version |
| authorization_capabilities.md | TEST-PS-032-05-T01 to T05 | Matrix, non-party not-found, operator audit, revocation |
| failure_recovery_idempotency.md | TEST-PS-032-06-T01 to T05 | Retry matrix, conflicts, partial failure, offline |
| privacy_retention_abuse.md | TEST-PS-032-07-T01 to T05 | Data classes, rate limits, deletion, probing |
| observability_performance.md | TEST-PS-032-08-T01 to T04 | Metrics, log allowlist, load budget, expiry telemetry |
| import_export_backup_rollback.md | TEST-PS-032-10-T01 to T04 | Export format, import boundary, restore, rollback |

Each process-file test has its pass and fail criteria in the linked file's case table. A test passes when its observed result matches the "Expected" column exactly and no forbidden field appears in any output.

## 6. Test-level requirements
- Clock: tests use the injectable server clock (F-I). No test reads wall-clock time directly.
- Concurrency tests run at least 100 iterations with randomized interleavings and must pass all 100.
- Property tests: money arithmetic and hash determinism must hold for 10,000 generated inputs.

## Assumptions and open decisions
- A-quotes-23 in import_export_backup_rollback.md defines the export format used by T05.
- Load test profile in observability_performance.md Section 2 is the reference for budget checks.
- Test environment and CI integration are open for the implementation prompt. No decision is made here.
