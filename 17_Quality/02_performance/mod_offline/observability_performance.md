# PS-140-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (log fields), CTR-PRV-001 (log redaction).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-08.R01 | Every scenario has a budget row; a scenario without `budget_ref` cannot be activated. | MVP |
| PS-140-08.R02 | Harness exports metrics per run: `duration_ms`, `reconnect_to_sync_ms`, `replayed_writes`, `conflicts_surfaced`. | MVP |
| PS-140-08.R03 | Log lines use an allowlist of fields; any other field is dropped before write. | MVP |

## Budgets
| budget_ref | Metric | Target (ASSUMPTION) |
|---|---|---|
| BUD-OFF-01 | Reconnect to sync complete, reference profile, 50 queued writes | p95 ≤ 5 s |
| BUD-OFF-02 | Run record write latency | p95 ≤ 300 ms |
| BUD-OFF-03 | Infra-aborted runs per week | ≤ 2% of runs |
| BUD-OFF-04 | Assertion pass rate, release candidate | 100% of MVP scenarios |

## Metrics, logs and alerts
- Dashboard: pass rate per build, p95 per budget, flake rate per scenario.
- Alert: BUD-OFF-03 breached for two consecutive days notifies QA Lead.
- Redaction: scenario keys and assertion codes only; no fixture bodies, no tokens (CTR-PRV-001).

## Assumptions & open decisions
- ASSUMPTION: budget values are for a named reference device profile, not for all devices; the profile is defined in the reference-device list (open).
- No Dxx governs budgets directly; D05 applies only if any location-based scenario is added: PROVISIONAL (D05 default, unapproved).
