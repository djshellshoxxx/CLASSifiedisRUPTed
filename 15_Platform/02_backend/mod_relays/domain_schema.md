# PS-118-01 — Domain schema: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-01.R01** A RelayIdentity record stores the stable relayId, the key id, public key, status and timestamps for each signing key; the private seed is never stored in the database or logged.
- **PS-118-01.R02** The relayId is derived once from the first public key and stays stable across rotations so vaults keep their relay selection.
- **PS-118-01.R03** Rotated-out keys remain published with status retired for at least 400 days so older receipts stay verifiable.

## Specification

### RelayIdentity

Schema `classrup.platform.relay_identity/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, key id |
| relayId | string — 'relay:' + first 26 chars of lowercase base32 of SHA-256(first public key); stable across rotations |
| publicKey | string — base64url Ed25519 public key, 32 bytes |
| status | enum — active \| retired |
| displayName | string — operator label, 1..80 chars |
| publicUrl | string — https origin where the relay is reachable |
| createdAt | timestamp — RFC 3339 UTC |
| retiredAt? | timestamp — set when rotated out |
| rotationStatement? | string — base64url signature by the previous key over 'classrup-relay-rotate:v1:<relayId>:<newPublicKey>:<rotatedAt>' |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Exactly one RelayIdentity row has status active at any time.
- The private seed is stored only in the key file (mode 0600, optionally wrapped with scrypt N=2^17, r=8, p=1) and never in SQLite, logs or events.
- relayId never changes after the first key is created.

### Storage DDL

```sql
CREATE TABLE platform_relay_identity (
  id TEXT PRIMARY KEY, relay_id TEXT NOT NULL, public_key TEXT NOT NULL, status TEXT NOT NULL,
  created_at TEXT NOT NULL, retired_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX platform_relay_identity_active ON platform_relay_identity(relay_id) WHERE status = 'active';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T01 | unit | PS-118-01.R01, PS-118-01.R02, PS-118-01.R03 | first start, restart, rotate twice | one active key, stable relayId, retired keys published, seed only in key file |
| TEST-PS-118-09.T06 | property | PS-118-03.R03, PS-118-01.R03 | random sequences of rotate requests and clock changes | active to retired only, never back, rotation rate limit respected |
| TEST-PS-118-09.T18 | integration | PS-118-09.R02, PS-118-01.R01 | run on Node 22.17 and 22.18 | 22.17 exits 78 with PLATFORM_RELAY_RUNTIME_UNSUPPORTED; 22.18 starts without flags |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
