# PS-045-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001 (R06 propagation, R05 budget).

**Decision labels:** D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-06.R01 | Query served from last published snapshot when refresh fails; snapshot age ≤ 30 min else `SYS.UNAVAILABLE` (503). | MVP |
| PS-045-06.R02 | Budget counters are not decremented on failed queries caused by server errors. | MVP |
| PS-045-06.R03 | Refresh is idempotent per cycle; partial refresh is rolled back. | MVP |
| PS-045-06.R04 | Budget store outage fails closed for region queries (`SYS.UNAVAILABLE`), never open. | MVP |
| PS-045-06.R05 | Listing count events replayed out of order are applied by revision, not timestamp (CTR-EVT-001 R02). | MVP |

## Data / schema
Snapshot record: `snapshot_id`, `created_at`, `cell_states[]` (cell ID, bucket).

## Commands / queries / events
Refresh and register retry-safe.

## States & transitions
Failures do not add cell states.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED`. Non-retryable: `PROXIM.*`.

## Authorization
System refresh job holds `cell.update` only through its scoped grant (PS-045-05).

## Failure, idempotency, concurrency, offline
- Refresh fails midway: snapshot not swapped; last snapshot served with `stale: true`.
- Budget store down: region queries 503; anonymous registry reads still served.
- Listing event replay: duplicates ignored by event ID.

## Privacy, retention, abuse
Failure logs hold codes and cell IDs only, never query inputs.

## Observability & budgets
`proximity_snapshot_age_seconds`, `proximity_refresh_failures_total`, `proximity_budget_store_errors_total`.

## Tests
- TEST-PS-045-06-01 (failure): refresh crash → stale snapshot served with flag.
- TEST-PS-045-06-02 (fail-closed): budget store down → 503 for region query.
- TEST-PS-045-06-03 (replay): duplicate listing event → one count change.
- TEST-PS-045-06-04 (out of order): revision 3 applied before 2 is held until 2 arrives.

## Acceptance criteria
1. No fail-open on budget (TEST-PS-045-06-02).
2. Snapshot age ≤ 30 min or 503 (R01).
3. Counts never double-applied.

## Assumptions & open decisions
- ASSUMPTION: 30-minute snapshot age limit.
- PROVISIONAL (D05 default, unapproved).
