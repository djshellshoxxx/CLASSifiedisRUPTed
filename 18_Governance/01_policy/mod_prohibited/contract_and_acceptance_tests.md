# PS-146-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-09. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [17_Quality](../../../17_Quality). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-09.R01: Business outcome. Each contract in this module (commands, queries, events, errors, capabilities, schema) has a test that fails when behavior drifts from the specification. Acceptance means the policy engine is safe to activate: deterministic, fail-closed, auditable.
- Test ID format: `TEST-PS-146-NN-Tnn`, registry key `TEST-PS-146-NN` (planning/SPEC_REGISTRY.csv). Each test has objective pass/fail criteria.
- Exclusions: UI and accessibility tests for the reviewer console (F14, F17); owner-side integration tests (owned by owner modules).

## Test fixtures
- Fixture catalogue `fx-prohibited-v1`: 50 synthetic rules across 10 categories, using invented terms only (no real product names or personal data). Stored with the test suite.
- Fixture subjects: 200 synthetic snapshots covering allowed, held, blocked, Unicode-confusable, zero-width, oversized and control-character inputs.
- Clock: injected fake clock for due_at and escalation tests.
- Service principals: two synthetic service credentials (`svc-test-listings`, `svc-test-cycles`) and four role principals (author, approver, reviewer, auditor).

## Contract tests by file
| Test ID | Contract | Pass criteria |
|---|---|---|
| TEST-PS-146-01-T01 | Domain schema | Each persisted record migrates from empty; NOT NULL, enum, FK and partial unique index (single ACTIVE) constraints reject invalid rows; 100 percent of field constraints in domain_schema.md have one positive and one negative case. |
| TEST-PS-146-01-T02 | Subject snapshot excludes persistence | After 1000 evaluations, a database dump and logs contain no fixture title or description text. Zero matches. |
| TEST-PS-146-02-T01 | Error catalogue | Every code in validation_rules.md is returned by at least one test with matching HTTP status and retryable flag. Codes not in the catalogue fail the test. |
| TEST-PS-146-02-T02 | Validation order | For a request failing both schema version and text length, the response is PROHIBITED_SCHEMA_VERSION_UNSUPPORTED. |
| TEST-PS-146-02-T03 | Regex and term rejection | Rules with terms containing `(`, `*`, `|` or `\` are rejected with PROHIBITED_RULE_TERM_INVALID; zero rules accepted. |
| TEST-PS-146-02-T04 | Matching determinism | 1000 repetitions of the same snapshot on 3 instances yield byte-identical decisions (outcome, rule_codes) for all 200 fixtures. |
| TEST-PS-146-03-T01 | PolicyVersion transitions | All transitions in workflow_state_machine.md succeed or fail as stated; no transition from RETIRED, DISCARDED or ACTIVE-to-EDITING is accepted. |
| TEST-PS-146-03-T02 | Hold timeout | With fake clock at due_at, the hold moves to ESCALATED within 60 s; no path releases it without a reviewer resolution. |
| TEST-PS-146-03-T03 | Re-evaluation outcome | Re-evaluation of 50 ACTIVE subjects after activation: every ALLOW to HOLD change creates a hold; zero subjects are removed by the module. |
| TEST-PS-146-04-T01 | Evaluate contract | Example request and response in commands_queries_events.md validate against the published JSON schema; response contains rule_codes and no title or description. |
| TEST-PS-146-04-T02 | Events | Each event in the event table is emitted exactly once per triggering transition and carries the envelope fields from CTR-EVT-001 (or A-prohibited-02 placeholder). |
| TEST-PS-146-04-T03 | Schema version rejection | Unknown schema_version returns PROHIBITED_SCHEMA_VERSION_UNSUPPORTED on every command; unknown optional fields are ignored by a `"1"` consumer. |
| TEST-PS-146-05-T01 | Capability matrix | Every cell in the authorization matrix is covered by one allowed and one denied request; 100 percent agreement with the matrix. |
| TEST-PS-146-05-T02 | Separation of duties | Approver equal to author returns PROHIBITED_APPROVER_NOT_INDEPENDENT; reviewer equal to subject owner returns PROHIBITED_HOLD_REVIEWER_CONFLICT. |
| TEST-PS-146-05-T03 | Internal term confidentiality | Participant and public summary responses contain zero match_terms across the 200-fixture set. |
| TEST-PS-146-06-T01 | Idempotent replay | Same key and digest 100 times yields one decision row and identical decision_id; same key with different digest returns PROHIBITED_IDEMPOTENCY_CONFLICT. |
| TEST-PS-146-06-T02 | Concurrent activation | Two concurrent approvals of different versions: exactly one ACTIVE afterwards; the other fails with a typed error. |
| TEST-PS-146-06-T03 | Partial failure | Fault injection after decision write but before outbox commit: no orphan decision and no orphan event after recovery. |
| TEST-PS-146-06-T04 | Batch resume | Kill the re-evaluation worker at 3 random points; final processed_count equals subject count; no subject processed twice in committed output. |
| TEST-PS-146-07-T01 | Retention | After simulated 24 months, decisions for terminal subjects are removed or tombstoned; legal-hold subjects are untouched. |
| TEST-PS-146-07-T02 | Abuse rate limit | 1000 evaluate requests in one second from one service yield 429 with retry_after_s after the burst; no 5xx. |
| TEST-PS-146-07-T03 | Regex-flood input | 4000-character input of repeated term fragments completes within 5 ms p99 with no super-linear growth at 2x size. |
| TEST-PS-146-08-T01 | Evaluate latency | Load test at 200 rps for 10 minutes: server p95 <= 150 ms and p99 <= 400 ms; error rate <= 0.1 percent. |
| TEST-PS-146-08-T02 | Activation budget | Activation with 2000 rules and 20000 terms completes in <= 5 s on the reference instance size (to be recorded in 17_Quality). |
| TEST-PS-146-08-T03 | Re-evaluation throughput | 50000 subjects processed in <= 4 h at 2 workers. |
| TEST-PS-146-08-T04 | Log scrubbing | Sentinel strings placed in each forbidden log field appear zero times in captured logs. |
| TEST-PS-146-09-T01 | Test traceability | Every row in this table maps to a spec requirement ID that exists in the file named in the test ID; CI check fails on orphan IDs. |
| TEST-PS-146-10-T01 | Export round trip | Export then import into a clean instance reproduces policy versions, rules and content_sha256 byte-for-byte; decisions are not importable (import_export_backup_rollback.md). |
| TEST-PS-146-10-T02 | Restore boundary | Restore to a point before an activation leaves the later version absent; evidence rows are never overwritten. |

## Contract stability gate
- PS-146-09.R02: A change to any command, event, error code or capability name requires an update to this table and to the owning file in the same change set, and a review by the owner of CTR-ERR-001 / CTR-EVT-001 / CTR-CAP-001 (F15 / F16).

## Acceptance criteria
- PS-146-09.R03: All TEST-PS-146-NN-Tnn above pass on the reference build with objective criteria recorded in CI.
- PS-146-09.R04: No test uses real personal data, real product names or real prohibited terms; fixtures use invented terms (fx-prohibited-v1).
- PS-146-09.R05: Performance tests run only in 17_Quality environments; numbers in observability_performance.md are updated from measured values, not estimates.

## Open decisions
- A-prohibited-02 (envelope shape used by the event contract test), A-prohibited-03 (capability names used by the matrix test), A-prohibited-06 (snapshot contract used by fixtures), A-prohibited-10 (idempotency window used in T01).
- Reference instance size for performance tests is undefined; set in 17_Quality (A-prohibited-13 scope excludes performance).
