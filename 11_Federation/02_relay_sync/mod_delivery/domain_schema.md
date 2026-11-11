# PS-088-01 — Domain schema: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-01.R01** A PeerOutbox entry (relay only) stores the envelope cid, the destination peer relay as its canonical F15.S02.M01 relayId, state, attempt counters, next attempt time, last error code, the sent digest and the classrup.platform.relay_receipt/v1 receipt, with tenant and revision per CTR-ID-001; vault-side deliveries are F15.S01.M01 OutboxEntry rows whose destination descriptor this module defines.
- **PS-088-01.R02** Entries hold references to envelopes stored by F11.S01.M02 and never copies of payloads, so deleting a record purges its queued delivery content.
- **PS-088-01.R03** Receipt times are stored as evidence of the issuing relay's clock only and are labelled so in the UI.
- **PS-088-01.R04** Vault outbox states and limits (7-day unsent expiry, 30-day acknowledgement wait, attempt counts and the prepared, transport_acknowledged and peer_accepted states of IDM-7) are owned by F15.S01.M01; this module's transport adapter only reports receipts, per-envelope outcomes and acknowledgements to it.
- **PS-088-01.R05** PeerOutbox is limited to relay-to-relay forwarding (destinationKind peer_relay) and is not a vault outbox; it uses the F15.S01.M01 state names where the meaning is the same (prepared, transport_acknowledged, failed) plus the relay-only states delivered, paused and cancelled, and its receipts are classrup.platform.relay_receipt/v1 statements verified like F15.S01.M01 V14.

## Specification

### PeerOutbox

Schema `classrup.federation.peer_outbox/v1` · storage **relay** · privacy **P1** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay tenant |
| cid | string — cid of the public envelope to deliver; ref F11.S01.M02 FederatedRecord or Tombstone |
| kind | enum — record \| tombstone \| control |
| destinationKind | enum — peer_relay (relay to relay only; vault destinations live in F15.S01.M01) |
| destinationId | string — canonical relayId of an active allowlisted peer (F15.S02.M01 form relay:<26 base32 chars>, also the receipt destination); the HTTPS origin is looked up from the Peer record |
| audience | enum — public (participants statements are never queued relay to relay) |
| state | enum — prepared \| transport_acknowledged \| delivered \| paused \| failed \| cancelled |
| pausedReason? | enum — peer_suspended \| flag_off \| federation_killed (F16.S03.M03 sentinel federation_off present) |
| attempts | int — total attempts so far, ≥ 0 |
| roundsCompleted | int — scheduled retry rounds finished, 0..5 |
| nextAttemptAt? | timestamp — when the next attempt is due |
| lastErrorCode? | string — error code of the last failed attempt or the receiver's per-envelope code |
| sentDigest? | string — sha256- plus base64url SHA-256 of the exact envelope bytes last sent; the receipt digest must equal it |
| transportReceipt? | json — {receipt: classrup.platform.relay_receipt/v1 {relayId, keyId, destination, digest, cid?, receivedAt, epoch, seq, sig}, outcome}; relay clock evidence only |
| receiptHistory? | json — earlier receipts moved aside when a verified relay restore announcement covered them, at most 5 |
| expiresAt | timestamp — createdAt + 7 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-terminal entry per (tenantId, cid, destinationId).
- State transport_acknowledged or delivered implies transportReceipt is set and verified (V05) against a key of the destination's pinned key history.
- Every entry is terminal (delivered, failed or cancelled) no later than its expiresAt.
- A PeerOutbox entry exists only for a record or tombstone the relay accepted from a hosted device key, never for one received from a peer.

**Note:** Vault destination descriptor (stored on F15.S01.M01 OutboxEntry.destination as the canonical F15.S02.M01 destination string): { kind: selected_relay, relayId } as '<relayId>' for public statements, or { kind: recipient_mailbox, recipientDid, mailboxId, relayId } as '<relayId>/mailbox/<mailboxId>' for participant statements; the acknowledger comes from the F11.S01.M01 registry entry (counterparty for participants, none for public). Wording map from F15 states: prepared = 'Saved on this device', sending = 'Queued', transport_acknowledged or completed = 'Relay received', peer_accepted = 'Recipient confirmed', expired after a receipt = 'Relay received, recipient not confirmed'.

### Storage DDL

```sql
CREATE TABLE fed_outbox (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, kind TEXT NOT NULL,
  destination_id TEXT NOT NULL, state TEXT NOT NULL, next_attempt_at TEXT,
  expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_outbox_active ON fed_outbox(tenant_id, cid, destination_id)
  WHERE state IN ('prepared','transport_acknowledged','paused');
CREATE INDEX fed_outbox_due ON fed_outbox(state, next_attempt_at);
CREATE INDEX fed_outbox_expiry ON fed_outbox(state, expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | relay R1 accepts a public listing from a hosted device key and dispatches it to peer R2 | PeerOutbox entry prepared, then transport_acknowledged with verified receipt, then delivered; payload not copied into the entry |
| TEST-PS-088-09.T05 | e2e | PS-088-03.R03, PS-088-01.R03, PS-088-01.R04 | vault publishes a listing offline, reconnects, gets a receipt; sends an offer that the recipient acknowledges; sends another offer never acknowledged for 30 days | chips read Saved on this device, Queued, Relay received for the listing (never Recipient confirmed); Recipient confirmed only after the ack; Relay received, recipient not confirmed after the F15 expiry; receipt times labelled relay time |
| TEST-PS-088-09.T25 | contract | PS-088-01.R05, PS-088-02.R02 | peer returns a classrup.platform.relay_receipt/v1 with matching digest and cid; one with a wrong digest; one signed by a key outside the pinned history; one with another destination | first stored and the entry advances; the others FEDERATION_RECEIPT_INVALID and the state does not advance; destinationId uses the canonical relayId |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
