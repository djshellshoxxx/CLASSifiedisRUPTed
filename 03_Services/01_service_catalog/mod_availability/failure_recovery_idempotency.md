# PS-028-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-06. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** 03_Services/02_service_booking (retry and timeout caller); platform F15 (outbox, storage); security F16 (rate limits).

## Purpose and scope
Defines retry, timeout, idempotency, concurrency-conflict and partial-failure recovery for this module. The module must never report a hold as confirmed when the booking caller did not receive a confirmation. It must never leave capacity held beyond its TTL.

Exclusions: booking retries and saga logic (02_service_booking), payment retries (none in this module), and infrastructure failover (F15).

## Timeouts
| Operation | Timeout (server side) | Timeout (booking caller) | Notes |
|---|---|---|---|
| claim.hold | 800 ms | 2 s | Single conditional update in one transaction |
| claim.confirm | 800 ms | 2 s | Conditional update on claim and window |
| claim.release | 800 ms | 2 s | Idempotent; safe to retry |
| window.publish, update, withdraw | 1.5 s | 4 s | Includes validation and outbox insert |
| schedule.create | 3 s | 6 s | Includes first materialization batch (up to 500 windows) |
| window.search | 500 ms | 2 s | Read replica allowed; staleness up to 5 s |
| Sweeper batch | 30 s per batch of 500 rows | n/a | Runs every 60 s |

Timeouts are enforced by the caller and server. A server timeout after commit is handled by idempotency replay, not by a second write.

## Retry policy
| Caller | Retry on | Max attempts | Backoff | Jitter |
|---|---|---|---|---|
| booking_service on hold, confirm, release | 503, timeout, connection reset | 4 total | 200 ms, 400 ms, 800 ms | full jitter, +/- 50 percent |
| booking_service on hold after AVAILABILITY_CAPACITY_EXHAUSTED | no retry | 1 | n/a | n/a |
| provider client on publish, update, withdraw | 503, timeout | 3 total | 1 s, 2 s | full jitter |
| outbox relay to F15 bus | any failure | unlimited with alert after 5 min lag | exponential, cap 60 s | full jitter |

Retry is safe for every command because each command carries an idempotency key. Retries reuse the same key. A retry with a new key is a new command and is not deduplicated.

## Idempotency
- Key scope: `(command, actor_ref, idempotency_key)`.
- Storage: `availability_idempotency` table with `payload_hash` (SHA-256 of canonical JSON), `result_json`, `status` (IN_PROGRESS, COMPLETED, FAILED_RETRYABLE), `created_at`, `expires_at = created_at + 24 h` (A-availability-08).
- Flow:
  1. Insert row with status IN_PROGRESS in the same transaction as the state change. A unique violation means a previous attempt exists.
  2. If the existing row is COMPLETED with the same hash, return stored result with `replayed: true`.
  3. If IN_PROGRESS and the lease is alive (30 s), return AVAILABILITY_TEMPORARILY_UNAVAILABLE with retry after 1 s.
  4. If IN_PROGRESS and the lease expired, the lease owner was lost. The new attempt takes over and re-validates state before writing.
  5. If the hash differs, return AVAILABILITY_IDEMPOTENCY_KEY_REUSED.
- Failed validation results are stored as COMPLETED with the error, so the same invalid request returns the same error.
- Retryable infrastructure errors are not stored as COMPLETED. They set FAILED_RETRYABLE and the key may be reused.

## Concurrency control
- Claims and capacity: conditional update in one statement, for example `UPDATE availability_window SET capacity_held = capacity_held + :q, revision = revision + 1 WHERE window_id = :id AND status IN ('PUBLISHED','SOLD_OUT') AND capacity_total - capacity_held - capacity_confirmed >= :q`. Zero rows updated returns AVAILABILITY_CAPACITY_EXHAUSTED or AVAILABILITY_STATE_CONFLICT after a read to classify.
- Provider edits: optimistic concurrency on `revision`. Mismatch returns AVAILABILITY_REVISION_CONFLICT with the current revision in details. Client re-reads and resubmits with a new key.
- Lock ordering when a command touches window and claim rows: window first, then claim. Deadlock risk is therefore limited to the sweeper, which locks claim rows in batches of 500 ordered by `claim_id`.
- No distributed locks. Correctness depends on the database constraint and conditional update.

## Partial failure scenarios
| Scenario | Detection | Recovery |
|---|---|---|
| Hold committed, response lost | booking retry with same key | replay returns stored HELD claim |
| Hold committed, booking abandons | HELD claim reaches hold_expires_at | sweeper sets EXPIRED and releases capacity |
| Confirm committed, response lost | booking retry with same key | replay returns CONFIRMED claim |
| Confirm after TTL | confirm returns AVAILABILITY_CLAIM_EXPIRED | booking re-holds if the slot is still open; otherwise it informs the claimant |
| Release after window withdrawn | claim already RELEASED | release replay returns RELEASED without changing capacity |
| Materialization batch fails midway | generation_id has rows but no completion marker | rows of the failed generation with status UNPUBLISHED are deleted by generation; the next rolling extension recreates them. Published rows are never deleted by this path |
| Outbox insert fails after state commit | not possible inside one transaction | state and outbox row commit together; no split write |
| Event bus unavailable | outbox lag alert | outbox relay retries; state is unaffected |
| Database failover during commit | commit outcome unknown to client | idempotency key replay resolves the outcome |

## Reconciler
- Runs every 5 minutes (A-availability-09).
- Recomputes `capacity_held` as sum of quantity of HELD claims and `capacity_confirmed` as sum of quantity of CONFIRMED claims per window. Any drift is corrected and logged as `availability.reconcile.drift` with window_id, old and new counts. Drift above 0 in any window triggers an alert.
- Checks `H + C <= T` and status consistency (SOLD_OUT only when remaining = 0).
- Reconciler is read-mostly. Corrections use the same conditional update path and write an AvailabilityAudit row with actor `system`.

## Offline and client retries
- The PWA queues schedule and window edits locally as pending until server acknowledgement (A-availability-13). Queued commands carry idempotency keys generated on the device.
- Queue is bounded at 50 commands. Oldest entries are not dropped silently; the UI shows a pending count and the user can discard an entry explicitly.
- On reconnect the client replays in original order. A rejected command (for example AVAILABILITY_REVISION_CONFLICT) is shown to the provider and is not auto-retried.

## Rate limiting and overload
- Limits are listed in privacy_retention_abuse.md. Over-limit responses use AVAILABILITY_RATE_LIMITED with `retry_after_s`.
- Under overload, reads (search) are shed first, then publish and update, then hold. Hold, confirm and release are never shed while the database is healthy, because they protect capacity correctness.

## Requirements
- [ ] PS-028-06.R01: Every operation in the timeout table has a server timeout and a documented caller timeout.
- [ ] PS-028-06.R02: Replay of any state-changing command returns the stored result and makes no second state change. Covered by TEST-PS-028-06-T01.
- [ ] PS-028-06.R03: Concurrent holds on last unit never exceed capacity. Covered by TEST-PS-028-06-T02.
- [ ] PS-028-06.R04: Reconciler detects and corrects injected drift within one cycle. Covered by TEST-PS-028-06-T03.
- [ ] PS-028-06.R05: Partial materialization failure leaves no orphan unpublished windows older than one cycle. Covered by TEST-PS-028-06-T04.

## Open decisions
- A-availability-04: Hold TTL 15 minutes.
- A-availability-08: Idempotency retention 24 hours.
- A-availability-09: Counter-based capacity with 5-minute reconciler. A per-seat model would change this file and the domain schema.
- A-availability-13: Offline queue of 50 commands for PWA (D08, OPEN).
