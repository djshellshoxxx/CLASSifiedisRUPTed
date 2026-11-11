# PS-052-01 — Domain schema: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-01.R01** An Account stores the did:key, the account root public key, the pseudonym with its normalized skeleton and Unicode data version, the root device flag and timestamps; it holds no email, no password and no private key, only an opaque keystore handle for the root key on the root device.
- **PS-052-01.R02** A DeviceKey stores a public key, label, link evidence with the key's own possession signature, revocation evidence and status; private keys are referenced by keyRef into the kernel keystore where they are encrypted with XChaCha20-Poly1305 under a key derived by scrypt (N=2^17, r=8, p=1) per ADR-0013.
- **PS-052-01.R03** A HandleRegistration is relay-side data derived from a signed claim statement and enforces uniqueness of the skeleton only within that relay.
- **PS-052-01.R04** Key custody - the account root key is held only on the root device and inside the recovery kit and signs only classrup.identity.portable_doc/v1, classrup.identity.device_link/v1, classrup.security.keyrevocation/v1 and classrup.identity.recovery_notice/v1; every other statement is signed by a device key that the author's current portable document lists as active, with the did:key principal in author and the device key id in the envelope, and verifiers accept it only if the signer key was active in the author's document they knew at their first-seen time of the statement.
- **PS-052-01.R05** The fingerprint of a DID or key is the first 16 base58btc characters of base58btc(SHA-256(raw 32-byte public key)), shown in groups of 4, with an 8-word form from the first 88 bits of the same hash; the multicodec prefix of did:key never enters it.

## Specification

### Account

Schema `classrup.identity.account/v1` · storage **device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — local row id |
| tenantId | uuidv7 — tenant scope (single fixed tenant in a vault) |
| did | did — did:key derived from signingPublicKey, the principal identifier |
| signingPublicKey | string — Ed25519 account root public key, 32 bytes base64url (43 characters) |
| fingerprint | string — fingerprintOf(signingPublicKey), 16 base58btc characters |
| rootDevice | boolean — true when this vault holds the root key (creating device, or recovering device after a recovery) |
| rootKeyRef? | string — opaque keystore handle of the root private key; present only when rootDevice is true |
| pseudonym | string — 3..32 code points after NFKC, allowed characters only |
| pseudonymSkeleton | string — UTS 39 skeleton of the case-folded pseudonym |
| skeletonVersion | string — Unicode data release used, for example 16.0.0 |
| pseudonymChangedAt? | timestamp — local clock of the last change |
| origin | enum — created \| recovered |
| status | enum — active \| erased |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- did is deterministically derived from signingPublicKey and never changes for the life of the account.
- pseudonym is stored in NFKC form and pseudonymSkeleton equals the skeleton of that pseudonym.
- A vault has exactly one local principal Account.
- rootKeyRef is present if and only if rootDevice is true, and the root private key never leaves the keystore except inside the user's own encrypted kit or key bundle.

### DeviceKey

Schema `classrup.identity.device_key/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| accountId | uuidv7 — ref Account |
| publicKey | string — Ed25519 public key, 32 bytes base64url (43 characters); unique per account |
| fingerprint | string — fingerprintOf(publicKey), 16 base58btc characters |
| keyRef? | string — keystore handle for the private key on this device; null for keys of other devices |
| label | string — 1..40 code points chosen by the user |
| status | enum — active \| revocation_pending \| contested \| revoked |
| linkedBy | enum — signup \| device_link \| recovery |
| linkNonce | string — 16 random bytes base64url from the link offer, used once |
| possessionSig | string — signature by this key over classrup-device-link:v1:<did>:<publicKey>:<linkNonce>, base64url |
| linkStatementCid? | string — cid of the root-signed classrup.identity.device_link/v1 statement (absent for signup) |
| revocationStatementCid? | string — cid of the classrup.security.keyrevocation/v1 statement (type owned by F16.S02.M02) |
| revokedByKey? | string — public key that signed the revocation (this key, the root key or another device key) |
| revokeReason? | enum — lost \| stolen \| retired \| compromised \| recovery |
| pendingUntil? | timestamp — local clock, revocation_pending start plus 7 days |
| lastUsedDay? | date — UTC day of last use, day granularity |
| addedAt | timestamp — local clock |
| revokedAt? | timestamp — local clock of the revocation decision (a claim to others) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- An account has between 1 and 10 active device keys, or zero only while RecoveryKitStatusPort reports a verified recovery kit.
- status revoked is permanent; a revoked public key is never reactivated and never reused as a new device.
- Every non-signup key has a link or recovery statement signed by the root key and a possession signature by the key itself over the DID-bound link message.
- revocation_pending is entered only from a revocation signed by another active device key, and lasts at most 7 days before it becomes revoked or contested.

### HandleRegistration

Schema `classrup.identity.handle_registration/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key on the relay |
| tenantId | uuidv7 — the relay's namespace |
| relayId | string — this relay's identifier, bound into every claim and release |
| handle | string — NFKC pseudonym, 3..32 code points |
| skeleton | string — UTS 39 skeleton; unique among active and recently released registrations on this relay |
| did | did — owner |
| claimCid | string — cid of the signed classrup.identity.handle_claim/v1 statement |
| claimSignerKey | string — device public key that signed the claim, active in the DID's document at claim time |
| claimedAt | timestamp — the owner's claim, within 10 minutes of the relay clock |
| registeredAt | timestamp — relay clock, evidence of this relay's clock only |
| statementCids | array — cids of every claim and release accepted for this registration, used to refuse replays |
| status | enum — active \| released \| purged |
| releasedAt? | timestamp — relay clock; the skeleton stays reserved for 30 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one active or recently released registration exists per (tenantId, skeleton) on a relay.
- A DID has at most one active registration per relay and may change it once per 30 days.
- A registration is valid only with a claim naming this relayId, signed by a device key that KeyStatusPort reports active in the DID's portable document, and claimed within 10 minutes of the relay clock.

### Storage DDL

```sql
CREATE TABLE identity_handle_registration (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, handle TEXT NOT NULL, skeleton TEXT NOT NULL, did TEXT NOT NULL,
  status TEXT NOT NULL, released_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_handle_skeleton ON identity_handle_registration(tenant_id, skeleton) WHERE status IN ('active','released');
CREATE UNIQUE INDEX identity_handle_did ON identity_handle_registration(tenant_id, did) WHERE status = 'active';
CREATE TABLE identity_handle_statement (cid TEXT PRIMARY KEY, registration_id TEXT NOT NULL, kind TEXT NOT NULL, seen_at TEXT NOT NULL);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R04, PS-052-04.R03 | create account with a valid pseudonym on device A1 | Account stored with did:key, rootDevice true and rootKeyRef only on A1, no private key in records; identity.account.created and identity.device_key.added emitted in the same transaction |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only the former DID can reclaim within 30 days; row purged after; the vault never reports global uniqueness |
| TEST-PS-052-09.T07 | unit | PS-052-01.R02, PS-052-02.R02, PS-052-02.R04 | add device with a valid dual-signed link; stale link (11 min); link signed by a device key; missing possession signature; reused offer nonce; another user's device key B1 listed under A | success first, then IDENTITY_LINK_INVALID for every other case |
| TEST-PS-052-09.T20 | abuse | PS-052-01.R04, PS-052-05.R04 | A2 signs a profile after its revocation; verifier V1 learned of the revocation before first seeing the profile, verifier V2 first saw it earlier | V1 rejects (KeyStatusPort at first-seen time), V2 keeps it with the revocation date shown as a claim |
| TEST-PS-052-09.T21 | property | PS-052-01.R05 | fingerprints of 10 000 random keys | 16 base58btc characters from SHA-256 of the raw key, no shared z6Mk prefix, no collisions, 8-word form decodes to the same 88 bits |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
