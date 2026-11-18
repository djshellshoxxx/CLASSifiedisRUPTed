# PS-111-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-06. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07, F10, F15, F16 shared contracts per [dependency matrix](../../../DEPENDENCY_MATRIX.md); commands in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
**Business outcome:** a dropped connection, a retried CI job or a database failover never produces duplicate runs, duplicate waivers, half-written batches or lost events. Every failure ends in a state the release tool can read and act on.

**Exclusions:** client-side offline queues (PWA feature, D08 open; reviewers get an error and retry manually in MVP); recovery of the external scanner tool itself; federation replay (F11).

## Requirements
- PS-111-06.R01 — Outcome and exclusions as stated above.
- PS-111-06.R02 — Cases covered: duplicate command, timeout after commit, timeout before commit, stale expected version, batch partially valid, database failover mid-batch, outbox consumer down, tool stops reporting, replay after key expiry.
- PS-111-06.R03 — Budgets: command server deadline 5 s; storage statement timeout 2 s; batch of 200 rows commits within 2 s p95.
- PS-111-06.R04 — Idempotency store and replay semantics.
- PS-111-06.R05 — Client retry policy and timeouts.
- PS-111-06.R06 — Concurrency control per entity.
- PS-111-06.R07 — Partial failure: all-or-nothing batches and transactional outbox.
- PS-111-06.R08 — Recovery procedures for stuck runs, dead events and storage outage.

## Idempotency store
Table `wcag_idempotency`:

| Field | Type | Constraint |
|---|---|---|
| actor_id | string(26) | part of key |
| key_hash | bytes(32) | SHA-256 of `Idempotency-Key`; part of key |
| body_hash | bytes(32) | SHA-256 of canonical JSON body |
| status | enum | `IN_PROGRESS`, `DONE` |
| lease_until | timestamp | set while IN_PROGRESS, 10 s lease |
| response_json | text, max 16 KiB | stored on DONE |
| created_at | timestamp | |
| expires_at | timestamp | created_at + 72 hours (A-wcag-07) |

Rules:
1. The row is inserted and the mutation is written in one transaction. A crash leaves neither.
2. Same actor, same key, same body hash, status DONE: return `response_json` with the original status code. No write.
3. Same key, different body hash: `WCAG_IDEMPOTENCY_KEY_REUSED`, not retryable.
4. Same key, status IN_PROGRESS and lease still valid: the duplicate waits up to 2 s for DONE, then returns `WCAG_INTERNAL_ERROR` with `retryable: true`.
5. Lease expired while IN_PROGRESS: the next request takes over the lease only if the original transaction rolled back (row still IN_PROGRESS with no committed mutation). Takeover is a compare-and-set on `lease_until`.
6. Expired rows are deleted by a daily job. A key reused after 72 hours is a new request.

## Timeouts
| Layer | Value | On expiry |
|---|---|---|
| Client request | 10 s | Client treats as unknown outcome and retries with same key |
| Server command deadline | 5 s | Transaction rolled back; `WCAG_INTERNAL_ERROR` retryable |
| Storage statement | 2 s | Transaction rolled back |
| Outbox relay per event | 5 s | Event stays pending; retried |
| Sweeper RUNNING without heartbeat | 30 min | Run to FAILED, reason `timeout` |
| Sweeper QUEUED not started | 15 min | Run to CANCELLED, reason `not_started` |

## Client retry policy
- Retry only on: network timeout, HTTP 429, HTTP 500, HTTP 503, and error codes marked `retryable: true` in [validation_rules.md](validation_rules.md).
- Never retry other 4xx responses. Fix the request first.
- Backoff: base 500 ms, factor 2, full jitter, cap 30 s, maximum 5 attempts. Total budget 2 minutes.
- Reuse the same `Idempotency-Key` on every attempt. Generate a new key only for a new logical operation.
- On `WCAG_PROFILE_VERSION_CONFLICT`, re-read the profile and recompute the change before retrying with the new `expected_version`. Do not blindly resend.
- On `WCAG_FINDING_REVISION_CONFLICT`, re-read the finding and surface the conflict to the reviewer. Do not auto-retry.
- On `WCAG_CHECK_RUN_IN_PROGRESS`, poll `wcag.check_run.get` every 15 s up to 10 minutes.

## Concurrency control
| Entity | Mechanism | Conflict result |
|---|---|---|
| wcag_profile | `version` compare-and-set in the update statement | `WCAG_PROFILE_VERSION_CONFLICT` |
| wcag_check_run state | `UPDATE ... WHERE status = :expected AND attempt = :attempt`; must affect exactly 1 row | `WCAG_CHECK_RUN_STATE_INVALID` |
| wcag_check_run start | Partial unique index on (surface_id, release_ref) where status in (QUEUED, RUNNING) | `WCAG_CHECK_RUN_IN_PROGRESS` |
| wcag_finding (automated write) | Upsert on (check_run_id, sc_id); `revision` incremented | none; last write in a run wins because one `release_bot` owns the run |
| wcag_finding (review) | `expected_revision` compare-and-set | `WCAG_FINDING_REVISION_CONFLICT` |
| wcag_waiver | Partial unique index is not used; limit check and insert in one serializable transaction | `WCAG_WAIVER_LIMIT_EXCEEDED` |

## Partial failure
- **Batch atomicity:** `RecordFindings` validates all rows, then writes all rows in one transaction. Any failure rolls back every row and returns `WCAG_BATCH_ROLLED_BACK` (retryable). Zero rows are written on failure.
- **Transactional outbox:** each state change inserts its event into `wcag_outbox` in the same transaction. A relay publishes pending rows in `created_at` order. Failure leaves the row pending.
- **Outbox retry:** exponential backoff from 1 s to 5 min. After 24 hours a row moves to `dead` and raises an operator alert. Dead rows are replayed manually after cause is fixed.
- **Delivery guarantee:** at least once. Consumers dedupe on `event_id` (see [commands_queries_events.md](commands_queries_events.md)).
- **Storage failover:** commands in flight during failover return `WCAG_INTERNAL_ERROR` or time out. The client retries with the same key. Committed transactions are visible after failover; uncommitted are not.
- **Tool silence:** a `release_bot` that stops posting batches leaves the run RUNNING until the 30 minute timeout. The run then becomes FAILED and can be retried up to 3 attempts total.

## Recovery procedures
1. **Stuck run:** operator queries runs in RUNNING older than 30 minutes. Sweeper moves them to FAILED automatically. Operator may cancel instead of allowing retry.
2. **Dead outbox row:** fix consumer, then set `dead` row back to `pending`. Duplicate delivery is safe.
3. **Idempotency conflict storm:** if `WCAG_IDEMPOTENCY_KEY_REUSED` rate exceeds alert threshold, check client library version. Do not clear the store.
4. **Storage outage:** writes fail closed. No local buffering on the server. Gate reads return `WCAG_INTERNAL_ERROR` once the 60 second cache expires.
5. **Rollback of a bad deploy:** code rollback is safe because schema is forward-compatible. Data rollback is by restore (see [import_export_backup_rollback.md](import_export_backup_rollback.md)).

## Open decisions
- A-wcag-07: 72 hour idempotency retention. Clients must not reuse keys after this window.
- A-wcag-11: latency budgets assume a single region relay with one primary store and one synchronous replica.

## Testing expectations
- `TEST-PS-111-06-T01` to `TEST-PS-111-06-T07`: duplicate replay, body mismatch, crash before commit, crash after commit, batch rollback, outbox redelivery, stuck run sweep. Defined in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Acceptance criteria
- Forced failure at every step of the batch transaction leaves zero rows and zero outbox entries.
- Replaying each command with the same key 10 times produces exactly one write.
- Stuck RUNNING run reaches FAILED within 31 minutes in a test environment with clock control.
