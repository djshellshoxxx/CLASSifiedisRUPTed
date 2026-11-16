# PS-116-01 — Domain schema: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-01.R01** An OutboxEntry stores the destination, kind (statement or relay_command), the prepared payload, the dedupe identity (statement cid or Idempotency-Key), optional expectedRevision, principal, a monotonic sequence number, sync state, attempt counter, receipts and timestamps, with ids per CTR-ID-001.
- **PS-116-01.R02** Entries are P2 device-local data held only in the principal's vault, never uploaded as a record, and removed according to the state-specific retention below, with an absolute maximum of 30 days plus 24 h.
- **PS-116-01.R03** The signed payload of a statement is immutable after preparation; only sync bookkeeping changes, and resolving a conflict creates a new prepared statement under a new cid instead of editing the old one.

## Specification

### OutboxEntry

Schema `classrup.platform.outbox_entry/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, generated in the vault |
| principal | string — did:key of the local principal that owns the vault; entries are only shown and sent while that principal is unlocked |
| destination | string — 'relay:<relayId>' or 'direct:<did>' (peer transfer such as QR or file); entries never move between destinations except by explicit user re-route |
| seq | int — vault-wide monotonic counter starting at 1; delivery order within a destination |
| kind | enum — statement \| relay_command |
| statementSchema? | string — e.g. classrup.bazaar.offer_statement/v1; required when kind is statement |
| cid | string — sha256- plus base64url SHA-256 of the JCS payload (CTR-ID-001 ID-3); dedupe identity of a statement |
| payload | json — signed CTR-FED-001 envelope for statements, or { command, input } for relay commands; serialized ≤ 262144 bytes; P3/P4 excluded |
| idempotencyKey? | uuidv7 — required for relay_command, sent as Idempotency-Key (CTR-IDM-001 IDM-1) |
| expectedRevision? | int — present for relay commands that mutate an existing relay resource (IDM-2) |
| aggregateKey | string — '<entity>:<id>' used to hold back later entries behind a blocked one |
| needsPeerAck | boolean — true when completion means a signed peer acknowledgement (offers, consents, proposals); false for relay commands |
| state | enum — prepared \| sending \| transport_acknowledged \| peer_accepted \| completed \| conflict \| failed \| expired \| discarded |
| attempts | int — 0..6, reset to 0 by a manual retry |
| nextAttemptAt? | timestamp — earliest next send, from backoff |
| relayReceipt? | json — { relayId, receiptCid, relayTime, sig } ; relayTime is evidence of that relay's clock only |
| peerAckCid? | string — cid of the verified signed peer acknowledgement (set by platform.outbox.record_peer_ack) |
| lastError? | json — { code, status, retryable, currentRevision?, fields? } from the last response |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| expiresAt | timestamp — createdAt + 604800000 ms for unsent states; extended to ackAt + 2592000000 ms while waiting for a peer |
| updatedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- seq is unique per vault and strictly increasing; delivery never sends an entry before every lower-seq entry for the same destination and aggregateKey has reached a terminal state or transport_acknowledged.
- At most one entry per destination is in sending at a time.
- peer_accepted requires peerAckCid; transport_acknowledged requires relayReceipt; completed is used only when needsPeerAck is false.
- The signed payload and cid of a statement never change after creation, and a terminal entry never changes again.
- The store holds at most 200 entries and 5242880 bytes of payload per principal.

### Storage DDL

```sql
-- IndexedDB (idb 8.0.4), not SQL. Database classrup-outbox, version 1.
-- objectStore 'entries': keyPath 'id'
--   index 'bySeq' on seq (unique), index 'byDestination' on [destination, state, seq], index 'byStatus' on [principal, state]
-- objectStore 'meta': keyPath 'key'; rows { key: 'seqCounter', value: int }, { key: 'storageMarker', value: uuidv7 }, { key: 'lastExportAt', value: timestamp }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed offer statement for relay:r1 and a relay command with expectedRevision 4 | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code and nothing is stored |
| TEST-PS-116-09.T03 | property | PS-116-03.R01, PS-116-01.R02 | random sequences of delivery results, acknowledgements and user actions on one entry | only declared transitions occur, terminal states never change, seq stays strictly increasing |
| TEST-PS-116-09.T21 | integration | PS-116-01.R02, PS-116-08.R01 | storage status with persist() denied, usage 85 percent, last export 31 days ago, and a missing storageMarker | evictionRisk true, exportOverdue true, data-loss warning shown with restore action, no entries fabricated |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [module SPEC](SPEC.md).
