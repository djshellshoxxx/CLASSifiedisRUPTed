# PS-085-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03 idempotency, R08 hash chain), CTR-FED-001 (R13 per-event results, retry table), CTR-SCH-001 (R06 unknown MAJOR), CTR-PRV-001 (R06 propagation).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-06.R01 | Never send an unsigned event that requires a signature. If signing fails, the event stays in the outbox and is not exported. | MVP |
| PS-085-06.R02 | Signing retries: exponential backoff 1 s, 2 s, 4 s … capped at 5 min; 10 attempts; then alert (ASSUMPTION). | MVP |
| PS-085-06.R03 | Sign call timeout 500 ms (ASSUMPTION). Verify budget per event 50 ms, per batch 5 s (ASSUMPTION). Timeout → retry for sign; `FED.KEY_UNKNOWN`-style deferral does not apply to timeouts. | MVP |
| PS-085-06.R04 | Batch verification returns one result per event (CTR-FED-001 R13). One invalid event does not reject the others. No event is committed before its own verification passes. | MVP |
| PS-085-06.R05 | Key cache miss triggers one lookup. Cache TTL ≤ 60 s; revocation or compromise invalidates the cache entry on commit. | MVP |

## Data / schema
Outbox row: `event_id`, `attempt_count`, `next_attempt_at`, `last_code` (no payload). Retention per PS-085-07.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| queued | sign succeeds | key in force at `occurred_at` | signed | eligible for export batch |
| queued | sign fails, attempts < 10 | retryable | queued | `next_attempt_at` updated |
| queued | sign fails, attempts = 10 | — | held | alert; not exported |
| queued | no key in force at `occurred_at` | — | held | alert to F16 |

## Validation & errors
`EVT.SIGNATURE_REQUIRED` on held events at the producer. Peers never see held events.

## Authorization
Retries run under the same `sys_` principal as the first attempt (PS-085-05).

## Failure, idempotency, concurrency, offline
- Ed25519 signing is deterministic: a retried sign returns identical bytes. Retries cannot produce a second valid signature for different content.
- Re-verifying the same bytes is idempotent.
- Key rotation during export: each event is signed by the key in force at its own `occurred_at`. If none is in force, the event is held (not re-signed with a different key).
- Revocation during export: events not yet sent are re-checked; if their key is now revoked before `occurred_at`, they are held.
- Concurrency: sign operations for one event serialize on `event_id`.
- Offline: not applicable (server-side). D08 does not apply.
- Compromise: events signed before `compromised_at` stay accepted with the marker. No retroactive rejection without a review record.

## Privacy, retention, abuse
Outbox rows hold IDs and counters only. Retried events are not logged with payload.

## Observability & budgets
`fed_sign_retries_total`, `fed_outbox_held_total{reason}`. Budgets in PS-085-08.

## Tests
- TEST-PS-085-06-01 (integration): sign failure injected; event not exported; retry succeeds; batch contains event once.
- TEST-PS-085-06-02 (unit): retry schedule matches 1, 2, 4 … 300 s cap; 10th failure produces `held`.
- TEST-PS-085-06-03 (integration): key rotation during export signs with the key in force at `occurred_at`.
- TEST-PS-085-06-04 (integration): revocation 1 s before export; unsent event held.
- TEST-PS-085-06-05 (property): retried sign returns identical bytes for 1,000 random events.

## Acceptance criteria
1. No unsigned federated event leaves the node; TEST-PS-085-06-01 passes.
2. Retry schedule and hold behavior match the table; TEST-PS-085-06-02 passes.
3. Rotation and revocation edge cases are deterministic; TEST-PS-085-06-03 and -04 pass.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: retry and timeout values above (F15 to confirm).
- PROVISIONAL (D01 default, unapproved): explicit opt-in before any event is signed for export.
- D08 not applicable: signing is server-side.
