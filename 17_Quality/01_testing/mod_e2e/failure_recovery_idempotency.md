# PS-134-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-06.R01 | Infrastructure failure (errored) re-run once automatically; assertion failure (failed) never re-run | MVP |
| PS-134-06.R02 | Each step timeout 15 s; scenario timeout = max_duration_s | MVP |
| PS-134-06.R03 | Fixture reset to content_hash-identical snapshot before each run; reset failure marks run errored | MVP |
| PS-134-06.R04 | Offline-to-online scenarios (messages, offers, sync) use controlled network emulation and assert the pending state before reconnect | MVP |

## Data / schema
Recovery uses run_id, commit, environment. Snapshot reference `fixture_set_id` + `content_hash`.

## Commands / queries / events
RunScenario and RecordResult retry-safe per PS-134-04.

## States & transitions
Per PS-134-03 (errored to queued once).

## Validation & errors
`E2E.RESET_FAILED` (retryable: yes, once), `E2E.TIMEOUT` (retryable: once if environment errored), `E2E.ENV_UNAVAILABLE` (retryable: yes after 10 min).

## Authorization
Re-runs initiated by CI identity only.

## Failure, idempotency, concurrency, offline
- Retry policy: one automatic re-run for errored; no retry for failed.
- Concurrency: parallel runs use separate ephemeral environments; no shared mutable fixture.
- Offline: scenarios that test pending queues wait for the relay acknowledgment step (D08 PROVISIONAL) before asserting "sent"; they must not treat a local success message as delivery.
- Partial failure of a multi-party scenario leaves environment discarded, not repaired.

## Privacy, retention, abuse
Reset logs contain snapshot IDs only.

## Observability & budgets
Errored rate per flow; re-run success rate (target >= 80%, ASSUMPTION).

## Tests
- TEST-PS-134-06-01 (integration): kill browser mid-scenario; run becomes errored; one re-run occurs.
- TEST-PS-134-06-02 (integration): assertion failure never re-run (run count = 1).
- TEST-PS-134-06-03 (e2e): offline-compose then reconnect; "sent" appears only after relay ack in fixture.

## Acceptance criteria
1. Retry counts match policy in all fixture runs.
2. Fixture reset verified byte-identical by content_hash before each run.
3. Offline scenarios fail if local success is shown without relay ack.

## Assumptions & open decisions
- ASSUMPTION: ephemeral environments are available within 10 minutes.
- D08 PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
