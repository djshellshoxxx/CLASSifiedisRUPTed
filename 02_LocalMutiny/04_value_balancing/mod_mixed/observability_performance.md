# PS-026-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-08.R01 | Server p95 latency: `mixed.leg.declare` ≤ 300 ms; `mixed.leg.list` ≤ 150 ms (ASSUMPTION). | MVP |
| PS-026-08.R02 | Gap-balance check (PS-026-02 R04) for 8 legs ≤ 5 ms p95. | MVP |
| PS-026-08.R03 | Logs record `code`, `request_id`, module and timing only (CTR-ERR-001 R10). No amounts, currencies, descriptions or `acc_` IDs. | MVP |
| PS-026-08.R04 | Dashboards show counts by leg `kind` only, never by party or amount range. | MVP |

## Data / schema
Metric labels allowed: `kind`, `code`, `from_state`, `to_state`, `action`. Forbidden labels: `acc_`, `cyc_`, `amount`, `currency`.

## Commands / queries / events
Each command emits a trace span with `request_id` and `correlation_id` (`cor_`, CTR-ID-001).

## States & transitions
Metrics for transitions are in PS-026-03; stuck-leg alert defined there.

## Validation & errors
Metric `mixed_validation_rejections_total{code}` counts CTR-ERR codes.

## Authorization
Dashboards require `ope` read with purpose `operations`; no content access.

## Failure, idempotency, concurrency, offline
Telemetry is best-effort and never blocks a command. Client-side offline queue depth is reported as an aggregate count only.

## Privacy, retention, abuse
Telemetry retained 30 days (ASSUMPTION). Trace attributes are scrubbed by an allowlist. Anomaly alerts on declaration volume per cycle go to F12 as counts.

## Observability & budgets
| Metric | Target |
|---|---|
| `mixed_declare_latency_seconds` p95 | ≤ 0.3 s |
| `mixed_queue_pending_age_seconds` p95 | ≤ 1 h |
| `mixed_leg_unattested_total` | alert on rise > 3× 7-day baseline |
| Error rate (5xx) | ≤ 0.1% of commands |

## Tests
- TEST-PS-026-08-01 (unit): log formatter drops any field outside the allowlist.
- TEST-PS-026-08-02 (load): 200 declares per second for 10 min meet R01 p95.
- TEST-PS-026-08-03 (lint): metric label set contains no forbidden label.

## Acceptance criteria
1. Budgets in the table are measured in staging before release gate (future phase).
2. Log scan finds zero amounts or `acc_` IDs in a sample of 10,000 lines.
3. Alert rules exist for stuck legs and queue age.

## Assumptions & open decisions
- ASSUMPTION: performance budgets are starting values, to be revised after load tests.
- Related: D08 offline queue (PROVISIONAL default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
