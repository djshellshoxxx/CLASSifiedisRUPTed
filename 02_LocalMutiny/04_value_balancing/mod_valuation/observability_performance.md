# PS-027-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-08.R01 | `valuation.compute` p95 ≤ 100 ms server side for 16 items (ASSUMPTION). | MVP |
| PS-027-08.R02 | Snapshot-to-STALE propagation p95 ≤ 5 s (PS-027-03 R02). | MVP |
| PS-027-08.R03 | Logs: `code`, `request_id`, module, timing only (CTR-ERR-001 R10). No values, currencies, item refs or `acc_` IDs. | MVP |
| PS-027-08.R04 | Dashboards show counts by state, code and currency pair class (fiat or asset), never by amount range or party. | MVP |

## Data / schema
Allowed metric labels: `state`, `code`, `action`, `currency_kind`. Forbidden: `acc_`, `cyc_`, `par_`, `code_value`, amounts.

## Commands / queries / events
Each command emits a span with `request_id` and `correlation_id` (`cor_`).

## States & transitions
State metrics from PS-027-03.

## Validation & errors
`value_validation_rejections_total{code}`.

## Authorization
Operator dashboards: `ope` read with purpose `operations`; no snapshot content.

## Failure, idempotency, concurrency, offline
Telemetry is best-effort; it never blocks compute. Client offline queue depth reported as an aggregate count.

## Privacy, retention, abuse
Telemetry kept 30 days (ASSUMPTION). Trace attribute allowlist. Advisory-signal volume per day monitored for false-positive spikes.

## Observability & budgets
| Metric | Target |
|---|---|
| `valuation_compute_latency_seconds` p95 | ≤ 0.1 s |
| `valuation_stale_lag_seconds` p95 | ≤ 5 s |
| `valuation_partial_write_total` | 0 |
| 5xx rate on compute | ≤ 0.1% |

## Tests
- TEST-PS-027-08-01 (unit): log formatter drops disallowed fields.
- TEST-PS-027-08-02 (load): 100 computes per second for 10 min meet R01.
- TEST-PS-027-08-03 (lint): metric label set contains no forbidden label.

## Acceptance criteria
1. Budgets measured in staging before release gate (future phase).
2. Log sample of 10,000 lines contains zero monetary values.
3. Alert defined for partial-write metric > 0.

## Assumptions & open decisions
- ASSUMPTION: starting budgets, revisited after load tests.
- Related: quote and rounding metrics owned by F09.S03 (see [DECISIONS.md](../../../DECISIONS.md) D03).
