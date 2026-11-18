# PS-086-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 aggregate lock, R03 idempotency, R08 hash chain), CTR-FED-001 (R05 dedupe, R06 equivocation, R13 per-event results), CTR-PRV-001 (R06 propagation), CTR-SCH-001 (R08 lossless evidence).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-06.R01 | Both conflicting arrivals are stored as evidence. Neither is discarded because the other arrived first. | MVP |
| PS-086-06.R02 | Hold queue for revision gaps: ≤ 500 held events per origin and ≤ 10,000 platform-wide (ASSUMPTION). Overflow → rejected with `CONFLICTS.REVISION_GAP` and no hold. | MVP |
| PS-086-06.R03 | Hold window 24 h (ASSUMPTION). Holds survive restart (durable queue). | MVP |
| PS-086-06.R04 | Detection and insert for one origin serialize on the origin's aggregate lock. Timeout 2 s; on timeout the event is retried by the ingress, not stored. | MVP |
| PS-086-06.R05 | Peer quarantine and conflict insert are one transaction (PS-086-03 R05). Partial commit is impossible. | MVP |

## Data / schema
Hold queue row: `event_id`, `origin_node`, `aggregate_id`, `revision`, `held_at`, `expires_at`, `bytes_ref`. Retention per PS-086-07.

## States & transitions
Hold rows follow PS-086-03 (gap states). No additional states.

## Validation & errors
Overflow returns `CONFLICTS.REVISION_GAP` (retryable). Per-event result is `rejected` or `deferred` per CTR-FED-001 R13.

## Authorization
Ingress runs under `sys_` (PS-086-05).

## Failure, idempotency, concurrency, offline
- **Crash during equivocation transaction:** transaction rolls back; the ingress retries the same event; detection runs again and produces one row (PS-086-01 R03).
- **Two concurrent arrivals at the same revision:** serialized by the aggregate lock; the second sees the first and records equivocation. Both bytes stored.
- **Gap fills while holds exist:** held events released in ascending revision under the lock; each release re-runs detection.
- **Retry of a batch with an already-recorded conflict:** returns `duplicate` for the same event and the existing record for the pair. No second row.
- **Restore of a peer during an open equivocation:** refused (PS-086-03 R04).
- **Offline:** not applicable (server-side).
- **Idempotency of steward commands:** PS-086-04.

## Privacy, retention, abuse
Hold queue bytes are deleted on release, rejection or expiry, except evidence bytes that became conflict records (kept per PS-086-07).

## Observability & budgets
`fed_hold_queue_depth{origin}`, `fed_hold_expired_total`. Budgets in PS-086-08.

## Tests
- TEST-PS-086-06-01 (integration): crash injected inside transaction; no partial state; retry yields one row.
- TEST-PS-086-06-02 (integration): 500 concurrent arrivals for one revision; both equivocating arrivals stored.
- TEST-PS-086-06-03 (integration): hold overflow returns `CONFLICTS.REVISION_GAP`; no row beyond cap.
- TEST-PS-086-06-04 (integration): process restart with 100 held events; all released or expired correctly.
- TEST-PS-086-06-05 (integration): gap-fill release preserves revision order.

## Acceptance criteria
1. No partial equivocation state; TEST-PS-086-06-01 passes.
2. Both arrivals always stored; TEST-PS-086-06-02 passes.
3. Hold caps enforced; TEST-PS-086-06-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: hold caps 500 per origin and 10,000 platform-wide (F15 to confirm capacity).
- ASSUMPTION: aggregate lock timeout 2 s (F15 to confirm).
- D08 not applicable: holds are server-side.
