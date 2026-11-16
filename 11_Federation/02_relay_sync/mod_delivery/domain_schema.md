# PS-088-01 — Domain schema: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-01.R01** A PeerOutbox entry stores the envelope cid, destination, state, attempt counters, next attempt time, last error code, relay receipt and peer acknowledgement, with tenant and revision per CTR-ID-001.
- **PS-088-01.R02** Entries hold references to envelopes stored by F11.S01.M02 and never copies of payloads, so deleting a record purges its queued delivery content.
- **PS-088-01.R03** Receipt times are stored as evidence of the issuing relay's clock only and are labelled so in the UI.

## Specification

### PeerOutbox

Schema `classrup.federation.peer_outbox/v1` · storage **relay+device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| cid | string — cid of the envelope to deliver; ref F11.S01.M02 FederatedRecord |
| destinationKind | enum — selected_relay \| recipient_mailbox \| peer_relay |
| destinationId | string — relay id or mailbox id; the HTTPS origin is looked up from the Peer or relay selection |
| audience | enum — public \| participants |
| state | enum — prepared \| transport_acknowledged \| peer_accepted \| paused \| failed \| cancelled |
| attempts | int — total attempts so far, ≥ 0 |
| roundsCompleted | int — scheduled retry rounds finished, 0..5 |
| nextAttemptAt? | timestamp — when the next attempt is due |
| lastErrorCode? | string — error code of the last failed attempt |
| transportReceipt? | json — {relayId, at, sig}; relay clock evidence only |
| peerAck? | json — {cid, signer, at, sig} signed acknowledgement statement classrup.federation.ack/v1 from the recipient |
| expiresAt | timestamp — createdAt + 7 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-terminal entry per (tenantId, cid, destinationKind, destinationId).
- State transport_acknowledged or peer_accepted implies transportReceipt is set; peer_accepted implies peerAck is set and its signer is the recipient named by the statement.
- audience participants entries never have destinationKind peer_relay, so participant statements are never relayed relay to relay.

### Storage DDL

```sql
CREATE TABLE fed_outbox (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, destination_kind TEXT NOT NULL,
  destination_id TEXT NOT NULL, audience TEXT NOT NULL, state TEXT NOT NULL, next_attempt_at TEXT,
  expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_outbox_active ON fed_outbox(tenant_id, cid, destination_kind, destination_id)
  WHERE state IN ('prepared','transport_acknowledged','paused');
CREATE INDEX fed_outbox_due ON fed_outbox(state, next_attempt_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | enqueue a committed listing statement for R1 and dispatch | entry prepared then transport_acknowledged with verified receipt; payload not copied into the entry |
| TEST-PS-088-09.T05 | e2e | PS-088-03.R03, PS-088-01.R03 | publish offline, reconnect, receipt, recipient ack | UI wording progresses Saved on this device, Queued, Relay received, Recipient confirmed and never skips ahead |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
