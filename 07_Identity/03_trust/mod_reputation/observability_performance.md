# PS-058-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (lag), CTR-PRV-001 (log classes), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-08.R01 | Each input, recompute and public read emits counter and latency. | MVP |
| PS-058-08.R02 | `GetReputationBand` p95 ≤ 50 ms; recompute lag p95 ≤ 60 s. | MVP |
| PS-058-08.R03 | Logs carry `prf_id`, source and code; never counters, counterparty IDs or dispute details. | MVP |
| PS-058-08.R04 | No `prf_` or counterparty value as metric label. | MVP |
| PS-058-08.R05 | Alerts: drift > 0 in nightly check; input backlog > 15 min; `SELF_DEALING` > 0.5% per day. | MVP |
| PS-058-08.R06 | Band displayed with text equivalent and screen-reader label (WCAG 2.1 AA). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `repute_input_total` | counter | `source`, `result` |
| `repute_input_reject_total` | counter | `code` |
| `repute_recompute_lag_seconds` | histogram | none |
| `repute_drift_total` | counter | none |
| `repute_transition_total` | counter | `from`, `to` |
| `repute_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers PS-058-04 paths.

## States & transitions
Transitions per PS-058-03.

## Validation & errors
Code counters only.

## Authorization
Dashboards for F07 and F16; no per-subject views.

## Failure, idempotency, concurrency, offline
Input queue depth as aggregate only.

## Privacy, retention, abuse
Logs 30 days (RET-OPS); metrics 13 months aggregated; audit 12 months.

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 100 inputs/s peak; 1000 band reads/s (ASSUMPTION).
- Nightly full recompute completes in < 2 h for 1 M profiles (ASSUMPTION).

## Tests
- TEST-PS-058-08-01 (unit): counters once per input.
- TEST-PS-058-08-02 (privacy scan): no counters or identifiers in logs or metrics.
- TEST-PS-058-08-03 (load): 100 inputs/s and 1000 reads/s within budget.
- TEST-PS-058-08-04 (a11y): band text equivalent present.

## Acceptance criteria
1. Dashboards and alerts exist.
2. Redaction verified.
3. Budgets met.
4. No per-subject label anywhere.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- PROVISIONAL (D07 default, unapproved): log retention 30 days.
