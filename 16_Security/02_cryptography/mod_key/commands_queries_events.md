# PS-128-04 — Commands, queries and events: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-04.R01** createVault(passphrase) generates keys, wraps them and returns the principal and fingerprint without returning key bytes.
- **PS-128-04.R02** sign(context, payload) and agree(peerKey) operate on the unlocked key and fail with SECURITY_VAULT_LOCKED when locked.
- **PS-128-04.R03** rotateKey produces a rotation statement (classrup.security.keyrotation/v1) signed by old and new keys and hands it to the sync outbox and to F16.S02.M02 for registration.

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
| SECURITY_ROTATION_INVALID | 422 | no | rotation statement is not signed by both keys |
| SECURITY_ENVIRONMENT_UNSUPPORTED | 422 | no | required browser capability is missing |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no bus commands or queries and no events. API is createVault, unlock, lock, sign, agree, rotateKey, changePassphrase, exportBackup and importBackup, all vault-local and run in a Web Worker for key derivation.

### Example

```
const v = await createVault({ passphrase: "correct horse battery staple 41" });   // runs scrypt N=131072 in a Worker
-> { principal: "did:key:z6MkExample…", fingerprint: "orbit-maple-quiet-river", blob: "wrapped (not returned)" }
await lock(); await sign("classrup/consent/v1", bytes)  -> throws SECURITY_VAULT_LOCKED
await rotateKey({ reason: "routine" }) -> { rotationStatementCid: "sha256-ee78…", oldKeyValidUntil: "2026-11-11T10:00:00Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R01, PS-128-01.R03, PS-128-02.R01, PS-128-04.R01 | create vault and derive principal and thumbprint for a known seed | did:key and key ID match independent vectors |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate key, interrupt after generation, resume | both keys valid, rotation pending shown, statement delivered later, old key revoked after overlap |
| TEST-PS-128-09.T08 | unit | PS-128-04.R03 | rotation statement signed only by the new key | SECURITY_ROTATION_INVALID |
| TEST-PS-128-09.T09 | abuse | PS-128-04.R02, PS-128-05.R01, PS-128-05.R02, PS-128-07.R01 | application code requests key bytes; sign while locked; call from other origin | no API returns key bytes; SECURITY_VAULT_LOCKED; unreachable cross-origin |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
