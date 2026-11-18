# PS-039-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-06. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (retry of commit and release), notifications, observability; shared F15 platform, F16 security per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-06.R01: Every state-changing command is idempotent for at least 7 days. A double-booking under any retry, replay or concurrent request is impossible by construction.
- PS-039-06.R02: Timeouts, retries and backoff are defined for clients, for the lifecycle service and for internal jobs.
- PS-039-06.R03: Concurrency conflicts, partial failures and crash recovery each have a defined outcome, and no outcome requires manual data repair.

## Idempotency
- Scope: `(actor_key, command_name, idempotency_key)`.
- First success stores `request_hash` (SHA-256 of canonical body) and `result_ref`, in the same transaction as the state change.
- Replay with the same key and hash returns the stored result with `replayed: true`. No second state change occurs.
- Same key, different hash: `AVAIL_IDEMPOTENCY_KEY_REUSED`. Nothing changes.
- Records are kept 7 days (A-AVAIL-13). Replay after expiry is treated as a new request, which is safe because the uniqueness rules below still hold.
- Read commands are naturally idempotent and carry no key.

## Concurrency and conflicts
- Overlap checks for holds, commits and blocks run inside a transaction holding a per-listing lock. Two concurrent holds on overlapping periods cannot both succeed; the second receives `AVAIL_CLAIM_CONFLICT`.
- Lock wait limit: 500 ms. On timeout the command returns `AVAIL_UNAVAILABLE` (retryable) and changes nothing.
- Updates that carry `expected_revision` return `AVAIL_REVISION_CONFLICT` when the stored revision differs. The client re-reads and decides again; the server never merges.
- Expiry check runs under the same lock, so a hold cannot expire and be committed in parallel. The commit then sees `expired` and returns `AVAIL_CLAIM_STATE_INVALID`.

## Timeouts
| Operation | Server deadline | Client deadline | Notes |
|---|---|---|---|
| Write command | 2 s | 5 s | Deadline exceeded after commit is detected by replay |
| Calendar query | 1 s | 3 s | Served from read model; may lag by up to 5 s |
| Claim read | 1 s | 3 s | |
| Sweep job | 30 s per batch | none | Batches of 200 claims |

## Retries
- Client retry on `AVAIL_UNAVAILABLE`, `AVAIL_RATE_LIMITED` and transport timeouts: at most 5 attempts, exponential backoff base 500 ms, factor 2, full jitter, cap 16 s (A-AVAIL-20). Retries reuse the same idempotency key.
- Client does not retry validation or authorization codes.
- Lifecycle service retries `avail.claim.commit` with the same key while the hold is unexpired. If the hold has expired, the lifecycle service stops and asks the requester to re-request.
- Event delivery retries are owned by the outbox relay: exponential backoff, maximum 24 hours, then dead-letter with alert.

## Partial failure outcomes
| Failure point | Outcome | Recovery |
|---|---|---|
| Crash after hold insert, before response | Claim exists and is held | Client replays with same key and receives original claim |
| Crash before commit of hold transaction | No claim, no event | Client retries as new request |
| Lifecycle commit succeeds, response lost | Claim is committed | Lifecycle replays commit with same key |
| Hold expires while lifecycle commit in flight | Commit rejected | Lifecycle abandons; requester re-requests |
| Event publish fails | Event remains in outbox | Relay retries; state already correct |
| Sweep job fails mid-batch | Some claims expired | Next sweep resumes; expiry is idempotent |
| Lifecycle release fails after cancellation | Commitment remains | Lifecycle retries releaseCommitment; period stays blocked until released, never silently freed |

## Compensation
- A held claim that the lifecycle service cannot commit is released with reason `hold_expired` or `requester_withdrew`. No external money or item movement occurs in this module, so no financial compensation is defined here.
- A window withdrawn while held claims exist releases those claims with `owner_declined` in the same transaction.

## Recovery after restore
- Restore from backup replays the event log from the backup point to the present, applying each event idempotently by `event_id`. Restored state is never accepted without this replay.

## Open decisions
- A-AVAIL-19: Server write deadline 2 s and lock wait 500 ms. Chosen to keep p95 well inside budgets in observability_performance.md.
- A-AVAIL-20: Client retry policy of 5 attempts with exponential backoff, base 500 ms. Mirrors common mobile retry behavior; offline queue rules belong to the PWA sync spec.
- A-AVAIL-21: Concurrency control uses a per-listing transactional lock rather than a global exclusion constraint. Implementation detail that must preserve the no-double-booking invariant.
