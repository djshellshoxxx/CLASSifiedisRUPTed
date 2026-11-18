# PS-029-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ID-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-06.R01 | Every write is idempotent on (actor, command, idempotency_key) with a 24 h replay window (ASSUMPTION). | MVP |
| PS-029-06.R02 | Concurrent attach of the same code on one listing: exactly one row survives; loser receives `SKILLS.DUPLICATE_ATTACHMENT`. | MVP |
| PS-029-06.R03 | Listing edits use `expected_revision`; mismatch → `EVT.REVISION_CONFLICT`, no write. | MVP |
| PS-029-06.R04 | A relay timeout (> 5 s, ASSUMPTION) is treated as unknown outcome; client retries with the same key. | MVP |
| PS-029-06.R05 | Partial failure: row insert and event append share one transaction; no event without row, no row without event. | MVP |
| PS-029-06.R06 | Retries are safe for `skill.search`; no retry budget is consumed on read paths. | MVP |
| PS-029-06.R07 | Expiry job resumes from last processed row ID after crash; re-run produces no duplicate events. | MVP |

## Data / schema
Idempotency record: `(actor_ref, command, idempotency_key, request_digest, result_ref, created_at)`, kept 24 h, then removed. Digest is SHA-256 of JCS of the request body.

## Commands / queries / events
Retry semantics per command in [commands_queries_events.md](commands_queries_events.md). Retryable codes are fixed in the CTR-ERR-001 registry.

## States & transitions
Recovery never skips a transition. A crash mid-transition is rolled back; retry re-evaluates guards in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Non-retryable: `SKILLS.LIMIT_EXCEEDED`, `SKILLS.TAXONOMY_UNKNOWN`. Retryable: `SYS.UNAVAILABLE` (retryable true; backoff 1 s, 2 s, 4 s, max 3 attempts, jitter ±20%).

## Authorization
Replayed requests re-check capability only if the original result is not returned from the idempotency store. Replays of a revoked principal's writes are refused.

## Failure, idempotency, concurrency, offline
Offline attach is queued locally until relay acknowledgment (D08 PROVISIONAL). On reconnect, queued commands are sent in creation order with their original keys. Server rejections keep the local row as `pending_sync` with the error code shown to the user; no silent drop. Unknown schema MAJOR stays pending with "client upgrade required" (CTR-SCH-001 R06).

## Privacy, retention, abuse
Idempotency records hold digests, not bodies. Queued offline data on devices is cleared on sign-out (ASSUMPTION).

## Observability & budgets
Metrics: replay hits, conflicts, retries per command. Alert when conflicts exceed 2% of writes over 15 minutes (ASSUMPTION).

## Tests
- TEST-PS-029-06-01 integration: 50 concurrent attaches of one code produce one row.
- TEST-PS-029-06-02 integration: crash injected between row insert and event append leaves no orphan.
- TEST-PS-029-06-03 offline: queued attach replayed after reconnect exactly once.

## Acceptance criteria
1. Duplicate and replay cases produce zero extra events.
2. No row exists without a matching event after any injected fault.
3. Offline queue survives app restart and is never silently dropped.

## Assumptions & open decisions
- ASSUMPTION: 24 h idempotency window; 5 s timeout; 3 retries.
- D08 (offline writes) PROVISIONAL.
- No payment or receipt checklist applies.
