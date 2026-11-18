# PS-090-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07), CTR-SCH-001 (R10), CTR-FED-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-07.R01 | Migration never raises a data class without F10 review (PS-090-02.R03). | MVP |
| PS-090-07.R02 | Run records and reports hold IDs, versions and counts; no record content. | MVP |
| PS-090-07.R03 | Run records retained 3 years for audit (ASSUMPTION), subject to legal hold (CTR-PRV-001 R07). | MVP |
| PS-090-07.R04 | Abuse: planning more than 3 migrations per month per operator raises alert (ASSUMPTION). | MVP |

## Data / schema
Run records PSEUDONYMOUS (operator refs).

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Retention purge is outside the run state machine.

## Validation & errors
`SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW` (PS-090-02).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Purge job idempotent per run.

## Privacy, retention, abuse
Retention above; abuse alert above; no content in reports.

## Observability & budgets
Alert on R04.

## Tests
- TEST-PS-090-07-01 (privacy): class raise without review blocked.
- TEST-PS-090-07-02 (report): dry-run report contains no record content.
- TEST-PS-090-07-03 (abuse): fourth plan in a month alerts.

## Acceptance criteria
1. Class raise blocked.
2. Reports content-free.
3. Abuse alert tested.

## Assumptions & open decisions
- ASSUMPTION: 3-year run retention; 3 plans per month.
- PROVISIONAL (D07 default, unapproved).
