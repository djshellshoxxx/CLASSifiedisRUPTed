# PS-146-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-08. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [13_Notifications](../../../13_Notifications); [15_Platform](../../../15_Platform); [17_Quality](../../../17_Quality). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-08.R01: Business outcome. Operators can see whether policy evaluation is fast, correct and available; reviewers can see whether their queue is within its due window; and nothing in telemetry reveals personal data or prohibited wording.
- Exclusions: dashboards and alert routing implementation (F15); accessibility of the reviewer UI (F14); load-test tooling (F17).
- Scope: evaluate endpoint, catalogue activation, re-evaluation, hold queue, outbox.

## Performance budgets
| Operation | Budget | Measured at |
|---|---|---|
| `prohibited.decision.evaluate` server p95 | <= 150 ms | server, excluding caller network |
| `prohibited.decision.evaluate` server p99 | <= 400 ms | server |
| evaluate caller end-to-end p95 (same region) | <= 300 ms | caller span |
| `prohibited.policy_version.get_active_public` p95 | <= 50 ms (cached, 60 s TTL) | server |
| `prohibited.hold.list_open` p95 (page of 25) | <= 250 ms | server |
| Activation (2000 rules, 20000 terms, automaton build) | <= 5 s | server |
| Re-evaluation throughput | >= 200 subjects per second per worker; 50000 subjects complete in <= 4 h at 2 workers | scheduler |
| Aho-Corasick match on 4000-character input | <= 1 ms p95 | in-process |

- PS-146-08.R02: Budgets are gates for performance tests (contract_and_acceptance_tests.md TEST-PS-146-08-T01 to T03).
- PS-146-08.R03: Caching: the active version and its automaton are loaded per instance at activation time; no per-request database read for rules.

## Error and availability budgets
- Error rate (5xx and PROHIBITED_TIMEOUT over all evaluate requests): <= 0.1 percent over 5 minutes.
- Availability of evaluate: >= 99.9 percent per month (fail-closed downtime still counts as unavailable).
- Expected 4xx rate from validation: report only; alert if sustained above 5 percent for 15 minutes (indicates a caller regression).
- Hold SLA: 95 percent of holds resolved or escalated by due_at. Escalation scheduler lag <= 60 s.
- Outbox lag: 99 percent of events delivered within 30 s.

## Metrics
| Metric | Type | Labels (no personal data) |
|---|---|---|
| `prohibited_evaluate_requests_total` | counter | checkpoint, subject_type, outcome, error_code |
| `prohibited_evaluate_latency_seconds` | histogram | checkpoint, outcome |
| `prohibited_match_rule_hits_total` | counter | rule_code, default_action |
| `prohibited_no_active_policy_total` | counter | none |
| `prohibited_hold_open_gauge` | gauge | status |
| `prohibited_hold_overdue_gauge` | gauge | none |
| `prohibited_reevaluation_changed_total` | counter | policy_version_id (number, not content) |
| `prohibited_outbox_lag_seconds` | histogram | event_name |
| `prohibited_idempotency_conflicts_total` | counter | caller_service_id |

Rule-hit metrics use rule_code, which is a catalogue identifier, not subject content.

## Log fields
Every log line is JSON with fields: `ts` (UTC ms), `level`, `event` (e.g. `decision.recorded`), `request_id`, `policy_version_id`, `decision_id`, `hold_id`, `checkpoint`, `subject_type`, `subject_ref` (HMAC-SHA-256 of subject_id with logging key, truncated to 16 hex characters), `outcome`, `rule_codes`, `error_code`, `latency_ms`, `caller_service_id`, `actor_role`, `schema_version`.

Forbidden in logs: title, description, match_terms, structured_flag values, reviewer_note, raw subject_id, account identifiers, IP addresses, precise location, tokens or credentials.

- PS-146-08.R04: A log-scrubbing test (TEST-PS-146-08-T04) fails the build if a fixture containing sentinel strings in each forbidden field appears in captured output.
- PS-146-08.R05: Tracing: spans carry request_id and decision_id, never subject text. Trace sampling is 10 percent of successful evaluate requests and 100 percent of errors.

## Alerts (initial)
| Alert | Condition | Severity |
|---|---|---|
| Evaluate fail-closed | `prohibited_no_active_policy_total` > 0 for 1 minute | page |
| Evaluate latency | p99 > 400 ms for 10 minutes | ticket |
| Error budget | error rate > 0.1 percent for 5 minutes | page |
| Hold overdue | `prohibited_hold_overdue_gauge` > 0 for 60 minutes | ticket |
| Outbox lag | p99 > 30 s for 10 minutes | page |
| Abuse signal | single actor with 20 or more HOLD/BLOCK outcomes in 24 hours | ticket |

## Open decisions
- A-prohibited-04 (log field classes pending CTR-PRV-001), A-prohibited-07 (72 h hold window drives overdue alert), A-prohibited-12 (re-evaluation throughput target).
- Budgets are proposed defaults and need validation at load test in 17_Quality; no measured values exist yet.
