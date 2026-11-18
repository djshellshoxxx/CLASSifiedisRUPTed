# PS-041-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-06. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines how commands, timers and evidence uploads recover from timeouts, retries, lost responses, concurrency conflicts, offline use and partial failures. The rule: no failure may create an implied agreement, a duplicate transition or a silent loss of a committed event.

Exclusions: relay routing, network-level retries, and payment recovery (F09).

## Requirements
- **PS-041-06.R01** Outcome. Every state-changing command is either fully committed (state change plus event) or fully rejected. Clients can always learn the outcome by replay or by reading the claim.
- **PS-041-06.R02** Case coverage. The scenario table below covers timeout, lost response, duplicate submission, stale revision, lock contention, offline queue, outbox failure, expiry crash, orphan media, dual-attestation race and hold during response.
- **PS-041-06.R03** Budgets. Command server budget 5 seconds. Row lock wait 2 seconds. Operational budgets are in observability_performance.md.

## Retry policy
**Assumption A-damage-16:** Client retries use at most 5 attempts, exponential backoff starting at 500 ms with factor 2, capped at 30 s, full jitter. Retry on network failure, timeout, HTTP 503 and HTTP 429 (honor `Retry-After`). Never retry automatically on 4xx other than 429. DAMAGE_STALE_REVISION is never retried automatically; the client refetches and asks the user.

Server side:
- Command handler timeout: 5 s. On timeout the handler aborts; the transaction either committed or did not (no partial state).
- Row lock wait: 2 s. On expiry return DAMAGE_CLAIM_BUSY (503, retryable).
- Downstream calls (F13 notify, F12 notify, F07 block check) use a 1 s timeout with at most one retry. Their failure never fails the command; the outbox carries the event.

## Idempotency
- Keys and replay rules are in PS-041-04 (idempotency section). Key scope is (actor, command, key), kept 72 hours.
- The idempotency record is written in the same transaction as the state change, so a committed command always has a replayable record.
- Replay returns the stored response body with `replayed: true`. It never re-runs side effects.

## Concurrency control
- Every claim-changing command requires `expected_revision` (V23). The revision check and the write happen under a row lock on damage_claim.
- Two commands on the same revision: the first commits and increments revision. The second returns DAMAGE_STALE_REVISION with `current_revision`.
- Dual attestation: both attestations are written under the same lock. The second writer sees the first and evaluates the match in the same transaction.
- Timer expiry takes the same lock and re-checks state and deadline before writing.

## Transactional outbox
- Each event is written to damage_event and to an outbox row in the same transaction.
- A relay worker publishes outbox rows in sequence order per claim. Failures retry with the same backoff policy and never reorder events for one claim.
- Consumers deduplicate by `event_id`. Delivery is at-least-once.

## Scenario table
| # | Scenario | Detection | Recovery | Visible result |
|---|---|---|---|---|
| 1 | Command times out, outcome unknown | No response within 5 s | Client replays with same key; response is stored result or fresh commit | Single transition |
| 2 | Response lost after commit | Client retry hits the idempotency record | Stored response returned, `replayed: true` | Single transition |
| 3 | Same key, different payload | Payload hash mismatch | Reject DAMAGE_IDEMPOTENCY_KEY_REUSED | No change |
| 4 | Two renters or two commands race on one revision | Revision mismatch under lock | Second command gets DAMAGE_STALE_REVISION | Client refetches |
| 5 | Lock wait exceeds 2 s | Lock timeout | DAMAGE_CLAIM_BUSY; client retries with backoff | Delayed, no change |
| 6 | Evidence bytes stored but metadata commit fails | Orphan media scan | Orphan removed after 24 h (A-damage-17); client re-attaches with same key | Evidence absent until re-attached |
| 7 | Evidence digest mismatch on completion | V17 check | Reject, delete staged bytes, return DAMAGE_EVIDENCE_HASH_MISMATCH | Client re-uploads |
| 8 | Outbox publish fails | Outbox lag alarm | Retry with backoff; order preserved per claim | Late notifications, no lost events |
| 9 | Expiry job crashes mid-batch | Job heartbeat missing | Rerun is safe: state and deadline re-checked under lock | Expiry applied once |
| 10 | Moderation hold set during renter response | Hold check under lock | Response rejected with DAMAGE_CLAIM_LOCKED; retry after release | Renter sees locked claim |
| 11 | Dual attestation amounts differ | Match check in transaction | Both kept; DAMAGE_EXTERNAL_ATTESTATION_MISMATCH; either party may replace own attestation | Claim open |
| 12 | Event sequence gap detected | Reconciliation job | Alert; rebuild projection from event log; never edit events | No data change |
| 13 | Offline command queued (D08) | Client queue with pending state | Replayed on reconnect with original key and revision; stale ones return DAMAGE_STALE_REVISION | Pending until ack |
| 14 | Relay outage during timer | Missing heartbeat | Timers continue on the server; no client action needed | Deadline unchanged |

## Offline behavior (D08)
- The client stores commands it cannot send, each with its key and `expected_revision`. The UI marks them pending and never shows them as final.
- No offline command can create an agreement. Acceptance is only final after server acknowledgment.
- On reconnect, the client replays in queue order. A DAMAGE_STALE_REVISION rejection stops the queue for that claim and asks the user to review the new state.

## Compensation
- No compensating deletes. Corrections are new events.
- Holds plus moderation resolution are the correction path for an incorrect outcome before the terminal state. After a terminal state, the process is described in PS-041-03.

## Open decisions
- **Assumption A-damage-16:** Retry budget, timeouts and lock wait values.
- **Assumption A-damage-17:** Orphan media cleanup at 24 hours; outbox retry uses the same backoff as clients.
- D08 (PWA offline writes) is OPEN; the queue design is a recommended default.
- D04 (partial execution) is OPEN; dual attestation handles only the attestation step.
