# PS-012-08 — observability performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (log fields, `request_id`), CTR-PRV-001 (log classes), CTR-EVT-001 (event metrics).

**Decision label:** Latency and throughput targets are ASSUMPTION, unapproved; no monitoring tool is selected.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-08.R01 | Emit the metrics below per command and per state transition. | MVP |
| PS-012-08.R02 | Logs carry `counter_id`, `cyc_id`, `status`, `code`, `request_id`, module and timing only. Never `slot_terms`, `value_terms`, item refs or titles. | MVP |
| PS-012-08.R03 | Expiry sweep runs every 60 s; lag from `expires_at` to EXPIRED ≤ 120 s (ASSUMPTION). | MVP |
| PS-012-08.R04 | Counter writes do not block cycle reads; accept p95 must not exceed cycle read p95 by more than 100 ms (ASSUMPTION). | MVP |

## Metrics
| Metric | Type | Labels (no PII) | Alert |
|---|---|---|---|
| `counter_created_total` | counter | status_result, revision | Spike > 3× 7-day baseline |
| `counter_transition_total` | counter | from, to, reason | — |
| `counter_accept_quote_expired_total` | counter | — | > 5% of accepts in 1 h |
| `counter_invalidated_total` | counter | reason | Any `TARGET_CHANGED` burst > 50/min |
| `counter_depth_limit_total` | counter | — | Informational |
| `counter_expiry_lag_seconds` | histogram | — | p95 > 120 s |
| `counter_rate_limited_total` | counter | — | Per-actor repeats → F12 review (BT-01) |

## Budgets (ASSUMPTION)
| Operation | p95 target | Notes |
|---|---|---|
| `counter.create` | 300 ms | Server-side |
| `counter.accept` | 400 ms | Includes quote and item checks |
| `counter.list` (50 rows) | 200 ms | Indexed by `cyc_id`, `revision` |
| Sustained load | 50 creates/s | Peak, one region |

## Assumptions & open decisions
- ASSUMPTION: alerts route to the Marketplace Lead for transitions and to the Security Lead for abuse signals.
- D06 PROVISIONAL (D06 default, unapproved): counter metrics never count as receipts or verification.
- PENDING: metric naming under CTR-SCH-001 or F15 platform standard.
