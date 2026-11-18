# PS-124-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-07.R01 | Subject bucketing uses a keyed pseudonymous subject key derived from the `acc_` ID; raw identifiers and attributes are never bucket input. | MVP |
| PS-124-07.R02 | Attribute allow-list: `tenant_id`, `app_version`, `platform`, `locale`, `region_cell` (LOCATION_COARSE, K_MIN applies). Any LOCATION_PRECISE attribute is refused. | MVP |
| PS-124-07.R03 | Allow-list is versioned and changes require F10 review (CTR-PRV-001 R10 analog). | MVP |
| PS-124-07.R04 | Flag evaluation logs record flag key, result and source only; attribute values are not logged. | MVP |
| PS-124-07.R05 | Offline clients cache evaluated values only (not rules) for <= 24 h; cache is cleared on logout (CTR-PRV-001). | MVP |
| PS-124-07.R06 | Targeting by protected characteristics is forbidden (OPEN, F10 to list categories). | MVP |

## Data / schema
Retention: flag definitions RET-AUD; evaluation counters RET-OPS (30 days, no identifiers).

## Commands / queries / events
None beyond PS-124-04.

## States & transitions
Not applicable.

## Validation & errors
`FLAG.FORBIDDEN_ATTRIBUTE` (PS-124-02).

## Authorization
See PS-124-05.

## Failure, idempotency, concurrency, offline
Cached values are not authorization (CTR-CAP-001 failure section).

## Privacy, retention, abuse
Abuse: attempts to probe rollout membership by changing attributes. Mitigated by coarse attributes, and by rate limits on `flag.evaluate` (`SYS.RATE_LIMITED`).

## Observability & budgets
No identifiers in metrics.

## Tests
- TEST-PS-124-07-01 (negative): LOCATION_PRECISE attribute refused.
- TEST-PS-124-07-02 (log scan): evaluation logs contain no attribute values.
- TEST-PS-124-07-03 (abuse): 1,000 evaluations with varied attributes rate-limited.
- TEST-PS-124-07-04 (offline): cache cleared on logout; rules never cached on device.

## Acceptance criteria
1. No raw identifiers used for bucketing (TEST-01).
2. TEST-PS-124-07-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D05 default): coarse regions only.
- OPEN (F10): protected-characteristic list for R06.
