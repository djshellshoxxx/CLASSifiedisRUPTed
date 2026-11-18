# PS-086-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10 server logs), CTR-PRV-001 (R09 telemetry), CTR-FED-001 (R10–R11 limits; R06 equivocation), CTR-EVT-001 (R12 payload limits).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-08.R01 | Metrics: `fed_conflict_detected_total{kind}`, `fed_conflicts_open{kind}`, `fed_hold_queue_depth{origin}`, `fed_hold_expired_total`, `fed_conflict_transitions_total{from,to}`, `fed_conflict_read_total{principal_type,field_class}`. No personal data in labels. | MVP |
| PS-086-08.R02 | Budgets (ASSUMPTION, reference runner): detection p95 ≤ 5 ms per event on cache hit; equivocation transaction p95 ≤ 50 ms; lock wait p95 ≤ 100 ms. | MVP |
| PS-086-08.R03 | Alerts: any new `equivocation` → page federation steward within 5 min. Any gap hold older than 1 h → warning. Hold queue > 80% of cap → warning. | MVP |
| PS-086-08.R04 | Logs are structured JSON with IDs and codes (PS-086-07 R05). | MVP |
| PS-086-08.R05 | Dashboards show open conflicts by `kind` and age. Age buckets: < 1 h, < 24 h, ≥ 24 h. | MVP |

## Data / schema
Metric and log schemas registered PENDING CTR-SCH-001.

## Validation & errors
Each code in PS-086-02 has a counter; unknown codes are logged as `unknown` and counted.

## Authorization
Dashboards are restricted to stewards (PS-086-05).

## Failure, idempotency, concurrency, offline
Telemetry failure does not change detection outcomes (fail open for telemetry only).

## Privacy, retention, abuse
Telemetry follows CTR-PRV-001 R09. Logs follow RET-OPS.

## Observability & budgets
This file is the source of budgets for PS-086-02, -03 and -06. No UI in this module; operator views belong to F15. Accessibility not applicable.

## Tests
- TEST-PS-086-08-01 (perf): detection p95 ≤ 5 ms on reference runner (ASSUMPTION).
- TEST-PS-086-08-02 (unit): label sets contain only allowed fields.
- TEST-PS-086-08-03 (integration): injected equivocation raises the page alert within 5 min.
- TEST-PS-086-08-04 (integration): gap hold older than 1 h raises warning.

## Acceptance criteria
1. Budgets measured in CI; TEST-PS-086-08-01 passes.
2. Labels clean; TEST-PS-086-08-02 passes.
3. Alerts fire as specified; TEST-PS-086-08-03 and -04 pass.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: budgets above (F15 to confirm).
- PENDING CTR-SCH-001: metric and log schema IDs.
