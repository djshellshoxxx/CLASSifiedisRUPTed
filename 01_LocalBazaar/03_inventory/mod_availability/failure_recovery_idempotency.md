# PS-008-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, commit atomicity), CTR-ERR-001 (retry rules), CTR-CAP-001 (fail closed).

**Decisions:** Offline rules follow D08 default (PROVISIONAL, unapproved). Saga and compensation follow D04 default (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-06.R01 | Hold placement is all-or-nothing with the counter change and event append, in one transaction. | MVP |
| PS-008-06.R02 | For the last unit, exactly one of N concurrent `hold.place` calls commits. | MVP |
| PS-008-06.R03 | No hold exists without a committed `offer_ref`. A hold whose offer fails is withdrawn within 5 min. | MVP |
| PS-008-06.R04 | Repeat of a command with the same key and digest returns the original result without a new event. | MVP |
| PS-008-06.R05 | Holds and executions are never queued offline. Configure and commit may be queued and are re-validated at commit. | MVP |

## Idempotency and concurrency
- Scope: (actor, command, `idempotency_key`) per CTR-EVT-001 R03. Same key, different digest → EVT.IDEMPOTENCY_KEY_REUSED.
- Writes carry `expected_revision`. Mismatch → EVT.REVISION_CONFLICT; client reloads and retries with a new key.
- Lock granularity: one `availability_id`. Holds on different listings never contend.

## Timeouts and retries
- `hold.place` client timeout 5 s; retry with the same key only.
- Server budget for `hold.place` 2 s; on overrun the server commits or rolls back and the caller re-reads.
- SYS.UNAVAILABLE retried with exponential backoff, base 500 ms, cap 60 s, full jitter (CTR-ERR-001). Non-retryable AVAIL codes are never retried automatically.

## Saga (offer → hold → activate)
1. F01.S04.M01 creates offer in DRAFT.
2. `hold.place` with that `offer_ref`.
3. Offer activates. On failure at 3, F01.S04.M01 calls `hold.withdraw` (reason `offer_failed`).
4. Expiry job removes any hold left by a crash between 2 and 3 at TTL.
Correlation via one `cor_` ID for the whole saga.

## Offline
Queued configure and commit entries show "not applied" on rejection (CTR-ERR-001). Holds show "reserving" until server acknowledgement; no local hold is ever assumed.

## Recovery
- Expiry job: every 60 s, batch ≤ 500, idempotent (re-running a terminal hold is a no-op).
- Reconciliation job, daily: recompute `held_units` from PLACED holds and `committed_units` from events. Mismatch → alert and repair by compensating event `availability.configured` with reason `reconciliation`. Records are never edited in place.
- Store or policy unavailable: deny with SYS.UNAVAILABLE. No hold is placed on a guess.

## Tests
- TEST-PS-008-06-01 (concurrency): 50 parallel `hold.place` on last unit → 1 PLACED, 49 AVAIL.INSUFFICIENT_UNITS.
- TEST-PS-008-06-02 (idempotency): same key and digest → same `hold_id`; different digest → EVT.IDEMPOTENCY_KEY_REUSED.
- TEST-PS-008-06-03 (fault injection): crash between offer creation and hold commit → no orphan hold after TTL.
- TEST-PS-008-06-04 (offline): queued `configure` with stale revision → rejected at replay, shown as not applied.
- TEST-PS-008-06-05 (reconciliation): seeded drift is detected and repaired by compensating event.

## Acceptance criteria
1. TEST-PS-008-06-01 to -05 pass in CI.
2. Zero orphan holds after a 1-hour fault-injection run.
3. Reconciliation mismatch count is 0 in the seeded environment.

## Assumptions & open decisions
- ASSUMPTION: 2 s server budget; 5 min orphan-withdrawal bound.
- PROVISIONAL (D08 default, unapproved): offline holds disallowed.
- PROVISIONAL (D04 default, unapproved): compensation, not atomic rollback, for partial failure.
