# PS-140-02 — Validation rules: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-02.R01** Every offline test must assert exactly-once effect: the receiving vault applies each statement once, identified by its cid, and a relay command takes effect once under its Idempotency-Key.
- **PS-140-02.R02** Conflict tests must assert that CONFLICT_REVISION or a peer rejection never produces a silent overwrite, that the dialog offers exactly Prepare a new version on theirs (a new entry with a new cid and expectedRevision = currentRevision) and Discard mine, that no option overwrites the peer's signed revision, and that a fork freezes the coordination with no resolve option.
- **PS-140-02.R03** An unsent entry triggers the expiry prompt from day 6 and at 7 days moves to expired with its payload erased; it is never sent afterwards and a send attempt is refused with EXPIRED.
- **PS-140-02.R04** The UI label for an entry is never stronger than the F15.S01.M01 label for its reached state, ranked by CONSISTENCY_STATES (Saved on this device, then Delivered to relay, peer has not confirmed, then Confirmed by peer); an overclaim is for example Confirmed by peer before peer_accepted, or any delivered wording at transport_acknowledged that does not say to relay, and fails with QUALITY_OFFLINE_OVERCLAIM.
- **PS-140-02.R05** Outbox limits are asserted as F15.S01.M01 defines them, at most min(200, the local limit) entries and 5 MiB of payload per principal, and the next enqueue is refused with PLATFORM_OUTBOX_FULL and a visible message, never a silent drop.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Receiving vault applies each queued statement exactly once per cid and a relay command takes effect once per Idempotency-Key | QUALITY_OFFLINE_DUPLICATE_EFFECT |
| V02 | A conflict shows exactly Prepare a new version on theirs and Discard mine, no option overwrites the peer's signed revision, and a fork offers no resolve option | QUALITY_OFFLINE_SILENT_OVERWRITE |
| V03 | Relay-authenticated responses (Authorization-bearing requests, mailbox and private media) are not present in Cache Storage | QUALITY_OFFLINE_AUTH_CACHED |
| V04 | Unsent entries are prompted from day 6, expire at 7 days with payload erased and are never sent after expiry (EXPIRED) | QUALITY_OFFLINE_STALE_REPLAYED |
| V05 | Each retry delay for attempt n is uniform in [0, min(30 s, 500 ms x 2^(n-1))], retryAfterMs is honoured, and after 6 attempts the entry is failed with failureReason retry_exhausted (IDM-4) | QUALITY_OFFLINE_BACKOFF_INVALID |
| V06 | No label is stronger than the F15.S01.M01 label for the reached state | QUALITY_OFFLINE_OVERCLAIM |
| V07 | On vault lock and principal switch keys leave memory, vault data stays encrypted and unreadable until unlock, entries are kept but not sent, relay access tokens are dropped and the image partition is unbound; only Erase vault after an export prompt deletes vault data | QUALITY_OFFLINE_LOCK_UNSAFE |
| V08 | The entry beyond min(200, local limit) or beyond 5 MiB of payload per principal is refused with PLATFORM_OUTBOX_FULL and shown, never silently dropped | QUALITY_OFFLINE_LIMIT_INVALID |
| V09 | Entries for relay destinations carry only ciphertext for P2 and no P3 field, and enqueue of plaintext P2 or of P3 is refused | QUALITY_OFFLINE_PLAINTEXT_QUEUED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | resend one statement and one relay command across 10 connection resets | effect count is exactly 1 in the receiving vault (per cid) and in the relay double (per Idempotency-Key) |
| TEST-PS-140-09.T03 | integration | PS-140-02.R02, PS-140-03.R01 | two devices edit the same entity offline then reconnect | second gets CONFLICT_REVISION and the conflict dialog shows exactly Prepare a new version on theirs and Discard mine; choosing the first enqueues a new entry with a new cid and expectedRevision = currentRevision; no option overwrites the peer's signed revision |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance the fake clock to day 6 and then past 7 days with an unsent entry; separately return a non-retryable error | the day-6 prompt lists the entry with Send now, Keep until expiry and Discard; at 7 days it is expired with payload erased, never sent, and a send attempt gives EXPIRED; the non-retryable error is not retried |
| TEST-PS-140-09.T17 | e2e | PS-140-02.R04 | drive a statement through each sync state, then plant labels Confirmed by peer at transport_acknowledged and Delivered without to relay | each label equals the F15.S01.M01 label for the reached state (transport_acknowledged reads Delivered to relay, peer has not confirmed); both planted labels fail with QUALITY_OFFLINE_OVERCLAIM |
| TEST-PS-140-09.T20 | integration | PS-140-02.R02 | fork_freeze - two conflicting signed promises for one coordination arrive in both orders | coordination frozen; the dialog offers no option that picks a winner; nothing auto-merged |
| TEST-PS-140-09.T21 | integration | PS-140-02.R05 | outbox_full - enqueue 200 entries then one more, and separately a payload that passes 5 MiB for the principal | both refused with PLATFORM_OUTBOX_FULL and a visible message; nothing silently dropped |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
