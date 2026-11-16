# PS-008-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Platform Lead for telemetry, Marketplace Lead for owner). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (commit metrics), CTR-ERR-001 (error metrics), CTR-PRV-001 (log redaction).

**Decisions:** Budgets are ASSUMPTION (unapproved). Holds are not logged with holder refs (PROVISIONAL, D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-08.R01 | `hold.place` server p95 ≤ 250 ms; `availability.get` p95 ≤ 100 ms. | MVP |
| PS-008-08.R02 | Expiry job lag p95 ≤ 120 s (target run every 60 s). | MVP |
| PS-008-08.R03 | `avl_invariant_violations_total` is 0 in production; any non-zero value pages on-call. | MVP |
| PS-008-08.R04 | Logs contain IDs, enums and codes only. Redaction tests run on every log sink. | MVP |

## Metrics
| Metric | Labels | Purpose |
|---|---|---|
| `avail_hold_placed_total` | outcome, code | Demand and rejection mix |
| `avail_hold_terminal_total` | state (WITHDRAWN, EXECUTED, EXPIRED), reason | Hold lifecycle |
| `avail_units_gauge` | state (total, held, committed) | Aggregate counts, no listing labels |
| `avail_invariant_violations_total` | none | Must be 0 |
| `avail_reconciliation_mismatch_total` | none | Drift detector |
| `avail_hold_limit_hits_total` | limit (listing, holder) | Phantom-hold signal |
| `avail_commit_latency_ms` | command | p95 ≤ 150 ms (matches CTR-EVT-001 commit budget) |

## Alerts
- Invariant violation: page.
- Holder-limit hits above baseline by 3x for 15 min: ticket to Trust and Safety (PS-008-07).
- Expiry lag > 5 min: page.
- Single error code above 5% of responses for 5 min (CTR-ERR-001).

## Logging and redaction
Log fields: `availability_id`, `hold_id`, `command`, `code`, `request_id`, `duration_ms`. Forbidden: `holder_ref`, counts per listing, input values.

## Caching and client budgets
- Public count cache TTL 30 s (ASSUMPTION). UI shows "may be out of date" as text, not colour alone (WCAG).
- Client-side cached counts are cosmetic; server re-checks at `hold.place`.

## Tests
- TEST-PS-008-08-01 (budget): load test at 200 `hold.place`/s meets R01 p95 targets.
- TEST-PS-008-08-02 (metric): injected invariant break increments `avail_invariant_violations_total`.
- TEST-PS-008-08-03 (redaction): log capture during hold flow contains no `holder_ref`.
- TEST-PS-008-08-04 (alert): expiry lag injection triggers the lag alert.

## Acceptance criteria
1. Budgets in R01–R02 met in the load test (TEST-01).
2. TEST-PS-008-08-02 through -04 pass.
3. Zero holder refs in log sinks.

## Assumptions & open decisions
- ASSUMPTION: budgets above; 30 s cache TTL.
- PENDING: telemetry sink list (F15) and log retention (RET-OPS).
