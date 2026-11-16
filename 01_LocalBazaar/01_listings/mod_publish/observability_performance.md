# PS-004-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (commit latency, rejections metric), CTR-ERR-001 (error metrics, BT-01 alert), CTR-PRV-001 (log redaction, R03, R09), CTR-ID-001 (log ID rules). **Pending:** PENDING CTR-MOD-001 (risk verdict latency).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-08.R01 | `lst.publish` server p95 ≤ 300 ms, including commit ≤ 150 ms (ASSUMPTION). | MVP |
| PS-004-08.R02 | V0–V11 p95 ≤ 5 ms; PII scan p95 ≤ 20 ms for 4000 characters (ASSUMPTION). | MVP |
| PS-004-08.R03 | Discovery index lag p95 ≤ 60 s from T1 (ASSUMPTION). | MVP |
| PS-004-08.R04 | Metric labels never include `listing_id`, `owner_ref`, `region_cell` or free text (cardinality and CTR-PRV R09). | MVP |
| PS-004-08.R05 | Logs carry request_id, command, listing_id, revision, state, code and timing. Never title, description, price or matched PII text. | MVP |

## Metrics
| Metric | Type | Labels | Use |
|---|---|---|---|
| `pub_publish_total` | counter | outcome (published, held, error), code | Throughput and error mix |
| `pub_publish_latency_ms` | histogram | outcome | p95 budget (R01) |
| `pub_held_total` | counter | reason_code | Hold rate by cause |
| `pub_risk_timeout_total` | counter | none | Fail-closed frequency |
| `pub_hold_age_seconds` | histogram | reason_code | F12 SLA (72 h) |
| `pub_index_lag_seconds` | histogram | none | Outbox to index lag |
| `pub_idempotent_replay_total` | counter | none | Retry health |
| `pub_revision_conflict_total` | counter | none | Concurrency pressure (CTR-EVT) |

## Alerts
| Condition | Severity | Owner role |
|---|---|---|
| Hold rate > 25% of attempts over 1 h (ASSUMPTION) | warn | Trust and Safety Lead (F12) |
| Any PUB code > 5% of responses for 5 min (CTR-ERR BT-01) | page | Marketplace Lead (F01) |
| Risk timeout rate > 2% over 15 min | warn | Platform Lead (F15) |
| Email, phone or address pattern in publish logs | page; zero tolerance (CTR-PRV-001) | Privacy Lead (F10) |
| Held listing older than 72 h | warn | Trust and Safety Lead (F12) |
| Index lag p95 > 60 s over 15 min | warn | Platform Lead (F15) |

## Budgets and load
- Throughput target: 50 publish commits per second per regional shard (ASSUMPTION).
- Client-side: state change visible ≤ 1 s after response on a 4G profile (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: latency budgets above; load target above.
- PROVISIONAL (D05 default, unapproved): metrics and logs carry cell IDs only where permitted by CTR-PRV-001.
- PROVISIONAL (D07 default, unapproved): operational logs RET-OPS, 30 days maximum.

## Tests
- TEST-PS-004-08-01 (perf): load test at 50 commits/s meets R01 and R02 budgets.
- TEST-PS-004-08-02 (lint): metric label set contains no forbidden key (R04).
- TEST-PS-004-08-03 (log capture): publish with PII and price in title produces logs with neither (R05, CTR-PRV TEST-03).
- TEST-PS-004-08-04 (alert): injected PII pattern in a log line fires the page alert within 1 min.

## Acceptance criteria
1. Budgets in R01–R03 met in the seeded load run.
2. TEST-PS-004-08-02 and -03 pass in CI; zero forbidden labels or log fields.
3. Alerts in the table are wired and tested.
