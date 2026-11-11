# PS-116-02 — Validation rules: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-02.R01** Enqueue validates destination, delivery eligibility, size, quota, privacy class and signature presence before writing, inside the caller's storage.transaction(fn); on a violation nothing is stored and the domain record rolls back with it.
- **PS-116-02.R02** Delivery classifies every relay response into receipt, retryable, conflict, relay rejection or failed using only the code, status and retryable flag from CTR-ERR-001, and accepts a receipt only after it verifies against the destination relay's published key set.
- **PS-116-02.R03** A peer acknowledgement is accepted only when it is a verified signed statement over exactly this entry's cid, signed by the DID or relay that the statement registry names as acknowledger, with a key authorized for that DID or relay at verification time; otherwise it is refused with PLATFORM_OUTBOX_ACK_MISMATCH.
- **PS-116-02.R04** Statements registered at class P2 or higher are accepted for a relay destination only as end-to-end encrypted envelopes addressed to the recipients' mailbox keys, and schemas or fields classified P3 or P4 are never queued (CTR-PRV-001 PRV-5).
- **PS-116-02.R05** Every deliveryEligible relay command declares its replay safety, and a relay command first attempted more than 23 h ago is resent only when that replay safety holds; otherwise it moves to conflict.
- **PS-116-02.R06** Relay key revocations, rotations and restore announcements are used only after their signatures verify against the relay's key history, and a relay whose key history equivocates is frozen for delivery.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kind is statement with a CTR-FED-001 envelope whose signature the local principal made and whose schema is registered in F11.S01.M01, or relay_command registered deliveryEligible by its owning module | PLATFORM_OUTBOX_NOT_DELIVERABLE |
| V02 | JSON.stringify(payload) is ≤ 262144 bytes | PAYLOAD_TOO_LARGE |
| V03 | principal entry count is < min(200, LocalSettings.localLimits.maxOutboxEntries of F15.S04.M03) and payload bytes + new payload ≤ 5242880 | PLATFORM_OUTBOX_FULL |
| V04 | relay_command idempotencyKey is a UUIDv7 unique in the store; statement cid is unique per destination among non-terminal entries | VALIDATION_FAILED |
| V05 | destination is a canonical F15.S02.M01 destination string of a relay the user selected, or direct:<did> | VALIDATION_FAILED |
| V06 | the vault is unlocked and entry principal equals the unlocked principal | UNAUTHENTICATED |
| V07 | the F15.S02.M03 IndexedDB transaction opened and committed | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| V08 | unsent entry is not older than 7 days at send time | EXPIRED |
| V09 | the acknowledgement statement's payload.cid equals entry.cid; its signer equals entry.recipientDid (acknowledger counterparty) or the destination relayId (acknowledger destination_relay); and the signing key was active for that DID at verification time (the key_status fact of F07.S02.M01 that the ingest path supplies with the verified ack reference), or is an active or retired, non-revoked key in the relay's published key set | PLATFORM_OUTBOX_ACK_MISMATCH |
| V10 | when privacyClass is P2 or higher and the destination is a relay destination, the payload is an end-to-end encrypted envelope whose recipient key set equals the mailbox keys of recipientDid and the destination is that recipient's mailbox; otherwise nothing is stored | PLATFORM_OUTBOX_NOT_DELIVERABLE |
| V11 | neither the statement schema nor any payload field is classified P3 or P4 by F10.S02.M02 (unclassified fields count as P3) | PLATFORM_OUTBOX_CLASS_FORBIDDEN |
| V12 | a relay_command registration declares replaySafety expected_revision (with expectedRevision), deterministic_id (with resourceId and create-if-absent semantics) or read_back (with a registered read query) | PLATFORM_OUTBOX_NOT_DELIVERABLE |
| V13 | a relay_command whose firstAttemptAt is more than 82800000 ms (23 h) ago, in any state, is sent only with expectedRevision, with a deterministic resourceId, or after its read_back query shows the effect is absent; otherwise the entry moves to conflict with failureReason unsafe_replay | PLATFORM_OUTBOX_REPLAY_UNSAFE |
| V14 | a relay receipt is a classrup.platform.relay_receipt/v1 whose signature under context classrup-relay-receipt:v1 verifies with keyId from the relay's published key set (active or retired; a revoked key only if the receipt was stored before the revocation's revokedAt), whose relayId and destination equal the entry's, and whose digest equals sentDigest | PLATFORM_OUTBOX_RECEIPT_INVALID |
| V15 | the destination relay's key history has no two rotation statements with the same prevKeyId and no revocation of every published key; otherwise delivery to that relay is frozen | PLATFORM_OUTBOX_RELAY_FROZEN |
| V16 | a restore announcement classrup.platform.relay_restore/v1 is applied only when signed under context classrup-relay-restore:v1 by a non-revoked key of the same relayId | PLATFORM_OUTBOX_RECEIPT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed listing statement for relay:r1 and a relay command with expectedRevision 4 inside a domain transaction | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, acknowledger and privacyClass from the registry, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code, nothing is stored and the enclosing domain record rolls back |
| TEST-PS-116-09.T05 | integration | PS-116-03.R02, PS-116-02.R03 | relay receipt arrives, then an acknowledgement signed by a non-counterparty key, then the real one | forged ack rejected with PLATFORM_OUTBOX_ACK_MISMATCH; entry stays transport_acknowledged until the real ack gives peer_accepted |
| TEST-PS-116-09.T06 | integration | PS-116-03.R03, PS-116-02.R02 | entry 3 gets 409 CONFLICT_REVISION; entries 4 (same aggregate) and 5 (other aggregate) queued | 3 becomes conflict, 4 waits, 5 is sent; nothing merged |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed with failureReason retry_exhausted |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |
| TEST-PS-116-09.T23 | abuse | PS-116-02.R03, PS-116-03.R04 | after a rebase of entry E (old cid A, new cid B) C1 replays its ack over A for the new entry; C2 (same cycle) signs an ack over B; C1 signs over B with a key revoked before verification | all three rejected with PLATFORM_OUTBOX_ACK_MISMATCH; only C1's ack over B with an active key gives peer_accepted |
| TEST-PS-116-09.T24 | abuse | PS-116-02.R04, PS-116-07.R01 | enqueue a plaintext P2 offer for a relay mailbox, an E2E envelope whose recipients differ from the seller's mailbox keys, a statement with a P3 address field, and a correct E2E envelope | PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_CLASS_FORBIDDEN, nothing stored for those; the correct envelope is stored |
| TEST-PS-116-09.T25 | integration | PS-116-02.R05, PS-116-06.R01 | relay command without expectedRevision first attempted, failed, retried by the user at 25 h; same with expectedRevision; same with deterministic resourceId; registration of a relay command without replay safety | first moves to conflict with unsafe_replay and the may-already-have-been-applied prompt; second and third are resent once; registration refused with PLATFORM_OUTBOX_NOT_DELIVERABLE |
| TEST-PS-116-09.T30 | integration | PS-116-01.R04, PS-116-02.R01 | domain command whose enqueue fails V03 and one where IndexedDB aborts the transaction | neither the domain record nor the entry exists; PLATFORM_OUTBOX_FULL and PLATFORM_OUTBOX_STORAGE_UNAVAILABLE returned; no separate outbox database exists |
| TEST-PS-116-09.T31 | contract | PS-116-02.R02, PS-116-02.R06, PS-116-04.R04 | receipt for mailbox A presented for an entry to mailbox B; receipt with a wrong digest; receipt by retired key k1; receipt by k3 stored before and after its revocation; key history with two rotations from the same prevKeyId | wrong mailbox and wrong digest rejected with PLATFORM_OUTBOX_RECEIPT_INVALID; k1 verifies; k3 accepted only when stored before revokedAt; equivocation freezes the relay with PLATFORM_OUTBOX_RELAY_FROZEN |
| TEST-PS-116-09.T33 | unit | PS-116-02.R01, PS-116-04.R06 | LocalSettings.localLimits.maxOutboxEntries set to 50 and 50 entries queued | the 51st enqueue returns PLATFORM_OUTBOX_FULL and its domain record rolls back |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
