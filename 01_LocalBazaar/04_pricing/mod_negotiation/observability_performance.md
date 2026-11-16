# PS-010-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 R09 (pseudonymous telemetry), CTR-ERR-001 (error metrics, R10 logging), CTR-EVT-001 (event audit), CTR-CAP-001 (decision metrics).

**Decision labels:** All p95 targets are ASSUMPTION values, unapproved.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-08.R01 | Every state transition increments `negotiation_transitions_total{from,to,event}`. | MVP |
| PS-010-08.R02 | Latency histograms exist for `neg.open`, `neg.counter`, `neg.accept` with p95 ≤ 300 ms and p99 ≤ 800 ms. | MVP |
| PS-010-08.R03 | Logs contain `negotiation_id`, `listing_id`, state, round, code, `request_id` only. Never amounts, currency codes, `acc_` IDs or `prf_` IDs. | MVP |
| PS-010-08.R04 | Gauges per state (`negotiation_active_gauge{state}`) carry no identifiers. | MVP |
| PS-010-08.R05 | Timer lag is measured as now minus due time for every overdue negotiation. | MVP |

## Data / schema
Metric label sets are closed: `from`, `to`, `event` ∈ state and command enums of [PS-010-03](workflow_state_machine.md); `code` ∈ CTR-ERR-001 registry for `NEG` and shared codes. No free-text label.

## Commands / queries / events
Audit: every transition is an event (CTR-EVT-001). Metrics are derived from events; they never read payloads.

## States & transitions
Not applicable. Alerts reference transitions by `from,to,event`.

## Validation & errors
`negotiation_error_responses_total{code}` plus `error_unknown_code_total` from CTR-ERR-001. Rejected writes are counted, not logged with bodies.

## Authorization
Metrics endpoints are operator-scope read with no `neg_` IDs. Decision metrics from CTR-CAP-001 are filtered to `negotiation.*`.

## Failure, idempotency, concurrency, offline
Metrics pipeline outage must not block commands (fire-and-forget export with bounded buffer, ASSUMPTION). Client-side offline queue depth is reported as an aggregate count only.

## Privacy, retention, abuse
Telemetry is RET-OPS (30 days). No per-user series. Counts below K=5 per listing are suppressed from dashboards (CTR-PRV-001 R04 analogy, ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| `neg.open` / `neg.counter` / `neg.accept` p95 | ≤ 300 ms |
| `neg.list` (50 items) p95 | ≤ 250 ms |
| Expiry lag p95 | ≤ 120 s; alert at > 300 s |
| Idempotent replay ratio | monitored; alert on sudden > 20% spike |
| `NEG.TERMS_OUT_OF_BOUNDS` share | alert if > 10% of counters for 1 h |

Alerts:
- Any transition into `AGREED` without a `terms_hash` (must be 0).
- Any accept committed with listing version ≠ snapshot (must be 0).
- Timer lag > 300 s.
- Initiator opens > 5 negotiations in 1 h (abuse signal, see PS-010-07).

## Tests
- TEST-PS-010-08-01 (metrics): every transition in the table increments exactly one counter series.
- TEST-PS-010-08-02 (latency): load test at 50 rps mixed commands meets p95 and p99 budgets.
- TEST-PS-010-08-03 (log redaction): log capture during command suite contains no amount, currency code, `acc_` or `prf_`.
- TEST-PS-010-08-04 (labels): metric label values are members of closed enums; no unbounded label.
- TEST-PS-010-08-05 (alerts): forced transition without `terms_hash` triggers the must-be-zero alert.

## Acceptance criteria
1. Budgets above measured in CI load profile before any production claim (future gate).
2. Log capture passes redaction (TEST-PS-010-08-03).
3. TEST-PS-010-08-01 through -05 pass.

## Assumptions & open decisions
- ASSUMPTION: p95 and p99 targets above; 50 rps profile.
- ASSUMPTION: K=5 suppression on listing-level dashboards.
- Related: D08 (offline queue depth reporting), no D decision blocks this process.
