# PS-030-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-06.R01 | `dispute.create` idempotent on (actor, command, key) for 24 h; same key with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. | MVP |
| PS-030-06.R02 | F09 call timeout 5 s. Unknown outcome: retry with the same key up to 3 times, backoff 1 s/2 s/4 s ±20%. | MVP |
| PS-030-06.R03 | After retries exhausted, link stays `requested`; reconciliation job queries F09 by key every 5 min for 1 h, then sets `refused` with `DISPUTE.UNRESOLVED` (ASSUMPTION). | MVP |
| PS-030-06.R04 | Two participants open simultaneously: F09 issues one `dispute_ref`; the second receives `DISPUTE.DUPLICATE_OPEN` with that ref. | MVP |
| PS-030-06.R05 | Local link row and `link_opened` event commit together; no event without row. | MVP |
| PS-030-06.R06 | Evidence and response commands use `expected_revision` on the F09 record; mismatch → `EVT.REVISION_CONFLICT`. | MVP |
| PS-030-06.R07 | Dispute opening is online-only. Drafts (reason, note) may be kept locally (D08 PROVISIONAL) and are discarded on sign-out. | MVP |

## Data / schema
Idempotency record per CTR-EVT-001 R03 with request digest; retained 24 h. Reconciliation state: `(idempotency_key, attempts, next_check_at)`.

## Commands / queries / events
Retry matrix in [commands_queries_events.md](commands_queries_events.md). `DISPUTE.UNRESOLVED` retryable = false (client must re-submit with a new key only after reconciliation says no record exists).

## States & transitions
Recovery moves `requested` → `opened` or `refused` only ([workflow_state_machine.md](workflow_state_machine.md)).

## Validation & errors
`DISPUTE.UNRESOLVED` (retryable false), `SYS.UNAVAILABLE` (retryable true).

## Authorization
Replays re-check participant capability unless a stored result is returned.

## Failure, idempotency, concurrency, offline
Partial failure matrix:
| Failure point | Outcome |
|---|---|
| Before F09 call | nothing written; retry safe |
| After F09 commit, before ack | reconciliation finds ref; link set `opened` |
| After ack, before local write | retry returns existing ref; no duplicate |
| Client offline | open refused; draft kept |

## Privacy, retention, abuse
Reconciliation logs carry key hash, not key. Attempt counts only.

## Observability & budgets
Metrics: `dispute_create_total{result}`, `dispute_reconcile_total{outcome}`. Alert on any `DISPUTE.UNRESOLVED` (ASSUMPTION).

## Tests
- TEST-PS-030-06-01 integration: F09 timeout after commit yields one `opened` link.
- TEST-PS-030-06-02 integration: concurrent opens yield one `dispute_ref`.
- TEST-PS-030-06-03 fault injection: crash between F09 ack and local write, then replay.
- TEST-PS-030-06-04 offline: open attempt refused with no queued command.

## Acceptance criteria
1. No double-count of claim transitions after any injected fault.
2. Every `requested` link is resolved to `opened` or `refused` within 1 h.
3. Offline opens never enter the queue.

## Assumptions & open decisions
- ASSUMPTION: 5 s timeout, 3 retries, 1 h reconciliation window.
- D08 (offline writes) PROVISIONAL: drafts only.
- Payment checklist applies: a settlement claim is moved to `DISPUTED` at most once per window (CTR-COM-001 R13 append-only).
