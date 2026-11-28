# PS-116-06 — Failure recovery and idempotency: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-06.R01** Every relay command is sent with its stored Idempotency-Key and every statement carries its cid, so deliveries inside the relay's 24 h idempotency window take effect at most once; after 23 h from firstAttemptAt a relay command is resent only with expectedRevision, a deterministic resourceId with create-if-absent semantics or a read-back showing no effect, and otherwise moves to conflict with "may already have been applied" (CTR-IDM-001 IDM-1, CTR-FED-001 FED-7).
- **PS-116-06.R02** Retry timing follows IDM-4 exactly; only retryable errors and network failures are retried, at most 6 attempts per entry.
- **PS-116-06.R03** A crash between send and receipt leaves the entry recoverable, and a lost peer acknowledgement leaves it in transport_acknowledged rather than claiming acceptance.
- **PS-116-06.R04** Receipts that a verified restore announcement of the destination relay declares lost return the entry to prepared, and it is resent with the same cid or Idempotency-Key, so data a restored relay lost is delivered again.

## Specification

- **idempotency:** Idempotency-Key (relay commands) or cid (statements) is created at enqueue and persisted in the same F15.S02.M03 transaction as the entry and its domain record; firstAttemptAt is persisted on the first attempt and never reset. Within 23 h of firstAttemptAt any resend reuses the key and the relay replays its stored response (24 h validity) or ignores the duplicate cid. After 23 h, in any state, a relay command is resent only if it carries expectedRevision (a stale revision answers CONFLICT_REVISION), a deterministic resourceId with create-if-absent semantics, or a read_back query run first shows the effect absent; otherwise it moves to conflict with failureReason unsafe_replay and the prompt 'may already have been applied'. Every deliveryEligible relay command must declare one of these at registration (V12). Rebase and reroute create new entries, so IDEMPOTENCY_KEY_REUSED never occurs.
- **concurrency:** A navigator.locks exclusive lock named classrup-outbox-replay serializes delivery across tabs; without Web Locks an F15.S02.M03 lease row (30 s TTL, renewed every 10 s) is used. This is a local lease inside one vault (IDM-8), not a distributed lock. Entries are sent one at a time per destination in seq order; destinations proceed independently. Enqueue shares the domain command's single IndexedDB readwrite transaction.
- **retries:** Full-jitter exponential backoff per IDM-4: delay = random(0, min(30000, 500 * 2^(attempts-1))) ms, honoring retryAfterMs when larger; stop after 6 attempts and move to failed; Retry now resets attempts but not firstAttemptAt.
- **offline:** Domain commands commit to the vault with no network. Detection uses navigator.onLine as a hint only; a send attempt is the truth. While offline or when the relay is stopped no network calls are made and entries stay prepared with status unknown for the peer. Direct transfers work fully offline through Export.
- **partial failure:** If the domain transaction fails, neither the record nor the entry exists. If the IndexedDB write of transport_acknowledged fails after a receipt arrived, the entry is resent once more and the destination answers with the duplicate receipt, ending in the correct state without a second effect. If the destination relay restores an older backup, its signed restore announcement returns covered entries to prepared. If the user-selected relay disappears permanently, entries can be re-routed to another relay or exported; no local record is lost.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T04 | integration | PS-116-03.R02, PS-116-06.R01, PS-116-06.R03 | kill the tab after send and before receipt, restart within 1 h | entry resent with same cid or Idempotency-Key, stub relay applies once, entry ends transport_acknowledged |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed with failureReason retry_exhausted |
| TEST-PS-116-09.T14 | e2e | PS-116-06.R03 | two tabs open, device offline, three actions queued, device reconnects, relay then stopped | exactly one tab delivers, order preserved, UI shows the sync.state text 'Delivered to relay <display name>, ...' for delivered entries and 'Saved on this device only, waiting to send' with relay status unknown for the rest, local data intact |
| TEST-PS-116-09.T19 | contract | PS-116-09.R03, PS-116-06.R02 | IDM-1/IDM-4/IDM-5/IDM-7 conformance suite against the stub relay | all assertions pass including resend inside the 24 h window and the 23 h replay-safety rule |
| TEST-PS-116-09.T25 | integration | PS-116-02.R05, PS-116-06.R01 | relay command without expectedRevision first attempted, failed, retried by the user at 25 h; same with expectedRevision; same with deterministic resourceId; registration of a relay command without replay safety | first moves to conflict with unsafe_replay and the may-already-have-been-applied prompt; second and third are resent once; registration refused with PLATFORM_OUTBOX_NOT_DELIVERABLE |
| TEST-PS-116-09.T29 | integration | PS-116-03.R05, PS-116-06.R04 | stub relay restores a backup and publishes a signed restore announcement covering receipt seq above 88000; another announcement is signed by an unknown key | covered transport_acknowledged entries return to prepared and are resent once with the same cid or Idempotency-Key; the unsigned announcement is ignored with PLATFORM_OUTBOX_RECEIPT_INVALID |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, F14.S02.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
