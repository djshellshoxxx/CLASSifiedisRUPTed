# PS-140-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency keys), CTR-ERR-001 (retry rules).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-06.R01 | Scenario run timeout is 30 minutes (ASSUMPTION); on timeout the run ends `aborted_infra`. | MVP |
| PS-140-06.R02 | Infrastructure failures retry at most 2 times with backoff of 30 s then 120 s (ASSUMPTION). | MVP |
| PS-140-06.R03 | Assertion failures are never retried automatically; a retry hides flakiness. | MVP |
| PS-140-06.R04 | Re-sending `RecordOfflineRun` with the same key and payload returns the original record; same key with a different payload returns `SYS.CONFLICT`. | MVP |
| PS-140-06.R05 | Runner buffers at most 50 unsent run records (ASSUMPTION) and flushes them in attempt order. | MVP |

## Failure, idempotency, concurrency, offline
- **Flake handling:** a run that passes after an infra retry is recorded as its own attempt. Its outcome is `pass` with `attempt` > 1, and the attempt history is kept. It is never silently merged.
- **Concurrent runners** for the same scenario and build: attempt numbers are allocated with `expected_revision`; the loser receives `SYS.CONFLICT` and re-reads.
- **Scenario retired mid-run:** the run completes against the pinned `scenario_version`.
- **Offline runner:** a runner that cannot reach the CI API keeps records in its local buffer and does not mark runs complete locally.
- **Clock:** timeouts use monotonic time in the harness, so the clock-skew scenario does not alter test timers.

## Validation & errors
Retryable codes: `SYS.UNAVAILABLE` (503). Non-retryable: `OFFTEST.*`, `SYS.CONFLICT`. Retry uses the same `idempotency_key` (CTR-ERR-001 TEST-07 rule).

## Tests
- TEST-PS-140-06-01 (unit): same key and payload returns original record; same key and different payload returns SYS.CONFLICT.
- TEST-PS-140-06-02 (integration): run exceeding 30 minutes ends aborted_infra; no partial assertion set published.
- TEST-PS-140-06-03 (integration): infra failure retried twice then recorded; assertion failure never retried.
- TEST-PS-140-06-04 (offline): runner buffer of 50 records flushes in attempt order after network returns.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Acceptance criteria
1. the tests above pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: timeout and retry values are defaults for the reference runner only.
- D08 (offline writes) governs production queues, not test runners: PROVISIONAL (D08 default, unapproved).
