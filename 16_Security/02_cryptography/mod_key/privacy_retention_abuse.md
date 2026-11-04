# PS-128-07 — Privacy, retention and abuse: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-07.R01** Private keys and passphrases are P4 and never leave the device except inside the user's own passphrase-encrypted export, and they are never logged or sent in telemetry (OBS-7).
- **PS-128-07.R02** The wrapped blob is retained until the user deletes the vault, and deletion overwrites the IndexedDB records and removes the blob.
- **PS-128-07.R03** Offline brute force against a stolen wrapped blob is slowed by scrypt N=2^17 (about 128 MiB per attempt) and the passphrase minimum, and the user is told the limits.

## Specification

**Data classification**
- Wrapped key blob: P4 ciphertext, local only.
- Public key, fingerprint and did:key: P0 once the user publishes them.

**Retention**
- Wrapped blob: until the user deletes the vault.
- Rotation records: kept in the vault for 1 year (RET-AUDIT equivalent) for dispute evidence.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stolen device or copied IndexedDB offers offline passphrase guessing | scrypt N=131072 r=8 p=1 about 128 MiB per guess, XChaCha20-Poly1305 authenticated blob, passphrase minimum 12 code points and common-list check; users are told a weak passphrase can still be guessed |
| T02 | Malicious or altered web code reads unwrapped keys | strict CSP, subresource integrity and reproducible builds (see F16.S03.M01); keys unwrapped only in a worker module; the API never returns key bytes; the residual risk of malicious code is stated |
| T03 | Tampered blob lowers KDF cost | parameters validated against minimums and bound as associated data; unsafe blobs rejected before derivation |
| T04 | Nonce reuse in XChaCha20-Poly1305 | 24-byte random nonces from the CSPRNG, fresh per wrap; unit tests assert uniqueness over 1 000 000 wraps |
| T05 | Supply-chain compromise or lack of audit in crypto dependencies | exact version pins @noble/curves 2.4.0 and @noble/ciphers 2.4.0 with lockfile integrity hashes; known-answer tests from RFC 8032, RFC 7748, RFC 7914 and the XChaCha20-Poly1305 specification; noble-ciphers 2.x has no stated third-party audit and argon2 is avoided as unaudited |
| T06 | Unlock abuse via shoulder surfing or unattended device | auto-lock 15 minutes, hidden-tab lock, explicit lock button; no biometric shortcut in MVP |

**Abuse controls**
- Local unlock backoff 1 s doubling to 60 s after 3 failures; never wipes keys, so an attacker cannot destroy a victim's key by failed guesses.
- Key export requires re-entering the passphrase and is rate limited locally to 5 per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T09 | abuse | PS-128-04.R02, PS-128-05.R01, PS-128-05.R02, PS-128-07.R01 | application code requests key bytes; sign while locked; call from other origin | no API returns key bytes; SECURITY_VAULT_LOCKED; unreachable cross-origin |
| TEST-PS-128-09.T12 | abuse | PS-128-07.R02, PS-128-07.R03 | nonce uniqueness over 1 000 000 wraps; export without passphrase re-entry; 6 exports in an hour | no duplicate nonce; export refused; 6th rate limited locally |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
