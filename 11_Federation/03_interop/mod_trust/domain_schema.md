# PS-091-01 — Domain schema: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-01.R01** A Peer stores identity (relay id and did:key), URL, kind, proposal origin, opt-in flags for both sides, trust level, quotas, health score and status, and for selected relays whether the user lists it in the identity document, with tenant and revision per CTR-ID-001.
- **PS-091-01.R02** Peer records are relay-local or vault-local operational data classed P1 and are never federated or exported to other users.
- **PS-091-01.R03** The pinned key history keeps the current and the previous key for 7 days so rotation can overlap without accepting arbitrary keys.

## Specification

### Peer

Schema `classrup.federation.peer/v1` · storage **relay+device** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| relayId | string — stable relay identifier, unique per tenant |
| kind | enum — peer_relay \| selected_relay |
| origin | enum — outbound \| inbound (inbound = created by receive_offer and waiting for operator action) |
| baseUrl | string — https origin on port 443, ≤ 200 chars |
| relayKey | string — did:key of the relay signing key (Ed25519) |
| previousKey? | string — prior did:key valid until previousKeyUntil |
| previousKeyUntil? | timestamp — rotation overlap end, rotatedAt + 7 days |
| localOptIn | boolean — this side opted in |
| remoteOptIn | boolean — verified peer_accept (outbound), verified peer_offer (inbound), or for selected_relay the verified relay_identity hosting-policy statement |
| fingerprintConfirmedAt? | timestamp — when an operator or the user confirmed the key fingerprint |
| direction | enum — inbound \| outbound \| both |
| trustLevel | enum — observer \| standard \| trusted |
| quotaEnvelopesPerHour | int — 600 observer, 6000 standard, 18000 trusted by default; range 100..60000 |
| quotaBatchesPerMinute | int — default 10, range 1..60 |
| quotaStoredBytes | int — default 2147483648, range 104857600..21474836480 |
| healthScore | int — 0..100, starts at 80 |
| status | enum — proposed \| active \| suspended \| removed \| expired |
| suspendReason? | enum — operator \| health \| key_mismatch \| equivocation \| compromise |
| offerStatementCid? | string — cid of the signed peer_offer this record started from |
| peerStatement? | json — the verified peer_offer, peer_accept or relay_identity envelope from the other side |
| offerExpiresAt? | timestamp — proposal or inbound offer expiry, createdAt + 14 days |
| listInIdentityDoc | boolean — selected_relay only; default false; at most 5 listed per vault |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- status active implies localOptIn and remoteOptIn are both true and fingerprintConfirmedAt is set.
- relayId is unique per tenant and relayKey changes only through a verified rotation statement.
- healthScore stays between 0 and 100 and status active implies healthScore ≥ 40.
- trustLevel observer never receives pushes of non-public data and inbound quota 600 envelopes/hour by default.
- At most 5 selected relays per vault have listInIdentityDoc true.

### Storage DDL

```sql
CREATE TABLE fed_peer (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, kind TEXT NOT NULL, origin TEXT NOT NULL,
  base_url TEXT NOT NULL, relay_key TEXT NOT NULL, status TEXT NOT NULL, health_score INTEGER NOT NULL,
  offer_expires_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_peer_relay ON fed_peer(tenant_id, relay_id);
CREATE INDEX fed_peer_key ON fed_peer(relay_key);
CREATE INDEX fed_peer_offer_expiry ON fed_peer(status, offer_expires_at) WHERE status = 'proposed';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-03.R04, PS-091-01.R01, PS-091-04.R02 | A proposes to B; B's receive_offer stores an inbound proposed Peer; B's operator accepts with fingerprint confirmed; A's receive_accept verifies it | both Peer rows active with both opt-in flags and fingerprintConfirmedAt; federation.peer.added emitted on both sides |
| TEST-PS-091-09.T12 | abuse | PS-091-07.R01, PS-091-07.R02, PS-091-01.R02 | inspect peer rows, logs, federation payloads and the relay chooser; toggle 'List in my identity document' on for one relay and off for another | no user data in peer rows; chooser states IP and did:key visibility and exactly which relays the identity document publishes; only the listed relay appears in the next portable document |
| TEST-PS-091-09.T18 | unit | PS-091-01.R03 | rotate peer key, then sign with the previous key 6 days 23 h later and 7 days 1 min later | first accepted; second FEDERATION_KEY_MISMATCH |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
