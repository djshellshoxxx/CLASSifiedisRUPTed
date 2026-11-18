# PS-140-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (data classes, retention), CTR-ERR-001 (diagnostics), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-07.R01 | All fixtures are synthetic. CI scan blocks merge on any real account ID, email, phone number, coordinate or address pattern. | MVP |
| PS-140-07.R02 | Records carry `max_data_class` = `PUBLIC`. No `PRIVATE_PERSONAL`, `FINANCIAL_EVIDENCE` or `LOCATION_PRECISE` value may appear. | MVP |
| PS-140-07.R03 | Run logs hold scenario key, outcome, duration and assertion codes only. No request bodies, tokens or device identifiers. | MVP |
| PS-140-07.R04 | Harness refuses any endpoint not on the staging allowlist; production targets return a refusal, not a test run. | MVP |

## Data / retention
| Data | Class | Retention default | Legal hold |
|---|---|---|---|
| Scenario definitions | PUBLIC | retained while not retired, then 1 year | yes |
| Run records | PUBLIC | 180 days (D07 default, PROVISIONAL) | yes, while referenced by an open gate |
| Runner logs | PUBLIC | 30 days | no |

Deletion propagates to exports and caches within 24 h (CTR-PRV-001 ASSUMPTION).

## Abuse controls
- Misuse: a maintainer could point the harness at real user data. Control: R01 and R04; allowlist changes need second approval.
- Log flooding by a runner: rate-limited to 1,000 records per run (ASSUMPTION).
- Scenario tampering to pass a gate: versions are immutable and the gate stores the scenario version it read.

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
- TEST-PS-140-07-01 (privacy): fixture scan finds no email, coordinate or account ID pattern.
- TEST-PS-140-07-02 (negative): harness pointed at a non-allowlisted host refuses to run.

## Acceptance criteria
1. TEST-PS-140-07-01, TEST-PS-140-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no real user data will ever be needed to test offline behavior; if it is, a separate privacy review is required.
- D07 (retention) default is PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
