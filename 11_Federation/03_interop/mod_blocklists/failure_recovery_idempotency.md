# PS-089-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05 dedupe, R10 limits, R13 per-event results), CTR-EVT-001 (R03 idempotency, R02 revision), CTR-CAP-001 (fail closed), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-06.R01 | Check path fails closed: store unavailable or check > 50 ms (ASSUMPTION) → inbound federated events returned `deferred` with `SYS.UNAVAILABLE`; never accepted unchecked. | MVP |
| PS-089-06.R02 | Deferred inbound events retried until the event's `expires_at` or 24 h (ASSUMPTION), whichever first. After that, rejected with `SYS.UNAVAILABLE` and logged. | MVP |
| PS-089-06.R03 | Export retries back off from 1 s to 1 h with ±20% jitter (ASSUMPTION). Export failure older than 24 h raises an alert. Receivers stop enforcing at the entry's `expires_at` regardless of export state. | MVP |
| PS-089-06.R04 | Each import event commits independently. Duplicate `(origin_node, event_id)` returns `duplicate` (CTR-FED-001 R05). Batch response lists per-event results. | MVP |
| PS-089-06.R05 | Blocklist writes are online-only. Offline clients have no write queue and receive `SYS.UNAVAILABLE` on write. D08 is not applicable. | MVP |

## Data / schema
Retry state for deferred events and export cursors stored as operational records, retention RET-OPS (PS-089-07). No new entry fields.

## Commands / queries / events
Idempotency keys per PS-089-04. Replay of same key returns original result (CTR-EVT-001 R03).

## States & transitions
Deferred inbound event: `deferred` → `accepted` | `rejected` (on check pass/fail) or `rejected` after 24 h. Export job: `pending` → `sent` | `retrying`.

## Validation & errors
`SYS.UNAVAILABLE` (retryable, 503) for check failures. `FED.RATE_LIMITED` (retryable) for per-peer limits. `EVT.REVISION_CONFLICT` for concurrency (PS-089-03).

## Authorization
Fail closed per CTR-CAP-001: no decision when grant or policy store is unavailable.

## Failure, idempotency, concurrency, offline
- Timeout: check 50 ms; propose, activate and withdraw 2 s; per-peer export send 10 s (all ASSUMPTION).
- Concurrency: `expected_revision` on activate and withdraw; first commit wins.
- Partial failure: a crash between commit and export enqueue is repaired by an idempotent scan of entries with `activated` events and no export marker.
- Recovery from store restore: PS-089-10.
- Offline: no queue (R05).

## Privacy, retention, abuse
Failure logs carry codes, `blk_` IDs and counts only. Deferred payloads are held encrypted at rest (ASSUMPTION) and purged at deferral end.

## Observability & budgets
`blocklist_check_fail_closed_total`, `blocklist_deferred_inbound_total`, `blocklist_export_retry_total`. Alert: deferred inbound > 1,000 in 5 min (ASSUMPTION).

## Tests
- TEST-PS-089-06-01 (fault): store down → inbound events `deferred`, none `accepted`.
- TEST-PS-089-06-02 (unit): check at 51 ms → fail closed.
- TEST-PS-089-06-03 (integration): duplicate delivery of same `(origin_node, event_id)` → `duplicate`.
- TEST-PS-089-06-04 (integration): concurrent activate race → one commit, one `EVT.REVISION_CONFLICT`.
- TEST-PS-089-06-05 (unit): export backoff schedule matches R03 bounds.
- TEST-PS-089-06-06 (fault): crash between activate commit and export enqueue → export sent exactly once after restart.
- TEST-PS-089-06-07 (offline): client write attempt while offline is not queued.

## Acceptance criteria
1. No inbound federated event accepted while the check path is unavailable; TEST-PS-089-06-01 passes.
2. Duplicate and replay handling match CTR-FED-001 R05; TEST-PS-089-06-03 passes.
3. Crash recovery produces exactly one export; TEST-PS-089-06-06 passes.

## Assumptions & open decisions
- ASSUMPTION: timeouts, backoff and 24 h deferral window.
- PROVISIONAL (D01 default, unapproved): replay protection via CTR-FED-001 dedupe and `expires_at`.
- D08 not applicable (see R05).
