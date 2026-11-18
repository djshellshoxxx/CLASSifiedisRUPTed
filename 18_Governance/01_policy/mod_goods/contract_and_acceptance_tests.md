# PS-144-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-09. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F17 quality (test ownership), F01 listings (contract tests), F12 moderation (contract tests). **Upstream:** all PS-144 process specs; CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001. See [CONTRACTS](../../../planning/CONTRACTS.md).

## Purpose and scope
**Business outcome.** Each requirement in PS-144-01 to PS-144-10 has at least one objective, repeatable test with a pass and a fail criterion, so later implementation can be checked without interpretation.

**Exclusions.** Test code, fixtures and environments (implementation phase). Exploratory testing. Accessibility audits beyond the criteria in observability_performance.md.

## Test conventions
- IDs: `TEST-PS-144-<spec>-T<nn>`, for example `TEST-PS-144-03-T02`.
- Each test runs in CI for contract tests and in the pre-release gate for integration and load tests.
- A test passes only when every stated pass criterion holds. Any fail criterion fails the test.
- Fixtures use synthetic IDs in the ULID and `act_ref_` formats; no personal data.

## Tests by specification

### PS-144-01 domain schema
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-01-T01 | Attempt UPDATE and DELETE on a `goods_decision` row | Both rejected; row unchanged | Any change persists |
| TEST-PS-144-01-T02 | Activate two overlapping rules in the same scope | Second returns GOODS_RULE_OVERLAP; only one row SCHEDULED or ACTIVE | Both persist |
| TEST-PS-144-01-T03 | Create category whose parent chain is 5 deep | Returns GOODS_CATEGORY_HIERARCHY_INVALID | Category created |

### PS-144-02 validation rules
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-02-T01 | One fixture per rule row 1–35 in validation_rules.md | Each fixture returns its listed code and no other | Wrong code, or no code |
| TEST-PS-144-02-T02 | Payload with one unknown top-level field | Returns GOODS_PAYLOAD_INVALID, field pointer set, no record written | Accepted or silently stripped |
| TEST-PS-144-02-T03 | Activation with `effective_from` 6 min in the past | Returns GOODS_EFFECTIVE_RANGE_INVALID | Accepted |

### PS-144-03 workflow state machine
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-03-T01 | Attempt every (state, command) pair in both lifecycles | Allowed pairs succeed; all others return GOODS_RULE_STATE_INVALID or GOODS_REVIEW_STATE_INVALID | Any disallowed pair succeeds |
| TEST-PS-144-03-T02 | Review lease expires without release | Case returns to `OPEN` within 60 s of expiry; `assigned_reviewer_ref` null | Lease still held after 60 s |
| TEST-PS-144-03-T03 | Scheduled rule reaches `effective_from` | Rule is `ACTIVE` within 30 s; event `goods.rule.activated.v1` emitted once | Late by more than 30 s, or event missing or duplicated |

### PS-144-04 commands, queries and events
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-04-T01 | Validate every JSON example in commands_queries_events.md against its schema | All examples validate | Any example fails |
| TEST-PS-144-04-T02 | Inspect every emitted event | Envelope has all CTR-EVT-001 fields; payload contains no free text except none | Missing field or free text in payload |
| TEST-PS-144-04-T03 | Send `schema_version` `"2.0"` to a `1.x` endpoint | Returns GOODS_SCHEMA_VERSION_UNSUPPORTED | Processed |

### PS-144-05 authorization capabilities
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-05-T01 | Run every cell of the actor × action matrix | Result matches the matrix exactly | Any cell differs |
| TEST-PS-144-05-T02 | Drafter activates own rule | Returns GOODS_SEPARATION_OF_DUTIES | Activation succeeds |
| TEST-PS-144-05-T03 | Revoke a PRV capability, then send a decide call | Call refused with GOODS_NOT_AUTHORIZED within 60 s of revocation | Call succeeds after 60 s |

### PS-144-06 failure recovery and idempotency
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-06-T01 | Send the same command twice with the same key | One record; second response identical with `replayed: true`; one event | Two records or two events |
| TEST-PS-144-06-T02 | 50 concurrent writers update one rule with the same `expected_version` | Exactly one success; 49 GOODS_VERSION_CONFLICT | More than one success |
| TEST-PS-144-06-T03 | Outbox send fails 3 times then succeeds | Consumer receives the event once after dedupe on `event_id` | Consumer applies effect twice |

### PS-144-07 privacy, retention and abuse
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-07-T01 | Scan logs and PTY responses for a decision with a reviewer note | Note text absent from logs and PTY responses | Note text found |
| TEST-PS-144-07-T02 | Erase a listing owner's data | `subject_ref` tombstoned; decision row kept; owner fields cleared | Decision row deleted, or owner data remains |
| TEST-PS-144-07-T03 | Eleventh evaluation for one `subject_ref` within an hour | Returns GOODS_RATE_LIMITED; abuse signal emitted | Evaluation accepted |

### PS-144-08 observability and performance
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-08-T01 | Count active metric series under load test | At most 500 series; labels from closed sets | More than 500, or open-ended label values |
| TEST-PS-144-08-T02 | Run field allowlist check over 10,000 sampled log lines | Zero forbidden fields found | Any forbidden field found |
| TEST-PS-144-08-T03 | 200 evaluations per second for 15 min | p95 ≤ 150 ms; error rate < 0.5% | Either budget missed |

### PS-144-09 contract and acceptance tests
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-09-T01 | Traceability check | Every requirement ID in PS-144-01 to PS-144-10 maps to at least one test ID in this file | Any requirement without a test |
| TEST-PS-144-09-T02 | End to end: listing with `HOLD_FOR_REVIEW`, reviewer decides `ALLOW` | F01 may publish within 60 s of decision; decision event received once | Publication before decision, or late by more than 60 s |
| TEST-PS-144-09-T03 | Client offline during decision | No goods write accepted without server acknowledgment; listing stays unpublished | Local write treated as decision |

### PS-144-10 import, export, backup and rollback
| Test ID | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|
| TEST-PS-144-10-T01 | Export then import into an empty test environment | Record counts and per-file SHA-256 match manifest | Any mismatch |
| TEST-PS-144-10-T02 | Import a batch containing one `ACTIVE` rule | Rule lands in `EDITING`; batch flagged | Rule lands in `ACTIVE` or `SCHEDULED` |
| TEST-PS-144-10-T03 | Restore to a point 10 min old, then replay outbox | No duplicate events and no new decisions | Duplicate events or decisions |

## Assumptions
None new. Assumptions used by these tests are defined in their source specs (A-goods-01 to A-goods-15).

## Open decisions
- **OD-GOODS-09.** Whether tests run against a shared staging environment or per-branch ephemeral environments. Default: ephemeral for contract tests; shared for load tests.
