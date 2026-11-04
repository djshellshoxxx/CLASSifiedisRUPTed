# PS-052-01 — Domain schema: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-01.R01** An Account stores the did:key, the account signing public key, the pseudonym with its normalized skeleton and Unicode data version, and timestamps; it holds no email, no password and no private key.
- **PS-052-01.R02** A DeviceKey stores a public key, label, link evidence and status; private keys are referenced by keyRef into the kernel keystore where they are encrypted with XChaCha20-Poly1305 under a key derived by scrypt (N=2^17, r=8, p=1) per ADR-0013.
- **PS-052-01.R03** A HandleRegistration is relay-side data derived from a signed claim statement and enforces uniqueness of the skeleton only within that relay.

## Specification

### Account

Schema `classrup.identity.account/v1` · storage **device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — local row id |
| tenantId | uuidv7 — tenant scope (single fixed tenant in a vault) |
| did | did — did:key derived from signingPublicKey, the principal identifier |
| signingPublicKey | string — Ed25519 public key, 32 bytes base64url (43 characters) |
| pseudonym | string — 3..32 code points after NFKC, allowed characters only |
| pseudonymSkeleton | string — UTS #39 skeleton of the case-folded pseudonym |
| skeletonVersion | string — Unicode data release used, for example 16.0.0 |
| pseudonymChangedAt? | timestamp — local clock of the last change |
| status | enum — active \| erased |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- did is deterministically derived from signingPublicKey and never changes for the life of the account.
- pseudonym is stored in NFKC form and pseudonymSkeleton equals the skeleton of that pseudonym.
- A vault has exactly one local principal Account.

### DeviceKey

Schema `classrup.identity.device_key/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| accountId | uuidv7 — ref Account |
| publicKey | string — Ed25519 public key, 32 bytes base64url (43 characters); unique per account |
| keyRef? | string — keystore handle for the private key on this device; null for keys of other devices |
| label | string — 1..40 code points chosen by the user |
| status | enum — active \| revoked |
| linkedBy | enum — signup \| device_link \| recovery |
| linkStatementCid? | string — cid of the signed classrup.identity.device_link/v1 statement |
| revocationStatementCid? | string — cid of the signed classrup.identity.device_revocation/v1 statement |
| lastUsedDay? | date — UTC day of last use, day granularity |
| addedAt | timestamp — local clock |
| revokedAt? | timestamp — local clock of the revocation decision (a claim to others) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- An account has between 1 and 10 active device keys, or zero only while a verified recovery kit exists.
- status revoked is permanent; a revoked public key is never reactivated and never reused as a new device.
- Every non-signup key has a link or recovery statement signed by the account signing key or an active device key.

### HandleRegistration

Schema `classrup.identity.handle_registration/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key on the relay |
| tenantId | uuidv7 — the relay's namespace |
| handle | string — NFKC pseudonym, 3..32 code points |
| skeleton | string — UTS #39 skeleton; unique among active and recently released registrations on this relay |
| did | did — owner |
| claimCid | string — cid of the signed classrup.identity.handle_claim/v1 statement |
| claimedAt | timestamp — the owner's claim |
| registeredAt | timestamp — relay clock, evidence of this relay's clock only |
| status | enum — active \| released \| purged |
| releasedAt? | timestamp — relay clock; the skeleton stays reserved for 30 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one active or recently released registration exists per (tenantId, skeleton) on a relay.
- A DID has at most one active registration per relay and may change it once per 30 days.
- A registration is valid only with a claim statement signed by the DID's account signing key.

### Storage DDL

```sql
CREATE TABLE identity_handle_registration (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, handle TEXT NOT NULL, skeleton TEXT NOT NULL, did TEXT NOT NULL,
  status TEXT NOT NULL, released_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_handle_skeleton ON identity_handle_registration(tenant_id, skeleton) WHERE status IN ('active','released');
CREATE UNIQUE INDEX identity_handle_did ON identity_handle_registration(tenant_id, did) WHERE status = 'active';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R02, PS-052-04.R01 | create account with valid pseudonym | Account stored with did:key (prefix z6Mk), no private key in records, events emitted |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only former DID can reclaim within 30 days; purge after |
| TEST-PS-052-09.T14 | a11y | PS-052-01.R01 | create identity and devices screens with axe-core and keyboard only | zero serious or critical issues; validation messages announced |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
