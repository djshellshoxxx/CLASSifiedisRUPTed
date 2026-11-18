# PS-148-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-06. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F15 platform (outbox relay, scheduler, gateway timeouts), F13 notifications (event consumer), F12 moderation and [mod_governance](../mod_governance/SPEC.md) (source record references), public web client (retry behaviour); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Define how the module behaves when requests are retried, when dependencies fail, when two actors race, and when a multi-step change is interrupted. The rule throughout: a client must never be told a change is complete unless the database commit is confirmed, and a retry must never publish twice or lose an acknowledged change.

Exclusions: infrastructure-level failover (F15); offline queueing in the PWA (D08, handled by the client as pending until server acknowledgement).

## Requirements
- PS-148-06.R01: Business outcome: a publication either completes fully or leaves the record in its prior state, with a clear error and no duplicate public content. Actors: author, reviewer, scheduler, outbox relay, consumers.
- PS-148-06.R02: Cases: client retry after a network timeout; duplicate command arriving during the first command's transaction; relay crash after commit; consumer redelivery; freeze job crash mid-snapshot; approval racing with withdrawal; source record deleted after submit; dependency outage (identity, store, outbox).
- PS-148-06.R03: Recovery budgets are operational targets, not user-visible animations. Clients show a pending label and never a success message until a response with `state` is received. Latency budgets: PS-148-08.R05.
- PS-148-06.R04: Retry policy for clients (A-TRANSPARENCY-08): at most 5 attempts; base delay 500 ms; factor 2; full jitter; cap 8 seconds; retry only on codes marked retryable in PS-148-02, always with the same `idempotency_key` and the same body. Total retry window is 30 seconds, after which the client shows "not confirmed, check status".
- PS-148-06.R05: Timeouts (A-TRANSPARENCY-09): server command hard timeout 5 seconds, query hard timeout 2 seconds, gateway timeout 6 seconds for commands. A command that exceeds the server timeout after commit still returns the stored response on retry. Public read cache TTL is at most 60 seconds, so a publication is visible to the public within 60 seconds of commit; withdrawal purges caches immediately where the CDN supports it.
- PS-148-06.R06: Idempotency record: (actor_ref, command, idempotency_key) stores request_hash and response_snapshot for 72 hours (A-TRANSPARENCY-07). Same key and same hash returns the stored response with HTTP 200 and header `Idempotent-Replayed: true`. Same key and different hash returns TRANSPARENCY_IDEMPOTENCY_KEY_REUSED.
- PS-148-06.R07: Commit-time checks: the capability grant (PS-148-05.R06), the state guard and the `expected_revision` are all re-checked inside the transaction that writes the state change.
- PS-148-06.R08: Partial failure: each command is one database transaction covering state change, audit row, idempotency record and outbox row. Freeze computes the snapshot and content hash in the same transaction; a failure leaves the report PREPARING.

## Retry and idempotency behaviour
| Situation | Server response | Client action |
|---|---|---|
| Same key, same body, first call still running | waits up to the server timeout, then TRANSPARENCY_TIMEOUT (retryable) | retry with same key |
| Same key, same body, first call committed | stored response, `Idempotent-Replayed: true` | use response |
| Same key, different body | TRANSPARENCY_IDEMPOTENCY_KEY_REUSED (409, not retryable) | generate new key only after reviewing the change |
| Stale expected_revision | TRANSPARENCY_REVISION_CONFLICT (409, retryable) | re-read the entry, merge, submit with new revision |
| Dependency unavailable before commit | TRANSPARENCY_UNAVAILABLE (503, retryable) | retry with same key |
| Commit outcome unknown | TRANSPARENCY_TIMEOUT or connection reset | retry with same key; the stored result is authoritative |

## Concurrency conflicts
- Optimistic concurrency via `revision` on every write. The lock order for an entry is: entry row, then its idempotency row, then outbox insert.
- Two approvers racing: the second receives TRANSPARENCY_STATE_INVALID after the first commits.
- Approval racing with withdrawal: serialized by the entry row lock; the later command fails with STATE_INVALID or REVISION_CONFLICT and is not applied.
- A report freeze that sees an entry whose revision changed after the snapshot read rolls back and retries once inside the job; if it still fails, the report stays PREPARING and an alert fires (PS-148-08.R07).

## Event delivery and recovery
- Outbox rows are written in the command transaction and relayed at least once (A-TRANSPARENCY-18). Relay runs every 5 seconds and dispatch lag p95 is 5 seconds.
- Consumers deduplicate on `event_id` and apply events in `revision` order per aggregate; out-of-order events are parked for up to 60 seconds, then re-read the aggregate.
- After 10 failed deliveries an event moves to a dead-letter queue. An operator replays it after the cause is fixed; replay is safe because consumers deduplicate.

## Partial failure scenarios
| Scenario | Outcome | Recovery |
|---|---|---|
| Crash after freeze snapshot write but before commit | rollback; report PREPARING | job retries freeze; no orphan snapshot rows (snapshot rows are written in the same transaction) |
| Relay down after commit | event pending in outbox | relay resumes; consumers catch up; public read already reflects state |
| Source record deleted after submit | validation on approve fails with TRANSPARENCY_SOURCE_REF_INVALID | reviewer rejects with reason; entry moves to PREPARING |
| Identity service down during approve | TRANSPARENCY_UNAVAILABLE; no state change | retry with same key |

## Compensation and rollback
- No published record is deleted to compensate. Compensation is a new transition: WITHDRAWN for entries, WITHDRAWN for reports, or SUPERSEDED by a corrected successor.
- Failed publication never leaves partial public content because public reads filter on committed state.
- Data-level rollback boundaries are defined in PS-148-10.R07.

## Open decisions
- A-TRANSPARENCY-07: Idempotency window is 72 hours; keys older than the window are treated as new.
- A-TRANSPARENCY-08: Client retry policy values above are defaults; the PWA may tune within 2 to 8 attempts.
- A-TRANSPARENCY-09: Server timeouts (5 s command, 2 s query) are defaults pending the F15 gateway budget.
- A-TRANSPARENCY-18: Event delivery is at least once; consumers must deduplicate.
