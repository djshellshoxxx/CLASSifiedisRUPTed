# PS-116-04 — Commands, queries and events: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-04.R01** Every command here is a vault-local command with actor = unlocked local principal; none is a relay command and none produces a signed statement itself, although the entries it manages carry statements produced by other modules.
- **PS-116-04.R02** The module produces no domain events leaving the device and emits only local UI notifications over the BroadcastChannel classrup-outbox (CTR-EVT-001 EVT-8).
- **PS-116-04.R03** Relay responses are interpreted only through CTR-ERR-001 fields so that new error codes need no code change here.
- **PS-116-04.R04** Destination strings, relayId, relay receipts (classrup.platform.relay_receipt/v1), key history and restore announcements use the formats defined by F15.S02.M01 and F15.S03.M03; this module verifies them and never issues them.
- **PS-116-04.R05** The acknowledger role and privacy class of every queued statement schema come from the F11.S01.M01 statement registry (N2); this module acts only on acknowledgements that the receiving path verified and that pass V09.
- **PS-116-04.R06** Enqueue is available to other modules only as OutboxPort.enqueue(tx, entry) inside their own F15.S02.M03 transaction, and the vault-local command platform.outbox.enqueue wraps the same call in a transaction of its own for entries without a domain record.
- **PS-116-04.R07** platform.storage.get_status reports persistence, quota, eviction risk and export age, with exportOverdue = exportAgeDays > exportOverdueThresholdDays, where the threshold is 30 days when storage is persisted and 7 days otherwise (CTR-IOX-001 IOX-6; used by F15.S01.M03).
- **PS-116-04.R08** Federation statements are delivered only through the FederationTransportPort that F11.S02.M01 registers in the kernel port registry at vault composition (inverted registration, because F11.S02.M01 depends on this module), called with the entry's destination descriptor and needsPeerAck, and this module is the only vault-side outbox for them; relay commands use the relay transport of F15.S02.M01 destinations.
- **PS-116-04.R09** The sync chip, its accessible name and the outbox sheet derive one SyncState per item through syncStateOf(entry) - local_committed for a committed record without an entry, otherwise the entry state, except that an expired entry with expiredOutcome unconfirmed shows transport_acknowledged - and render it only from the shared catalog keys sync.state.<value> with {transport} naming the relay display name or the peer's device directly, so the visual text equals the F14.S01.M02 spokenSync text.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.outbox.enqueue` | platform.outbox.enqueue | { destination, destinationDescriptor?, needsPeerAck?, kind, payload, statementSchema?, recipientDid?, idempotencyKey?, expectedRevision?, resourceId?, aggregateKey } — vault-local command; OutboxPort.enqueue(tx, entry) inside the caller's storage.transaction(fn), used by F11.S02.M01 routing for federation statements with the descriptor; acknowledger, privacyClass and replaySafety are read from the registries, never from input, and an input needsPeerAck must equal the registry value (V17) | { entryId, seq, cid, expiresAt } | PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_CLASS_FORBIDDEN, PAYLOAD_TOO_LARGE, PLATFORM_OUTBOX_FULL, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, UNAUTHENTICATED, VALIDATION_FAILED |  | no |
| `platform.outbox.deliver` | platform.outbox.deliver | { entryId?, destination? } (omit to deliver everything eligible) — vault-local command that calls the F11.S02.M01 FederationTransportPort for federation statements (with destinationDescriptor and needsPeerAck) and the relay transport for relay commands, applies verified restore announcements and key changes first, skips held entries and never sends direct destinations | { sent, transportAcknowledged, completed, peerAccepted, pending, held, conflict, failed, frozenRelays: relayId[] } | UNAUTHENTICATED, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.outbox.export_direct` | platform.outbox.export_direct | { entryId, format: qr\|file } — vault-local command for a direct:<did> entry in prepared, after a user gesture | { entryId, state: prepared, exportedAt, bytes (QR frames or file) } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.outbox.record_peer_ack` | platform.outbox.record_peer_ack | { entryId, ackCid, verification: { signerDid, keyId, keyStatus: active, checkedAt } } — vault-local command called by the statement ingest path after signature verification and the F07.S02.M01 key_status check; V09 is checked against the stored ack statement | { entryId, state: peer_accepted } | NOT_FOUND, CONFLICT_STATE, PLATFORM_OUTBOX_ACK_MISMATCH |  | yes (Idempotency-Key) |
| `platform.outbox.resolve` | platform.outbox.resolve | { entryId, resolution: rebase\|retry\|reroute, newDestination?, newDescriptor?, cause?: user\|recipient_moved } — vault-local command; rebase asks the owning module to sign a new statement and enqueue it as a new entry; reroute creates a new entry for newDestination or, for a federation statement, newDescriptor (F11.S02.M01 calls it with cause recipient_moved for prepared, held or failed recipient_mailbox entries after a recipient moved); both discard the old entry | { entryId, state, newEntryId? } | NOT_FOUND, CONFLICT_STATE, EXPIRED, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, PLATFORM_OUTBOX_NOT_DELIVERABLE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `platform.outbox.discard` | platform.outbox.discard | { entryId } — vault-local command | { entryId, state: discarded } | NOT_FOUND, CONFLICT_STATE, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.storage.request_persistence` | platform.storage.request_persistence | {} — vault-local command calling navigator.storage.persist() after a user gesture | { persisted: boolean } | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.storage.record_export` | platform.storage.record_export | { exportedAt, sha256 } — vault-local command called by F10.S01.M03 after a vault export completes | { lastExportAt } | VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.outbox.list` | platform.outbox.read | { destination?, state?: unsent\|conflict\|failed\|all, limit ≤ 200 } | { items: OutboxEntry[] } ordered by seq ascending; payloads only for entries not yet expired | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| `platform.outbox.count_by_state` | platform.outbox.read | { aggregateKey? } | { prepared, held, sending, transportAcknowledged, completed, peerAccepted, conflict, failed, expiredUnsent, expiredUnconfirmed, expiringWithin24h } | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| `platform.storage.get_status` | platform.storage.read_status | { } (no input) | { persisted, usageBytes, quotaBytes, usageRatio, lastExportAt?, exportAgeDays?, exportOverdueThresholdDays (persisted ? 30 : 7), exportOverdue (exportAgeDays > exportOverdueThresholdDays), evictionRisk (not persisted or usageRatio > 0.8), markerOk } |  |

### Events produced

_None._

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.completed` | delete every remaining OutboxEntry and outbox meta row of the deleted principal and confirm the DeletionPort plan is empty; the outbox holds no evidence, so nothing is pseudonymized |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_OUTBOX_NOT_DELIVERABLE | 409 | no | entry is not a locally signed registered statement or a registered deliverable relay command with declared replay safety, or a P2 statement for a relay is not an end-to-end encrypted envelope for the recipient's mailbox |
| PLATFORM_OUTBOX_CLASS_FORBIDDEN | 422 | no | the statement schema or a payload field is classified P3 or P4 (or unclassified) and may never be queued |
| PLATFORM_OUTBOX_FULL | 409 | no | the entry cap (200 or the lower local limit) or 5 MiB of queued payload reached for this principal |
| PLATFORM_OUTBOX_STORAGE_UNAVAILABLE | 503 | no | IndexedDB is blocked, full or unavailable on this device; the enclosing domain transaction rolled back |
| PLATFORM_OUTBOX_ACK_MISMATCH | 422 | no | peer acknowledgement does not cover this entry's cid or is not signed by the registered acknowledger with an authorized key |
| PLATFORM_OUTBOX_REPLAY_UNSAFE | 409 | no | relay command first attempted more than 23 h ago may already have been applied and has no revision, deterministic id or read-back to prove otherwise |
| PLATFORM_OUTBOX_RECEIPT_INVALID | 502 | yes | relay receipt or restore announcement does not verify against the relay's key history, destination or sent digest |
| PLATFORM_OUTBOX_RELAY_FROZEN | 409 | no | the relay's key history shows equivocating rotations or no valid key; delivery to it is paused |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements queued here are produced and signed by their owning modules, which register schema, signer role, audience and class in F11.S01.M01 (N2); acknowledger counterparty follows from audience participants. Federation statements are routed by F11.S02.M01 and delivered through its FederationTransportPort, found in the kernel port registry (no depends_on edge, since F11.S02.M01 depends on this module). syncStateOf(entry) -> SyncState is the one mapping the chip and F14.S01.M02 spokenSync share. This module issues no statement; it verifies relay receipts (classrup.platform.relay_receipt/v1, signer role relay_identity), relay key history and restore announcements (classrup.platform.relay_restore/v1) defined by F15.S02.M01 and F15.S03.M03.

### Example

```
// offline: user sends an offer; record and entry commit in one F15.S02.M03 transaction
storage.transaction(async (tx) => { tx.repo('bazaar.offer_record').put(offer);
  return outbox.enqueue(tx, { destination: "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk/mailbox/mbx_9f2", kind: "statement",
    statementSchema: "classrup.bazaar.offer/v1", recipientDid: "did:key:z6MkSeller", payload: { /* E2E envelope */ },
    aggregateKey: "listing:0192f3a4-5b6c-7d8e-9f01-23456789abcd" }) })
-> { entryId: "0192f400-0000-7000-8000-000000000001", seq: 17, cid: "sha256-Xq1...", expiresAt: "2026-11-11T10:00:00.000Z" }
// online: mailbox put returns classrup.platform.relay_receipt/v1 { relayId, keyId: "relay:7k3m...#k2", destination, digest = sentDigest, epoch: 0, seq: 88121 }
//   -> V14 passes -> transport_acknowledged ("Delivered to relay, peer has not confirmed")
// seller's vault returns an acknowledgement over cid sha256-Xq1... signed by did:key:z6MkSeller -> record_peer_ack -> V09 -> peer_accepted
// seller accepts: comms.consent.sign produces classrup.comms.consent/v1 (statementKey consent.bazaar.offer.accept.v1), queued to the buyer's mailbox
//   { statementSchema: "classrup.comms.consent/v1", destinationDescriptor: { kind: "recipient_mailbox", recipientDid: "did:key:z6MkBuyer", mailboxId: "mbx_41c", relayId: "relay:7k3m..." } }
// public listing: F11.S02.M01 routes classrup.bazaar.listing/v1 with { kind: "selected_relay", relayId: "relay:7k3m..." }, needsPeerAck false
//   -> FederationTransportPort receipt outcome accepted -> V14 -> completed ("Delivered to relay Old Town Swap, no peer confirmation needed")
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T08 | unit | PS-116-04.R01, PS-116-04.R02 | all commands and queries called | contract of input/output holds, no domain event is produced and no network call is made by local-only commands |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |
| TEST-PS-116-09.T16 | integration | PS-116-04.R01, PS-116-03.R03 | two vaults send conflicting acceptances for one reservation; receiving module reports the fork | entry becomes conflict, affected coordination frozen, no winner chosen |
| TEST-PS-116-09.T21 | integration | PS-116-04.R07, PS-116-08.R01 | storage status with persist() denied and last export 8 days ago; then persisted with last export 31 days ago; usage 85 percent and a missing storageMarker | threshold 7 and exportOverdue true; threshold 30 and exportOverdue true; evictionRisk true; data-loss warning with restore action; no entries fabricated |
| TEST-PS-116-09.T27 | integration | PS-116-03.R02, PS-116-04.R05 | publication with audience public (acknowledger none): verified receipt with outcome accepted; second publication refused by the relay with a signed reason | first ends completed without any peer acknowledgement; second ends failed with failureReason relay_rejected and the reason cid that F01.S01.M03 shows as relay_rejected |
| TEST-PS-116-09.T31 | contract | PS-116-02.R02, PS-116-02.R06, PS-116-04.R04 | receipt for mailbox A presented for an entry to mailbox B; receipt with a wrong digest; receipt by retired key k1; receipt by k3 stored before and after its revocation; key history with two rotations from the same prevKeyId | wrong mailbox and wrong digest rejected with PLATFORM_OUTBOX_RECEIPT_INVALID; k1 verifies; k3 accepted only when stored before revokedAt; equivocation freezes the relay with PLATFORM_OUTBOX_RELAY_FROZEN |
| TEST-PS-116-09.T32 | integration | PS-116-07.R04, PS-116-04.R06 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for P1 | section platform.outbox lists counts only with field classes; deletion plan lists P1's entries and execution removes them; purge applies the retention rules; no P1 row remains |
| TEST-PS-116-09.T33 | unit | PS-116-02.R01, PS-116-04.R06 | LocalSettings.localLimits.maxOutboxEntries set to 50 and 50 entries queued | the 51st enqueue returns PLATFORM_OUTBOX_FULL and its domain record rolls back |
| TEST-PS-116-09.T34 | integration | PS-116-01.R05, PS-116-02.R07, PS-116-04.R08 | F11.S02.M01 routes a public listing to selected relay r1 and an offer to C1's recipient mailbox; then enqueue with needsPeerAck true for the listing, a recipient_mailbox descriptor for a public statement and a descriptor whose mailbox differs from destination | descriptors stored and destinations derived ('relay:r1...', 'relay:r1.../mailbox/mbx_1'); acknowledger none for the listing and counterparty for the offer; deliver passes the descriptor and needsPeerAck false or true to the FederationTransportPort stub; the three bad inputs are refused with VALIDATION_FAILED and roll back |
| TEST-PS-116-09.T37 | unit | PS-116-04.R09 | syncStateOf and the chip for local_committed and the nine states (relay and direct transports), and for an expired unconfirmed entry, in en and de | every text comes from sync.state.<value>, equals the spokenSync reference text, names 'relay Old Town Swap' or 'the peer's device directly', and the expired unconfirmed entry uses the transport_acknowledged key |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, F14.S02.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
