# PS-032-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-06. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines timeouts, retries, idempotent replay, optimistic concurrency, partial-failure recovery and offline pending behavior. Business outcome: a client that loses a response can safely retry without creating a second quote or a second transition, and a crash never leaves a quote half-issued.

Exclusions: payment reversal or compensation (none exists), physical delivery recovery, and dispute resolution (mod_disputes).

## Requirements
- PS-032-06.R01: Timeouts, retry counts, backoff and retryable classification are fixed per command (Section 1).
- PS-032-06.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial failure cases are listed in Section 5 and tested in TEST-PS-032-06-T01 to T05.
- PS-032-06.R03: Offline and reconnect behavior does not claim an acceptance until the server acknowledges it. Budgets are in observability_performance.md.
- PS-032-06.R04: Retry matrix in Section 1 defines which commands are retry-safe and under which error codes.
- PS-032-06.R05: Partial failures in Section 3 each have a defined terminal or retryable outcome, and no outcome leaves a quote in a state not listed in workflow_state_machine.md.
- PS-032-06.R06: Concurrency conflicts resolve by one winner through `expected_version`. Losers are never auto-retried with the same `expected_version`.

## 1. Timeouts, retries and idempotency per command
Server-side command timeout: 3 seconds (A-quotes-16). Client backoff: 0.5, 1, 2, 4, 8 seconds with ±20% jitter, maximum 5 attempts (A-quotes-16).

| Command | Retry-safe | Idempotency | Retry on | Do not retry on |
|---|---|---|---|---|
| C1 create | yes, with key | Key scoped to (actor, command) | QUOTES_DEPENDENCY_TIMEOUT, QUOTES_INTERNAL, network | QUOTES_DUPLICATE_OPEN_QUOTE, validation codes |
| C2 revise | yes, with key | Key plus `expected_version` | network, QUOTES_INTERNAL | QUOTES_VERSION_CONFLICT (re-read first) |
| C3 issue | yes, with key | Key | network, QUOTES_DEPENDENCY_TIMEOUT | QUOTES_LINE_EMPTY, QUOTES_MODERATION_HOLD |
| C4 respond | yes, with key | Key; ACCEPT is additionally idempotent by state (second ACCEPT returns replay) | network, QUOTES_INTERNAL | QUOTES_REVISION_EXPIRED, QUOTES_VERSION_CONFLICT |
| C5 withdraw | yes, with key | Key | network | QUOTES_STATE_INVALID |
| C6 set_hold | yes, with key | Key | network | QUOTES_NOT_AUTHORIZED |
| Q1 to Q3 | yes, no key | Not applicable | network, 503, 500 | 4xx |

Idempotency record: stored per (actor_participant_id, command_name, Idempotency-Key) with `request_hash` (SHA-256 of canonical request body) and response snapshot containing identifiers and status only. Retention 24 hours (A-quotes-14).
- Same key, same hash: return stored response with `Idempotent-Replayed: true`. No second write.
- Same key, different hash: QUOTES_IDEMPOTENCY_KEY_REUSED.
- Key expired: treated as new. Business uniqueness rules (QUOTES_DUPLICATE_OPEN_QUOTE, state guards) still protect against double effects.

## 2. Concurrency control
- Every quote write increments `version`. Commands that change the quote require `expected_version`.
- Row lock on the quote row for the duration of the transaction. Conflicting writers are serialized; the loser with a stale `expected_version` receives QUOTES_VERSION_CONFLICT with `current_version`.
- Client behavior on conflict: re-read the quote, present the new state, and let the user decide. No automatic retry of the same body.
- Accept and withdraw race: whichever commits first wins. The other returns QUOTES_VERSION_CONFLICT or QUOTES_STATE_INVALID.

## 3. Partial failure recovery
| Failure point | State at failure | Recovery | Client-visible result |
|---|---|---|---|
| Crash before commit (C1 to C5) | Nothing persisted | Retry with same key executes once | Timeout, then success on retry |
| Crash after commit, before response | Committed, response lost | Retry with same key replays stored response | 200/201 with replay header |
| Outbox publish fails | Quote committed; event unpublished | Outbox worker retries (A-quotes-15) | None; notifications delayed |
| Identity block read times out during ACCEPT | Nothing persisted | Fails closed | QUOTES_DEPENDENCY_TIMEOUT (retryable) |
| Catalog or request owner read times out during C1 | Nothing persisted | Fails closed | QUOTES_DEPENDENCY_TIMEOUT (retryable) |
| Expiry job crashes mid-batch | Some rows expired | Conditional updates; restart is a no-op for done rows | None |
| Database failover during accept | Transaction rolled back or committed atomically | Client retries with same key; replay or first execution | Timeout then consistent result |
| Downstream consumer down | Quote committed; events queued | Outbox redelivery; consumers dedupe on `event_id` | None |

Rule: accept, issue and withdraw never commit a status change without the matching history row and outbox row (R05).

## 4. Offline behavior (D08)
- Provider may compose and revise offline. Changes are kept in a local pending queue and are not visible to requester until server ack. Pending state shows in the UI with text, not colour alone.
- Requester may not accept offline. Accept is queued as pending, shows "awaiting confirmation", and becomes accepted only on server response. The client sends the same Idempotency-Key on every reconnect attempt.
- Queue entries expire after 72 hours of being unsent; expired entries are shown to the user and are not sent silently.
- Pending entries referencing a revision that has since been superseded return QUOTES_REVISION_STALE on sync and are not applied.

## 5. Failure cases
| Class | Case | Expected result | Test |
|---|---|---|---|
| normal | Retry C1 after lost response | One quote; replay returned | T01 |
| invalid | Same key with different body | QUOTES_IDEMPOTENCY_KEY_REUSED | T01 |
| expired | Accept submitted after `valid_until` | QUOTES_REVISION_EXPIRED | T02 |
| duplicate | Two concurrent C4 ACCEPT with different keys | One ACCEPTED; second QUOTES_STATE_INVALID | T03 |
| concurrent | C2 and C3 same `expected_version` | One succeeds; one QUOTES_VERSION_CONFLICT | T03 |
| offline | Queued accept sent twice after reconnect | Single transition; second is replay | T04 |
| adversarial | Replayed old key after 24 hours with altered body | Treated as new; still fails uniqueness or state guards | T05 |

## Assumptions and open decisions
- A-quotes-14: Idempotency retention 24 hours; key scope (actor, command_name).
- A-quotes-15: Outbox is at-least-once. Consumers dedupe on `event_id`. Dead-letter after 10 attempts with exponential backoff from 1 second to 10 minutes.
- A-quotes-16: Server timeout 3 seconds; client backoff as in Section 1.
- D08 (open, DECISIONS.md): PWA offline writes. This file defines a local pending queue that is cleared only by server acknowledgment. The 72-hour queue lifetime is a recommended default, not an approved decision.
