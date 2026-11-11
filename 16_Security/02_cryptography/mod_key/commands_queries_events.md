# PS-128-04 — Commands, queries and events: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-04.R01** createVault(passphrase) generates the root key and the first device key, wraps them, and returns the principal and fingerprint without returning key bytes.
- **PS-128-04.R02** sign(keyRole, context, payload) and agree(peerDevicePublicKey) operate on the unlocked handle and fail with SECURITY_VAULT_LOCKED when locked, and agree derives the peer's agreement key from its Ed25519 device key itself.
- **PS-128-04.R03** rotateDeviceKey generates a new device key and its possession signature, obtains the root-signed device link through F07.S01.M01 identity.device_key.add, waits the overlap, revokes the old key with reason superseded through identity.device_key.revoke, and queues the statements and the new portable identity document through the F15.S01.M01 sync outbox.
- **PS-128-04.R04** Fingerprints returned or shown by this library come from F07.S01.M01 fingerprintOf and never from a separate encoding.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_PASSPHRASE_WEAK | 422 | no | passphrase too short or on the common list |
| SECURITY_UNLOCK_FAILED | 401 | no | passphrase or blob authentication failed; generic on purpose |
| SECURITY_WRAPPED_KEY_INVALID | 422 | no | stored blob has unsafe or unknown parameters |
| SECURITY_VAULT_LOCKED | 403 | no | operation needs the unlocked vault |
| SECURITY_ROTATION_INVALID | 422 | no | device rotation step invalid - possession proof, root-signed device link or overlap bound |
| SECURITY_ENVIRONMENT_UNSUPPORTED | 422 | no | required browser capability is missing |
| SECURITY_KEY_ROLE_FORBIDDEN | 403 | no | this key handle may not sign this statement type |
| SECURITY_AGREEMENT_KEY_UNBOUND | 422 | no | agreement key is not derived from a device key listed in the peer's identity document |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no bus commands or queries and no events. API is createVault, unlock, lock, rootKey() and deviceKey() handles, sign(keyRole, context, payload), agree(peerDevicePublicKey), agreementPublicKeyOf(ed25519PublicKey), rotateDeviceKey({ overlapDays, compromised }), changePassphrase, exportBackup and importBackup, all vault-local with key derivation in a Web Worker. Signing goes through F16.S02.M03 and F11.S01.M03 with the handle. Statements produced during rotation are F07.S01.M01's classrup.identity.device_link/v1 (root key plus possession signature) and F16.S02.M02's classrup.security.keyrevocation/v1 (old key or root key, reason superseded), followed by a root-signed classrup.identity.portable_doc/v1 from F07.S02.M01; there is no classrup.security.keyrotation/v1.

### Example

```
const v = await createVault({ passphrase: "correct horse battery staple 41" });   // runs scrypt N=131072 in a Worker
-> { principal: "did:key:z6MkExample…", fingerprint: "7Hq3mK9sLp2xV4nR" (fingerprintOf), spoken: "orbit maple quiet river amber delta north lamp" }
await lock(); await sign("device", "classrup/consent/v1", bytes)  -> throws SECURITY_VAULT_LOCKED
await sign("root", "classrup.bazaar.listing/v1", draft)            -> throws SECURITY_KEY_ROLE_FORBIDDEN
await rotateDeviceKey({ overlapDays: 7 }) -> { newKeyId: "Zr4c…", deviceLinkCid: "sha256-ee78…", oldKeyRevokesAt: "2026-11-11T10:00:00Z", status: "overlap" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R03, PS-128-04.R01, PS-128-04.R04 | create a vault for a known seed and read the fingerprint | did:key from the root key and key IDs match independent vectors; fingerprint equals F07.S01.M01 fingerprintOf; no key bytes returned |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate a device key with overlap 7 days, interrupt after generation, resume | new key used only after the root-signed device link is recorded; old key revoked with reason superseded after 7 days; new portable identity document queued; all statements delivered through the outbox |
| TEST-PS-128-09.T09 | abuse | PS-128-04.R02, PS-128-05.R01, PS-128-05.R02, PS-128-07.R01 | application code requests key bytes; sign while locked; call from other origin | no API returns key bytes; SECURITY_VAULT_LOCKED; unreachable cross-origin |
| TEST-PS-128-09.T17 | unit | PS-128-01.R02, PS-128-04.R02 | root handle signs a listing draft; device handle signs a portable identity document and a device link; root handle signs a keyrevocation | SECURITY_KEY_ROLE_FORBIDDEN three times; the keyrevocation is signed |

## Dependencies

Module depends on: F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
