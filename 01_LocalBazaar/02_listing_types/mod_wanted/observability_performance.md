# PS-007-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R09 correlation), CTR-PRV-001 (R04 K_MIN, R09 logs), CTR-ERR-001 (R10 logs), CTR-CAP-001 (R13).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-08.R01 | Metrics emitted for every command, transition, projection, sweeper run, offline flush and abuse decision. | MVP |
| PS-007-08.R02 | Server p95: get ≤ 120 ms; create and update ≤ 250 ms; publish ≤ 400 ms (ASSUMPTION). | MVP |
| PS-007-08.R03 | Expiry lag p95 ≤ 120 s after `expires_at`. | MVP |
| PS-007-08.R04 | Scale: 200 000 published wanted posts per node; peak 300 writes per second (ASSUMPTION). | MVP |
| PS-007-08.R05 | Logs and traces redact content and raw owner IDs. Every request carries `correlation_id`. | MVP |
| PS-007-08.R06 | Telemetry failure never fails a command. | MVP |

## Data / schema
Metrics (no owner label, no title, no free text):

| Metric | Type | Labels |
|---|---|---|
| `wanted_command_total` | counter | `command`, `result` |
| `wanted_command_latency_seconds` | histogram | `command` |
| `wanted_transition_total` | counter | `from`, `to`, `event` |
| `wanted_projection_lag_seconds` | histogram | none |
| `wanted_expiry_lag_seconds` | histogram | none |
| `wanted_offline_flush_total` | counter | `result` |
| `wanted_abuse_decision_total` | counter | `decision` |
| `wanted_active_listings` | gauge | none (aggregate only, K_MIN applies) |

Allowed log fields: `request_id`, `correlation_id`, `lst_` ID, command, state, revision, reason code. Forbidden: title, description, budget, `owner_account_id`, raw `region_cell` per request.

## Commands / queries / events
No new commands. Metrics are emitted from the command path and the sweeper.

## States & transitions
Alert conditions reference transitions in PS-007-03.

## Validation & errors
Telemetry labels are validated against the enum lists above. Unknown labels are dropped.

## Authorization
Dashboards are restricted to operators with aggregate access. No per-owner or per-post dashboard.

## Failure, idempotency, concurrency, offline
Telemetry buffer is bounded; oldest entries drop first. Command path never blocks on telemetry.

## Privacy, retention, abuse
Aggregates published only when they meet K_MIN (CTR-PRV R04). Log retention RET-OPS (30 days).

## Observability & budgets
Alerts:
| Alert | Condition |
|---|---|
| Dead letter | any entry for 15 min |
| Expiry backlog | > 10 000 rows past `expires_at` |
| Projection lag | p95 > 60 s for 10 min |
| Invalid transitions | > 0.5% of commands over 15 min |
| Abuse review spike | > 3× 7-day median per hour |

## Tests
- TEST-PS-007-08-01 (unit): each metric emitted on each transition and command.
- TEST-PS-007-08-02 (load): 300 creates per second for 15 min; p95 within R02 budgets.
- TEST-PS-007-08-03 (integration): delayed sweeper triggers expiry-lag alert.
- TEST-PS-007-08-04 (log scan): cross-ref TEST-PS-007-07-05.
- TEST-PS-007-08-05 (chaos): telemetry sink down; commands still succeed.

## Acceptance criteria
1. Every metric in the table is exported and documented.
2. Load test meets R02 and R04 budgets.
3. Each alert in the table has a test that fires it.
4. No raw owner ID or content field appears in any metric label.

## Assumptions & open decisions
- D05 PROVISIONAL (Dxx default, unapproved): K_MIN aggregation for any region-level metric.
- ASSUMPTION: scale and latency numbers are placeholders until a load environment exists.
