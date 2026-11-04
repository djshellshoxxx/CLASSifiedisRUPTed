# PS-129-01 — Domain schema: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-01.R01** A KeyRecord stores public key, algorithm, purpose, owner principal, status, validity window, revocation details, successor, provenance and the revocation freshness, with tenant and revision per CTR-ID-001.
- **PS-129-01.R02** Key records are P1 public data once published; local notes on counterparty keys are P3 in the vault, and retention is RET-EVIDENCE because signatures are verified against historical status.
- **PS-129-01.R03** Key IDs are unique per public key and a revoked key ID is never reused or reactivated.

## Specification

### KeyRecord

Schema `classrup.security.keyrecord/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault or relay hosting scope) |
| keyId | string — SHA-256 thumbprint of the raw public key, base64url, 43 chars |
| publicKey | string — raw public key, base64url |
| algorithm | enum — ed25519 \| x25519 \| ecdsa_p256 |
| purpose | enum — device_signing \| agreement \| relay_transport \| vapid \| peer_relay |
| ownerPrincipal | did:key — principal the key belongs to; for relay keys the relay did:key |
| relationship | enum — own \| counterparty \| relay_registered \| peer_relay |
| status | enum — active \| revoked \| expired \| conflicted |
| notBefore | timestamp — RFC 3339 UTC, claimed by the registering statement |
| notAfter? | timestamp — RFC 3339 UTC |
| firstSeenAt | timestamp — RFC 3339 UTC, this store's clock |
| revokedAt? | timestamp — RFC 3339 UTC, this store's clock when the revocation was recorded |
| revocationEffectiveFrom? | timestamp — RFC 3339 UTC, claimed by the revocation statement, at most 30 days before revokedAt |
| revocationReason? | enum — compromised \| lost \| superseded \| retired \| administrative |
| revocationStatementCid? | string — content id of the verified revocation statement |
| successorKeyId? | string — key ID of the rotation successor |
| freshnessCheckedAt | timestamp — RFC 3339 UTC, when revocation knowledge for this key was last refreshed from a source |
| freshnessSource? | string — relay ID, peer ID or own for own keys |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status revoked is permanent; a revoked keyId can never return to active.
- revocationEffectiveFrom is never earlier than revokedAt minus 30 days and never later than revokedAt.
- Own keys have freshnessSource own and are always fresh; counterparty keys carry the real age of their knowledge.

### Storage DDL

```sql
CREATE TABLE security_key_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, key_id TEXT NOT NULL, algorithm TEXT NOT NULL, purpose TEXT NOT NULL,
  owner_principal TEXT NOT NULL, relationship TEXT NOT NULL, status TEXT NOT NULL, revoked_at TEXT,
  freshness_checked_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_key_unique ON security_key_record(tenant_id, key_id);
CREATE INDEX security_key_owner ON security_key_record(tenant_id, owner_principal, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R03, PS-129-02.R01 | register K2 with link statement signed by K1 and K2 | KeyRecord stored active, keyId equals thumbprint, event emitted |
| TEST-PS-129-09.T03 | property | PS-129-01.R03, PS-129-03.R01 | random sequences of register, revoke, expire, conflict resolution | revoked and expired never change; revoked never returns to active |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
