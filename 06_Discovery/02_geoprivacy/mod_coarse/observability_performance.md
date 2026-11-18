# PS-047-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04, R09), CTR-ERR-001 (R10).

**Decision labels:** Budgets ASSUMPTION (F15 to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-08.R01 | Metrics: `coarse_recompute_duration_s`, `coarse_last_success_age_s`, `coarse_cells_by_state`, `coarse_publication_flips_total`. | MVP |
| PS-047-08.R02 | Recompute p95 ≤ 60 s for 100 000 indexed items. | MVP |
| PS-047-08.R03 | Labels never include item counts or cell codes with counts below K_MIN. | MVP |
| PS-047-08.R04 | Alert when last successful recompute > 15 min old. | MVP |

## Data / schema
Metric labels: `state`, `outcome` only. Cell code appears only as aggregate, not per-cell label.

## Commands / queries / events
Trace per recompute window.

## States & transitions
Not applicable beyond PS-047-03.

## Validation & errors
Error counter by code.

## Authorization
Dashboards restricted to Platform Lead and F10 roles.

## Failure, idempotency, concurrency, offline
Metrics outage does not block recompute.

## Privacy, retention, abuse
Metrics 30 days (RET-OPS). Flip counts aggregated daily.

## Observability & budgets
Recompute p95 ≤ 60 s at 100 000 items; query path unaffected (read cached flags).

## Tests
- TEST-PS-047-08-01 (load): recompute at 100 000 items within budget.
- TEST-PS-047-08-02 (unit): metric label allowlist.
- TEST-PS-047-08-03 (integration): alert at 15 min stale.

## Acceptance criteria
1. Four metrics defined and documented.
2. Load budget met on reference profile (PENDING F15).
3. No metric label contains a count.

## Assumptions & open decisions
- ASSUMPTION: reference profile undefined (PENDING F15).
