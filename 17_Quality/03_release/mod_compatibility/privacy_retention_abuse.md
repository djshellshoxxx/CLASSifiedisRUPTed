# PS-142-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-07.R01 | Result records hold no device serial, advertising ID, IP address or user agent string beyond the coarse `client_platform` value. | MVP |
| PS-142-07.R02 | Lab device identifiers are replaced by lab slot IDs before storage. | MVP |
| PS-142-07.R03 | Compatibility results are `PUBLIC`; no test account data is stored. | MVP |

## Retention and abuse
- Result records: retained for the life of the release line plus 1 year (ASSUMPTION; D07 default, PROVISIONAL).
- Abuse: fake "supported" claims are blocked by R01 of PS-142-02 and by second approval.
- Scraping of matrix data: matrix is public for participants, no extra fields exposed.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-142-07-01 (privacy): result records contain no device serial, advertising ID or user agent string.
- TEST-PS-142-07-02 (unit): lab device identifiers are replaced by lab slot IDs before write.

## Acceptance criteria
1. TEST-PS-142-07-01, TEST-PS-142-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no real user data is used during compatibility testing.
- D07 default is PROVISIONAL (D07 default, unapproved).
