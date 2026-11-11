# PS-118-01 — Domain schema: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-01.R01** A RelayIdentity record stores the stable relayId, the keyId and seq, public key, status (active, retired or revoked), the previous keyId, the signed rotation and revocation statements and timestamps for each signing key; the private seed is never stored in the database or logged.
- **PS-118-01.R02** The relayId is derived once from the genesis public key and stays stable across rotations signed by the previous key, so vaults keep their relay selection and can verify the chain; any key not reachable through that chain (after a revocation of the active key, a lost key file or --new-identity) always yields a new relayId.
- **PS-118-01.R03** Rotated-out keys remain published with status retired for at least 400 days so older receipts stay verifiable, and revoked keys remain published with their signed revocation for as long as the relay exists; a receipt signed by a revoked key is valid only in a vault that stored it before revokedAt.
- **PS-118-01.R04** The canonical identifiers are defined here and referenced by F15.S01.M01, F15.S02.M03, F11.S02.M01 and F01.S01.M03 - relayId 'relay:' plus the first 26 characters of lowercase RFC 4648 base32 (no padding) of SHA-256 of the genesis public key; keyId '<relayId>#k<seq>'; destination '<relayId>', '<relayId>/mailbox/<mailboxId>', '<relayId>/index/<indexName>', '<relayId>/auction/<auctionId>' or 'direct:<did>'.

## Specification

### RelayIdentity

Schema `classrup.platform.relay_identity/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| relayId | string — 'relay:' + first 26 chars of lowercase base32 of SHA-256(genesis public key); identical for every key of one rotation chain |
| keyId | string — '<relayId>#k<seq>', unique |
| seq | int — 1 for the genesis key, previous seq + 1 for each rotation |
| publicKey | string — base64url Ed25519 public key, 32 bytes |
| status | enum — active \| retired \| revoked |
| prevKeyId? | string — keyId of the key that signed this key's rotation statement; absent for the genesis key |
| displayName | string — operator label, 1..80 chars |
| publicUrl | string — https origin where the relay is reachable |
| createdAt | timestamp — RFC 3339 UTC |
| retiredAt? | timestamp — set when rotated out |
| rotationStatement? | json — classrup.platform.relay_rotation/v1 { relayId, prevKeyId, newKeyId, newPublicKey, seq, rotatedAt } signed by prevKeyId under context classrup-relay-rotate:v1 |
| revokedAt? | timestamp — set when revoked |
| revokeReason? | enum — compromised \| lost \| superseded |
| revocationStatement? | json — classrup.platform.relay_key_revocation/v1 { relayId, keyId, revokedAt, reason, successorRelayId? } signed by the revoked key itself or its pre-signed revocation certificate under context classrup-relay-revoke:v1 |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one RelayIdentity row has status active; when the active key is revoked no row is active and the relay refuses to serve until relay identity init --new-identity creates a new relayId.
- The private seed is stored only in the key file (mode 0600, optionally wrapped with scrypt N=2^17, r=8, p=1) and never in SQLite, logs or events; the pre-signed revocation certificate is written next to it for the operator to move offline.
- relayId never changes within one rotation chain; each row's prevKeyId is the keyId of the row with seq - 1.
- This relay never issues two rotation statements with the same prevKeyId, and a revoked row never changes status again.

### Storage DDL

```sql
CREATE TABLE platform_relay_identity (
  id TEXT PRIMARY KEY, relay_id TEXT NOT NULL, key_id TEXT NOT NULL UNIQUE, seq INTEGER NOT NULL, public_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','retired','revoked')), prev_key_id TEXT,
  created_at TEXT NOT NULL, retired_at TEXT, revoked_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX platform_relay_identity_active ON platform_relay_identity(relay_id) WHERE status = 'active';
CREATE UNIQUE INDEX platform_relay_identity_prev ON platform_relay_identity(relay_id, prev_key_id);
CREATE TABLE platform_relay_receipt_counter (relay_id TEXT PRIMARY KEY, epoch INTEGER NOT NULL, seq INTEGER NOT NULL);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T01 | unit | PS-118-01.R01, PS-118-01.R03 | first start, restart, rotate twice | one active key, stable relayId, keyIds #k1..#k3 with prevKeyId chain, retired keys published, seed only in key file, revocation certificate written per key |
| TEST-PS-118-09.T06 | property | PS-118-03.R03, PS-118-01.R03 | random sequences of rotate, revoke requests and clock changes | active to retired and active or retired to revoked only, never back; rotation rate limit respected; revocation never rate limited |
| TEST-PS-118-09.T12 | abuse | PS-118-01.R02, PS-118-05.R02 | delete key file while identity row exists, then start; then relay identity init --new-identity | refuses with PLATFORM_RELAY_IDENTITY_MISSING; --new-identity creates a new genesis key and a new relayId that no chain links to the old one |
| TEST-PS-118-09.T18 | integration | PS-118-09.R02, PS-118-01.R01 | run on Node 22.17 and 22.18 | 22.17 exits 78 with PLATFORM_RELAY_RUNTIME_UNSUPPORTED; 22.18 starts without flags |
| TEST-PS-118-09.T20 | abuse | PS-118-03.R03, PS-118-01.R03, PS-118-02.R04 | CLI revoke of the stolen active key 1 h after a rotation, using the pre-signed certificate; vault holds receipts by that key stored before and after revokedAt | revocation accepted without prior-key authorization and without RATE_LIMITED; relay refuses to serve until --new-identity; receipts stored before revokedAt still verify, later ones are rejected |
| TEST-PS-118-09.T21 | abuse | PS-118-01.R02, PS-118-05.R03 | thief signs a rotation from key k2 while the operator signs another from k2; second rotation attempt on this relay from k2 | vault verifier detects two rotations with prevKeyId k2 and freezes the relay with a warning; this relay's unique index refuses to sign a second rotation from k2 |
| TEST-PS-118-09.T26 | unit | PS-118-01.R04 | derive relayId from a fixed genesis key; format and parse keyId and each destination form; parse malformed strings | values equal the published vectors used by F15.S01.M01, F15.S02.M03, F11.S02.M01 and F01.S01.M03; malformed strings rejected with VALIDATION_FAILED |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
