# PS-048-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R09), CTR-ERR-001 (R06, R10).

**Decision labels:** Budgets ASSUMPTION (F15).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-08.R01 | Metrics: `location_set_total{source,outcome}`, `location_withdraw_to_clear_s`, `location_validation_reject_total{code}`. | MVP |
| PS-048-08.R02 | `location.cell.set` p95 ≤ 150 ms server-side. | MVP |
| PS-048-08.R03 | Telemetry from client includes no coordinate, accuracy value or geocode result. | MVP |
| PS-048-08.R04 | Any server log containing a `lat`/`lon`-named key triggers a privacy alert (log scanner). | MVP |

## Data / schema
Labels: `source`, `outcome`, `code` only.

## Commands / queries / events
Trace ID per command with no body logging.

## States & transitions
Not applicable.

## Validation & errors
Error counts by code.

## Authorization
Dashboards: Platform Lead and F10 only.

## Failure, idempotency, concurrency, offline
Telemetry buffered locally on client without coordinates.

## Privacy, retention, abuse
Metrics 30 days (RET-OPS).

## Observability & budgets
Set p95 ≤ 150 ms; withdraw-to-clear p95 ≤ 60 s.

## Tests
- TEST-PS-048-08-01 (unit): telemetry schema rejects coordinate keys.
- TEST-PS-048-08-02 (integration): log scanner flags injected `lat` key.
- TEST-PS-048-08-03 (load): 200 set/s p95 ≤ 150 ms.

## Acceptance criteria
1. Metrics defined.
2. Log scanner in CI and staging.
3. Budgets met on reference profile (PENDING F15).

## Assumptions & open decisions
- ASSUMPTION: reference profile PENDING F15.
