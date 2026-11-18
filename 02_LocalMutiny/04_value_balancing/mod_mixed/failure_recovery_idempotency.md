# PS-026-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-06.R01 | Duplicate commands with the same (actor, command, key) return the original response within 24 h. | MVP |
| PS-026-06.R02 | Concurrent declarations on one revision: exactly one succeeds; others receive `SYS.CONFLICT` with the current revision number. | MVP |
| PS-026-06.R03 | Claim submission is two-phase: `clm.submit` first, then leg update referencing `claim_id`. A crash between them is repaired by reconciliation within 5 min. | MVP |
| PS-026-06.R04 | Declared but unsubmitted legs never block the other party's withdrawal of consent for the revision. | MVP |
| PS-026-06.R05 | Offline declarations are held in the local pending queue until server acknowledgement (D08); on rejection, the user sees the server error code. | MVP |

## Data / schema
Idempotency record: (actor `acc_`, command type, key, request digest SHA-256, result revision, created_at). Retained 24 h (ASSUMPTION). Reconciliation record: (`cyc_`, leg_index, `claim_id` or null, attempted_at).

## Commands / queries / events
Retries use the same key. Reconciliation job emits `mixed.leg.claim_submitted` when it repairs a missing link.

## States & transitions
Recovery moves a leg from SUBMITTED-without-link back to the state implied by the claim (CTR-COM-001 R06: a party's own claim never advances past `CLAIMED` on its own).

## Validation & errors
Retry-safe codes: `SYS.UNAVAILABLE` (503, retryable true), `MIXED.QUOTE_EXPIRED` (412, retryable true after re-quote). Non-retryable: validation codes.

## Authorization
Reconciliation runs as `sys_` with `cyc.execute` scope `global`, no content read.

## Failure, idempotency, concurrency, offline
- Timeout on command: client retries with same key (max 5, exponential backoff 1 s to 30 s, jittered).
- Revision conflict: client reloads revision and re-applies its diff; it never silently overwrites.
- Relay failure: pending queue persists until ack (D08). Expired quotes in queued legs are re-validated server-side on ack.
- Partial failure: no platform compensation of money exists. Recovery is a `DISPUTED` path through F09 (CTR-COM-001 R16).

## Privacy, retention, abuse
Reconciliation logs contain IDs and counts only. Idempotency records hold digests, not request bodies.

## Observability & budgets
Metrics: `mixed_idempotent_replays_total`, `mixed_reconciliation_repairs_total`, `mixed_queue_pending_age_seconds` (alert p95 > 1 h). Retry budget: 5 attempts per command.

## Tests
- TEST-PS-026-06-01 (integration): duplicate key returns identical body.
- TEST-PS-026-06-02 (concurrency): 50 parallel declares on one revision → exactly 1 success.
- TEST-PS-026-06-03 (fault injection): kill process between `clm.submit` and leg update; reconciliation links claim within 5 min.
- TEST-PS-026-06-04 (offline): queued declare rejected on ack after quote expiry; no silent apply.

## Acceptance criteria
1. Fault-injection test suite passes for submit/update crash points.
2. No code path retries a non-retryable code.
3. Pending queue shows the server-side error to the user, never a success state.

## Assumptions & open decisions
- ASSUMPTION: 5-minute reconciliation interval; 24-hour idempotency retention.
- PROVISIONAL: partial barter execution uses explicit attestations and compensating recovery (D04 default, unapproved). PROVISIONAL: offline writes pending until acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
