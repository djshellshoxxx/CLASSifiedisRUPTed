# PS-031-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-06.R01 | Idempotent writes on (actor, command, key), 24 h window. Different digest with same key → `EVT.IDEMPOTENCY_KEY_REUSED`. | MVP |
| PS-031-06.R02 | `plan_set` is one transaction: all rows and one `milestone.plan_set` event, or nothing. | MVP |
| PS-031-06.R03 | Auto-accept job is idempotent per `(milestone_id, revision)`; re-run after crash emits no duplicate. | MVP |
| PS-031-06.R04 | Claim request to F09 is sent with a deterministic key `(milestone_id, revision, "claim")`; F09 replays return the same claim (CTR-COM-001 R10 uniqueness). | MVP |
| PS-031-06.R05 | If F09 call fails after local acceptance commit, a retry queue (≤ 24 h, 5 attempts, exponential backoff ASSUMPTION) completes the claim request; milestone stays `accepted`. | MVP |
| PS-031-06.R06 | Timeouts 5 s; unknown outcome → retry with same key. | MVP |
| PS-031-06.R07 | Offline: `submit` and `accept` queued until relay acknowledgment (D08 PROVISIONAL); plan edits not queued offline. | MVP |

## Data / schema
Idempotency and claim-request queue: `(key, digest, status, attempts, next_attempt_at)`.

## Commands / queries / events
Replay semantics per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery never skips a transition in [workflow_state_machine.md](workflow_state_machine.md). Accept commit precedes claim request; claim failure does not revert acceptance.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`. Non-retryable: `MILESTON.INVALID_TRANSITION`.

## Authorization
Queued commands re-check capability on relay receipt.

## Failure, idempotency, concurrency, offline
| Failure | Outcome |
|---|---|
| Crash after accept commit, before claim request | queue drives claim on restart |
| F09 duplicate claim request | single claim returned |
| Auto-accept racing with client reject | revision conflict; one winner |
| Offline accept, plan changed meanwhile | server rejects with `EVT.REVISION_CONFLICT` |

## Privacy, retention, abuse
Queue rows hold IDs and digests only. Queue purged after completion or 24 h.

## Observability & budgets
Metric `milestone_claim_queue_depth`; alert if any item older than 1 h (ASSUMPTION).

## Tests
- TEST-PS-031-06-01 integration: crash between accept commit and claim request, restart, exactly one claim.
- TEST-PS-031-06-02 integration: `plan_set` fault injection leaves prior plan.
- TEST-PS-031-06-03 offline: queued accept replayed once.

## Acceptance criteria
1. No accepted milestone without eventual claim request or alert.
2. No duplicate claim across injected faults.
3. Plan writes are all-or-nothing.

## Assumptions & open decisions
- ASSUMPTION: 24 h queue window, 5 attempts.
- D08 PROVISIONAL.
- Payment checklist applies: claim uniqueness per CTR-COM-001 R10.
