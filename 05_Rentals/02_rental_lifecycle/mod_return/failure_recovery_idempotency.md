# PS-043-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-06. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** PWA client, API gateway, outbox relay, scheduler, downstream event consumers.

## Purpose and scope
Defines timeouts, retries, idempotency storage, optimistic concurrency, transactional outbox, scheduler behavior, dependency protection and recovery after partial failure. The goal: no lost declaration, no duplicated transition, no event loss, and no implied settlement after a failure.

**Exclusions:** database failover and backup mechanics (F15, PS-043-10 for module boundaries); network-layer retries inside F16 transport.

## Requirements
- PS-043-06.R01: Every state-changing command is idempotent on (actor_participant_id, Idempotency-Key). Replays return the stored response, not a new transition.
- PS-043-06.R02: Case coverage: lost response after commit, crash before commit, crash after commit before publish, duplicate publish, projection timeout, scheduler crash, two scheduler workers, offline replay after 72 h, backlog of unconsumed events. Each has a recovery row in Table 3.
- PS-043-06.R03: Accessibility: when a command is pending offline, the UI shows a "not yet sent" state with plain text and never shows confirmed until the server has acknowledged.
- PS-043-06.R04: No failure path reverses a transition. Corrections happen only through permitted forward transitions (Section "Compensation").
- PS-043-06.R05: Budgets for timeouts and retries are the values in Tables 1 and 2; any change requires updating this file.

## Table 1 — timeouts
| Scope | Value | Behavior on expiry |
|---|---|---|
| PWA command request | 10 s | client keeps command pending, retries under same key |
| PWA list or read request | 15 s | shows cached view labelled as possibly stale |
| API handler deadline | 3 s | returns RETURN_DEPENDENCY_UNAVAILABLE if projection not yet read; otherwise RETURN_INTERNAL_ERROR |
| Projection read (rental_agreement) | 500 ms per attempt | one retry; then RETURN_DEPENDENCY_UNAVAILABLE |
| Database statement | 2 s | transaction rolled back; RETURN_INTERNAL_ERROR |
| Outbox publish call | 2 s | row remains unpublished; retried by relay |
| Scheduler batch | 60 s | batch stops; unfinished rows picked up on next tick |

## Table 2 — retry policy
| Caller | Policy |
|---|---|
| PWA command | same Idempotency-Key; up to 8 attempts; exponential backoff base 1 s, factor 2, full jitter, cap 300 s; honours Retry-After on 429 and 503 |
| PWA command, 409 RETURN_REVISION_CONFLICT | no blind retry; refetch GetReturn, show current state, let user act again with new expected_revision |
| PWA read | 2 attempts, backoff 1 s |
| Server to projection | 1 retry after 100 ms, only for connection errors and 5xx |
| Outbox relay | backoff base 1 s, factor 2, cap 5 min; after 10 failed attempts the row is marked dead_letter and alerts fire |
| Scheduler | failed row retried on next tick (every 5 min) |

Retry policy values are A-return-17.

## Idempotency storage
Table `rental_return_idempotency`:
| Column | Type | Notes |
|---|---|---|
| actor_participant_id | ULID | part of PK |
| idempotency_key | text (26-128 chars) | part of PK |
| command_name | text | e.g. DeclareReturn |
| request_sha256 | char(64) | RFC 8785 canonical JSON hash, excluding key and client_requested_at |
| response_status | smallint | stored for 2xx and for 4xx domain errors (not 429, 500, 503) |
| response_body | text, max 4 KB | stored response returned on replay |
| return_id | ULID, nullable | |
| created_at | timestamptz | |
| expires_at | timestamptz | created_at + 7 days (A-return-16) |

Rules:
- Same key and same hash within expiry: return stored status and body with header `Idempotent-Replayed: true`. No new transition, no new outbox row.
- Same key and different hash: RETURN_IDEMPOTENCY_PAYLOAD_MISMATCH (422).
- Key expired: treated as new. Duplicate transitions are still prevented by state rules (a second DeclareReturn returns RETURN_INVALID_TRANSITION).
- Idempotency row and state change are written in the same transaction, so a stored response always matches a committed change.

## Concurrency control
- Optimistic: `expected_revision` checked after `SELECT ... FOR UPDATE` on rental_return. Mismatch returns RETURN_REVISION_CONFLICT with current_revision.
- Initiation race: the partial unique index `rental_return_one_active` rejects the second insert (SQLSTATE 23505); the handler reads the existing active return and returns RETURN_ALREADY_OPEN with its return_id.
- Scheduler: selects candidate rows with `FOR UPDATE SKIP LOCKED`, re-checks guard after locking, and writes the transition.
- Lock ordering: rental_return row first, then idempotency row, then outbox insert. Locks are released at commit.

## Transactional outbox
Table `rental_return_outbox`: `outbox_id` ULID, `return_id`, `event_id` (unique), `event_type`, `payload_json` (no notes, PS-043-04), `created_at`, `published_at` nullable, `attempts` integer, `dead_letter` boolean.
- The outbox row is inserted in the same transaction as the transition.
- Relay publishes in `created_at` order per return_id. Delivery is at-least-once (A-return-15).
- Consumers deduplicate on `event_id` and ignore events with `revision` lower than their last applied revision for that aggregate.
- Rows are retained 14 days after publication (A-return-18); dead-letter rows are kept until an operator resolves them.

## Table 3 — partial failure and recovery
| Failure point | State after failure | Recovery |
|---|---|---|
| Projection times out before insert | nothing written | client retries same key; no duplicate |
| Crash after commit, before HTTP response | transition committed, response lost | client retries same key; stored response replayed |
| Crash after commit, before outbox publish | outbox row unpublished | relay publishes on restart; no event loss |
| Crash after publish, before relay marks row | event published twice | consumers dedupe by event_id |
| Scheduler crash mid-batch | rows before crash committed | remaining rows picked up next tick; each row is independent |
| Two scheduler workers | same candidate row | SKIP LOCKED plus guard re-check; at most one transition |
| Owner confirm races owner_response timer | one wins by row lock | loser gets RETURN_INVALID_TRANSITION or timer skips row |
| Command after abandonment | terminal state | RETURN_INVALID_TRANSITION; no write |
| Consumer down | outbox backlog grows | alert at lag > 5 min; events retained 14 days; replay on recovery |
| Moderation resolves after closed_disputed | terminal state | RETURN_INVALID_TRANSITION; a new moderation case is out of scope for this module |
| Offline queue older than 72 h | command never sent | client marks it "not sent", asks user to retry; never sends under a new key automatically |
| Projection circuit open | no reads from projection | initiation returns RETURN_DEPENDENCY_UNAVAILABLE (retryable); other commands use stored state and do not need projection |

## Circuit breaker (projection and moderation calls)
- Opens when at least 20 calls in 30 s have 50% or more failures (A-return-19).
- Open for 15 s; then half-open with 3 probe calls. Probe success closes; any probe failure reopens.
- While open: calls fail fast with RETURN_DEPENDENCY_UNAVAILABLE and `Retry-After: 15`.

## Offline and PWA behavior
- Commands are written to the local pending queue (IndexedDB) before sending (D08). The queue entry keeps the Idempotency-Key, expected_revision and payload.
- The UI shows the item as pending. It becomes confirmed only after a 2xx response with the server's revision.
- After reconnect, the queue replays in order per return_id. A 409 RETURN_REVISION_CONFLICT or RETURN_INVALID_TRANSITION removes the entry and shows the current server state.

## Compensation
- No reverse transitions exist. A wrong declaration is corrected by the owner disputing it (declared to disputed) and resolved by a moderator; a wrong confirmation cannot be undone and is handled outside this module.
- Cancellation is allowed only from initiated.
- Compensating transitions are new rows in rental_return_transition with reason_code, never edits or deletes.

## Open decisions
- A-return-15: Event delivery is at-least-once through a transactional outbox owned by F15.
- A-return-16: Idempotency records expire after 7 days (retention classes in PS-043-07).
- A-return-17: Retry and timeout values in Tables 1 and 2 are the MVP defaults.
- A-return-18: Outbox rows are kept for 14 days after publication.
- A-return-19: Circuit breaker thresholds are 20 calls, 50% failure, 15 s open, 3 probes.
