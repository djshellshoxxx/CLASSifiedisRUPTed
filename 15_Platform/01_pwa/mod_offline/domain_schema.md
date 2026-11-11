# PS-116-01 — Domain schema: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-01.R01** An OutboxEntry stores the canonical destination, kind (statement or relay_command), the prepared payload, the dedupe identity (statement cid or Idempotency-Key), optional expectedRevision or deterministic resourceId, the acknowledger role, principal, a monotonic sequence number, sync state, attempt counter, firstAttemptAt, receipts and timestamps, with ids and the vault tenantId per CTR-ID-001.
- **PS-116-01.R02** Entries are P2 device-local data held only in the principal's vault and never uploaded as a record; expiresAt is capped at createdAt + 30 days in every state, the payload is erased at expiry, and the payload-free expired stub is deleted 24 h later, so no payload outlives 30 days (RET-SHORT) and no row outlives createdAt + 30 days + 24 h.
- **PS-116-01.R03** The signed payload and cid of an entry are immutable after preparation; only sync bookkeeping changes, and a rebase or reroute discards the old entry (reason superseded or rerouted) and creates a new entry with a new id and seq (and, for a rebase, a new cid) instead of editing the old one.
- **PS-116-01.R04** OutboxEntry rows are the vault's only sync outbox and are written through the F15.S02.M03 transaction(fn) in the vault's single IndexedDB database, so a domain record and its outbox entry always commit or roll back together; this module publishes the one OutboxEntry state machine that every sender uses.

## Specification

### OutboxEntry

Schema `classrup.platform.outbox_entry/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, generated in the vault |
| tenantId | uuidv7 — the vaultId of F15.S04.M03 (CTR-ID-001 ID-6 tenant slot of this vault) |
| principal | string — did:key of the local principal that owns the vault; entries are only shown and sent while that principal is unlocked |
| destination | string — canonical destination string defined by F15.S02.M01: '<relayId>' for relay commands and public statements on that relay, '<relayId>/mailbox/<mailboxId>' for an end-to-end encrypted mailbox put, '<relayId>/index/<indexName>' for an index write, or 'direct:<did>' for a QR or file transfer; relayId is 'relay:' plus 26 lowercase base32 characters |
| seq | int — vault-wide monotonic counter starting at 1; delivery order within a destination |
| kind | enum — statement \| relay_command |
| statementSchema? | string — e.g. classrup.bazaar.offer/v1; required when kind is statement and registered in the F11.S01.M01 statement registry |
| privacyClass | enum — P0 \| P1 \| P2; registered class of the statement schema (F11.S01.M01 registry over F10.S02.M02 field classes) or of the relay command input |
| acknowledger | enum — counterparty \| destination_relay \| none; taken per statement schema from the F11.S01.M01 registry (N2); none for relay commands |
| recipientDid? | string — did:key of the counterparty that must acknowledge, required when acknowledger is counterparty |
| cid | string — sha256- plus base64url SHA-256 of the JCS payload (CTR-ID-001 ID-3); dedupe identity of a statement |
| payload | json — signed CTR-FED-001 envelope (an end-to-end encrypted envelope for P2 to a relay mailbox) or { command, input } for relay commands; serialized ≤ 262144 bytes; erased at expiresAt |
| sentDigest? | string — sha256- plus base64url SHA-256 of the exact request bytes last sent; a relay receipt must carry this digest |
| idempotencyKey? | uuidv7 — required for relay_command, sent as Idempotency-Key (CTR-IDM-001 IDM-1) |
| expectedRevision? | int — present for relay commands that mutate an existing relay resource (IDM-2) |
| resourceId? | string — deterministic, content-derived id of the relay resource for create-if-absent relay commands |
| replaySafety | enum — expected_revision \| deterministic_id \| read_back \| statement_cid; declared by the owning module when it registers the relay command (statement_cid for statements) |
| aggregateKey | string — '<entity>:<id>' used to hold back later entries behind a blocked one |
| state | enum — prepared \| sending \| transport_acknowledged \| peer_accepted \| conflict \| failed \| expired \| discarded |
| attempts | int — 0..6, reset to 0 by a manual retry or a restore announcement |
| firstAttemptAt? | timestamp — local clock time of the first send attempt; kept across retries and resets |
| nextAttemptAt? | timestamp — earliest next send, from backoff |
| relayReceipt? | json — verified classrup.platform.relay_receipt/v1 { relayId, keyId, destination, digest, cid?, receivedAt, epoch, seq, sig }; receivedAt is evidence of that relay's clock only |
| transportAcknowledgedAt? | timestamp — local clock time when the receipt was verified |
| exportedAt? | timestamp — local clock time when direct-transfer bytes were last produced (export prepared) |
| peerAckCid? | string — cid of the verified signed acknowledgement (set by platform.outbox.record_peer_ack) |
| failureReason? | enum — retry_exhausted \| rejected \| relay_rejected \| unsafe_replay; relay_rejected carries the relay's signed reason cid in lastError |
| lastError? | json — { code, status, retryable, currentRevision?, fields?, reasonCid? } from the last response |
| supersedes? | json — { entryId, cid } of the entry this one replaced by a rebase or reroute |
| discardReason? | enum — user \| superseded \| rerouted |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| expiresAt | timestamp — createdAt + 604800000 ms while unsent; min(transportAcknowledgedAt + 2592000000 ms, createdAt + 2592000000 ms) once transport_acknowledged; never later than createdAt + 30 days |
| updatedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- seq is unique per vault and strictly increasing; delivery never sends an entry before every lower-seq entry for the same destination and aggregateKey has reached transport_acknowledged, peer_accepted, discarded or expired.
- At most one entry per destination is in sending at a time; entries with a direct destination are never sent by the delivery loop.
- peer_accepted requires only peerAckCid; transport_acknowledged requires a verified relayReceipt whose destination equals the entry destination and whose digest equals sentDigest.
- The signed payload and cid of an entry never change after creation, and a terminal entry never changes again.
- The store holds at most min(200, LocalSettings.localLimits.maxOutboxEntries) entries and 5242880 bytes of payload per principal.
- expiresAt is never later than createdAt + 30 days, and no payload is retained after expiresAt.
- An entry exists only if the domain record that produced it committed in the same F15.S02.M03 transaction.

### Storage DDL

```sql
-- IndexedDB through the F15.S02.M03 IndexedDB adapter, not SQL: no separate outbox database exists.
-- records rows (tenant = vaultId, type = 'platform.outbox_entry', id = entry id) in the vault's single database,
--   idx1 = seq (zero-padded, unique), idx2 = destination|state|seq, idx3 = principal|state, idx4 = aggregateKey|seq
-- records rows of type 'platform.outbox_meta': { key: 'seqCounter', value: int }, { key: 'storageMarker', value: uuidv7 },
--   { key: 'lastExportAt', value: timestamp }, { key: 'relayView:<relayId>', value: { keySetHash, frozen, restoreEpoch, fetchedAt } }
-- enqueue: storage.transaction(async (tx) => { tx.repo(domainType).put(record); outbox.enqueue(tx, entry) })  // one commit
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed listing statement for relay:r1 and a relay command with expectedRevision 4 inside a domain transaction | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, acknowledger and privacyClass from the registry, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code, nothing is stored and the enclosing domain record rolls back |
| TEST-PS-116-09.T03 | property | PS-116-03.R01, PS-116-01.R02 | random sequences of delivery results, acknowledgements, restore announcements and user actions on one entry | only declared transitions occur, terminal states never change, seq stays strictly increasing, expiresAt never exceeds createdAt + 30 d |
| TEST-PS-116-09.T22 | integration | PS-116-01.R02, PS-116-01.R03, PS-116-07.R02 | entry reaches peer_accepted; another expires; clock advanced 60 s, 24 h and 31 d; every command tried on a stored payload | peer_accepted row deleted after 60 s; expired payload erased at expiry and stub deleted after 24 h; no row older than createdAt + 30 d + 24 h and no payload older than createdAt + 30 d; payload and cid never changed |
| TEST-PS-116-09.T28 | integration | PS-116-03.R04, PS-116-01.R03 | rebase a conflict entry and reroute a prepared entry to relay r2 | old entries discarded with reasons superseded and rerouted; new entries have new id and seq (new cid for the rebase, same cid for the reroute) and passed V04, V05, V10, V11 |
| TEST-PS-116-09.T30 | integration | PS-116-01.R04, PS-116-02.R01 | domain command whose enqueue fails V03 and one where IndexedDB aborts the transaction | neither the domain record nor the entry exists; PLATFORM_OUTBOX_FULL and PLATFORM_OUTBOX_STORAGE_UNAVAILABLE returned; no separate outbox database exists |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [module SPEC](SPEC.md).
