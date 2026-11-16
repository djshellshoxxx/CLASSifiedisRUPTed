# PS-002-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03 idempotency, R04 time bounds, atomic commit), CTR-ERR-001 (retry guidance), CTR-ID-001 (client-generated IDs), CTR-SCH-001 (R06 pending entries).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-06.R01 | For one (`acc_`, `listing.create`, key), at most one draft and one event exist, whatever the number of retries. | MVP |
| PS-002-06.R02 | Record, event and idempotency row commit atomically (PS-002-01 R07). | MVP |
| PS-002-06.R03 | Clients reuse the same key on every retry. Backoff: base 500 ms, cap 60 s, full jitter (CTR-ERR-001). | MVP |
| PS-002-06.R04 | Server commit deadline 5 s (ASSUMPTION). Missing the deadline returns `SYS.UNAVAILABLE`; no partial state is visible. | MVP |
| PS-002-06.R05 | Idempotency rows are kept 7 days (CTR-EVT-001 R03, ASSUMPTION). Offline replays older than 7 days are refused with `EVT.TIMESTAMP_OUT_OF_RANGE`. | MVP |
| PS-002-06.R06 | Offline creates stay in a local pending queue until relay ack. Acks are sent only after commit (D08). Non-retryable errors move the entry to `not_applied`. Entries are not discarded. | MVP |
| PS-002-06.R07 | A client-generated `lst_` ID that already exists returns `ID.MALFORMED` (diagnostic `duplicate`). The client then creates a new `listing_id` and a new key. It never reuses the old key with a new body. | MVP |
| PS-002-06.R08 | The request digest includes `listing_id` when the client supplies one. Same key with a changed digest returns `EVT.IDEMPOTENCY_KEY_REUSED`. | MVP |
| PS-002-06.R09 | Creates with distinct keys do not lock each other. Parallel creates of one body still yield separate drafts. | MVP |
| PS-002-06.R10 | Create has no external side effects and moves no money, so no compensation step is needed. | MVP |

## Data / schema
Idempotency row: `(actor_ref, command, key)`, `request_digest`, `result` (`listing_id`, `revision`), `expires_at` (commit + 7 days).

## Commands / queries / events
Applies to `listing.create` (PS-002-04). Replays return the stored result and emit no event.

## States & transitions
See PS-002-03 rows for replays, key reuse and in-flight requests.

## Validation & errors
`SYS.UNAVAILABLE` (retryable), `SYS.PRECONDITION_FAILED` (retryable, in-flight), `EVT.IDEMPOTENCY_KEY_REUSED`, `EVT.TIMESTAMP_OUT_OF_RANGE`, `ID.MALFORMED`, `SCH.UNKNOWN_VERSION`.

| Scenario | Server behavior | Client action |
|---|---|---|
| Request lost before receipt | No write | Retry, same key |
| Response lost after commit | Replay returns original result | Retry, same key |
| Commit fails | Rollback; `SYS.UNAVAILABLE` | Retry with backoff |
| Offline replay after 7 days | `EVT.TIMESTAMP_OUT_OF_RANGE` | Mark `not_applied` |
| Client `lst_` collision | `ID.MALFORMED` (duplicate) | New ID and key |
| Unknown major version | `SCH.UNKNOWN_VERSION` | Keep pending; "client upgrade required" |

## Authorization
Re-authorized at commit. Replays by a different principal are denied, since keys are scoped per actor.

## Privacy, retention, abuse
Idempotency rows hold digests, not content. Retention RET-OPS (PS-002-07). Repeated key reuse from one actor is an abuse signal (PS-002-07).

## Observability & budgets
Metrics: `lst_create_replays_total`, `lst_create_offline_rejections_total{code}`, `evt_idempotency_reuse_total`. Alert: rejections by `EVT.TIMESTAMP_OUT_OF_RANGE` above 1% of offline replays (clock skew signal).

## Tests
- TEST-PS-002-06-01 (integration): 20 retries with one key after a dropped response yield one `lst_` and one event.
- TEST-PS-002-06-02 (offline): queued create replayed after reconnect yields one draft; replay at 8 days returns `EVT.TIMESTAMP_OUT_OF_RANGE` and shows `not_applied`.
- TEST-PS-002-06-03 (concurrency): 50 parallel creates with one key and body yield one record; with changed bodies, one commits and 49 get `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-002-06-04 (fault injection): kills at each commit step leave no partial record.

## Acceptance criteria
1. Zero duplicate drafts in all retry and replay fixtures.
2. Each row of the scenario table gives the stated result.
3. Offline queue entries are never silently dropped (fixture count matches).
4. TEST-PS-002-06-01 to -04 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay ack.
- ASSUMPTION: 5 s commit deadline and 7-day key window.
- Residual risk: a retry after 7 days of an online create (no offline queue) can create a second draft. Client retries stop at the key window.
