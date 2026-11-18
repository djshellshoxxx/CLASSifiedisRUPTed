# PS-121-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-10.R01 | No raw telemetry export to parties outside the platform. Support exports follow PS-121-07 R06. | MVP |
| PS-121-10.R02 | Telemetry is not part of platform backup scope (PS-120); it is rebuilt from emitters after restore. | MVP |
| PS-121-10.R03 | Rule and schema changes are rolled back by re-publishing the previous rule version (PS-121-01 R03). | MVP |
| PS-121-10.R04 | Schema changes follow CTR-SCH-001 change classes. | MVP |

## Data / schema
Rule export: alert rule versions as JSON with digest (no identifiers).

## Commands / queries / events
Rollback: `alert_rule.create` with previous body and new version.

## States & transitions
Not applicable.

## Validation & errors
Rule import refuses unknown metrics (`OBSERV.METRIC_UNKNOWN`).

## Authorization
Rule export needs `alert_rule.administer` for `ope`.

## Failure, idempotency, concurrency, offline
Rollback idempotent on rule digest.

## Privacy, retention, abuse
Rule exports contain no identifiers.

## Observability & budgets
Rollback completes in <= 5 min (ASSUMPTION).

## Tests
- TEST-PS-121-10-01 (rollback): rule rollback restores prior behavior in staging.
- TEST-PS-121-10-02 (negative): export contains no identifiers.
- TEST-PS-121-10-03 (restore): after backup restore, telemetry gap is documented, not back-filled.
- TEST-PS-121-10-04 (migration): old rule version readable.

## Acceptance criteria
1. No raw telemetry export path exists.
2. TEST-PS-121-10-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: telemetry is not restored from backups.
