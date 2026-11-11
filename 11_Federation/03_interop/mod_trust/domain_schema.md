# PS-091-01 — Domain schema: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-01.R01** A Peer stores identity (relay id and did:key), URL, kind, opt-in flags for both sides, trust level, quotas, health score and status with tenant and revision per CTR-ID-001.
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
| baseUrl | string — https origin on port 443, ≤ 200 chars |
| relayKey | string — did:key of the relay signing key (Ed25519) |
| previousKey? | string — prior did:key valid until previousKeyUntil |
| previousKeyUntil? | timestamp — rotation overlap end, rotatedAt + 7 days |
| localOptIn | boolean — this side opted in |
| remoteOptIn | boolean — verified peer_accept or peer_offer statement from the other side |
| direction | enum — inbound \| outbound \| both |
| trustLevel | enum — observer \| standard \| trusted |
| quotaEnvelopesPerHour | int — 600 observer, 6000 standard, 18000 trusted by default; range 100..60000 |
| quotaBatchesPerMinute | int — default 10, range 1..60 |
| quotaStoredBytes | int — default 2147483648, range 104857600..21474836480 |
| healthScore | int — 0..100, starts at 80 |
| status | enum — proposed \| active \| suspended \| removed \| expired |
| suspendReason? | enum — operator \| health \| key_mismatch \| equivocation \| compromise |
| offerStatementCid? | string — cid of the signed peer_offer or peer_accept statement |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- status active implies localOptIn and remoteOptIn are both true and a key fingerprint confirmation was recorded.
- relayId is unique per tenant and relayKey changes only through a verified rotation statement.
- healthScore stays between 0 and 100 and status active implies healthScore ≥ 40.
- trustLevel observer never receives pushes of non-public data and inbound quota 600 envelopes/hour by default.

### Storage DDL

```sql
CREATE TABLE fed_peer (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, kind TEXT NOT NULL, base_url TEXT NOT NULL,
  relay_key TEXT NOT NULL, status TEXT NOT NULL, health_score INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_peer_relay ON fed_peer(tenant_id, relay_id);
CREATE INDEX fed_peer_key ON fed_peer(relay_key);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-01.R01, PS-091-01.R02, PS-091-04.R02 | A proposes to B; B accepts with fingerprint confirmed | both Peer rows active with both opt-in flags; federation.peer.added emitted |
| TEST-PS-091-09.T15 | a11y | PS-091-01.R03, PS-091-03.R02 | operate relay chooser by keyboard and screen reader | fingerprint read in groups, targets ≥ 44 px, status announced |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
