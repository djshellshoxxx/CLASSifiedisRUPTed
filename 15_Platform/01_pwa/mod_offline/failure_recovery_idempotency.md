# PS-116-06 — Failure recovery and idempotency: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-06.R01** Every relay command is sent with its stored Idempotency-Key and every statement carries its cid so that any number of deliveries takes effect at most once at the destination (CTR-IDM-001 IDM-1, ID-3).
- **PS-116-06.R02** Retry timing follows IDM-4 exactly; only retryable errors and network failures are retried, at most 6 attempts per entry.
- **PS-116-06.R03** A crash between send and receipt leaves the entry recoverable, and a lost peer acknowledgement leaves it in transport_acknowledged rather than claiming acceptance.

## Specification

- **idempotency:** Idempotency-Key (relay commands) or cid (statements) is created at enqueue and persisted in the same IndexedDB transaction as the entry; resend of a sending entry reuses it and the relay replays its stored response for 24 h or ignores the duplicate cid. Conflict resolution that changes the content creates a new key or cid so IDEMPOTENCY_KEY_REUSED never occurs. For relay commands older than 24 h in sending state the target revision is checked first and the entry moves to conflict if it changed.
- **concurrency:** A navigator.locks exclusive lock named classrup-outbox-replay serializes delivery across tabs; without Web Locks an IndexedDB lease row in meta (30 s TTL, renewed every 10 s) is used. This is a local lease inside one vault (IDM-8), not a distributed lock. Entries are sent one at a time per destination in seq order; destinations proceed independently.
- **retries:** Full-jitter exponential backoff per IDM-4: delay = random(0, min(30000, 500 * 2^(attempts-1))) ms, honoring retryAfterMs when larger; stop after 6 attempts and move to failed; Retry now resets attempts.
- **offline:** Domain commands commit to the vault with no network. Detection uses navigator.onLine as a hint only; a send attempt is the truth. While offline or when the relay is stopped no network calls are made and entries stay prepared with status unknown for the peer.
- **partial failure:** If the IndexedDB write of transport_acknowledged fails after a receipt arrived, the entry is resent once more and the destination answers with the duplicate receipt, ending in the correct state without a second effect. If the user-selected relay disappears permanently, entries can be re-routed to another relay or exported; no local record is lost.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T04 | integration | PS-116-03.R02, PS-116-06.R01, PS-116-06.R03 | kill the tab after send and before receipt, restart | entry resent with same cid or Idempotency-Key, stub relay applies once, entry ends transport_acknowledged or completed |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed |
| TEST-PS-116-09.T14 | e2e | PS-116-03.R03, PS-116-06.R03 | two tabs open, device offline, three actions queued, device reconnects, relay then stopped | exactly one tab delivers, order preserved, UI shows Reached relay for delivered entries and unknown for the rest, local data intact |
| TEST-PS-116-09.T19 | contract | PS-116-09.R03, PS-116-06.R02 | IDM-1/IDM-4/IDM-5/IDM-7 conformance suite against the stub relay | all assertions pass including 24 h old sending entry check |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
