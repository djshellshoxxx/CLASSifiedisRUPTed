# F16.S02.M01 — Key lifecycle

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-128-01…PS-128-10. **Code:** `packages/security/src/cryptography/key`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Client library for the user's own keys in the browser vault. It generates Ed25519 signing keys and x25519 agreement keys with @noble/curves 2.4.0, wraps private keys for storage in IndexedDB with a passphrase-derived key (scrypt N=2^17, r=8, p=1) and XChaCha20-Poly1305 from @noble/ciphers 2.4.0, unlocks them on demand, locks them after idle time, rotates them with signed rotation statements, and exports an encrypted backup. There is no server-held user secret and no central account; the private key never leaves the vault except in the user's own encrypted export. argon2 is not used because the available JavaScript implementations are unaudited, and noble-ciphers 2.x has no stated third-party audit, which is recorded as an accepted risk with mitigations.

## Responsibilities

- Generate Ed25519 and x25519 keys from the browser CSPRNG (crypto.getRandomValues) and derive the did:key principal and key fingerprint.
- Wrap private keys with scrypt (N=131072, r=8, p=1, 16-byte random salt, 32-byte output) and XChaCha20-Poly1305 (24-byte random nonce) and store only the wrapped blob.
- Unlock into memory on passphrase entry, lock on idle (default 15 minutes, range 1 to 60), on tab hide for 5 minutes, and on explicit lock.
- Rotate device keys with a rotation statement signed by the old key and the new key, then revoke the old key after the overlap through the key registry (F16.S02.M02).
- Produce a passphrase-protected key export (backup file) and import it, with the recovery kit remaining under the user's control.

## Not responsible for

- Signature formats and context strings (F16.S02.M03).
- Key status and revocation lists (F16.S02.M02).
- Recovery kit creation and account recovery flow (F07.S01.M03) and device linking (F07.S01.M01).
- Server-side key handling; relays never receive private keys.
- Future: platform-protected non-extractable keys through WebCrypto or WebAuthn where Ed25519 is supported; passkey as second factor; Shamir split of recovery material.

## User stories

- As a new user, I create a vault by choosing a passphrase and get a key without any account on a server.
- As a user, I unlock my vault with my passphrase and it locks itself when I am away.
- As a user, I rotate my device key if I suspect it is exposed, and my contacts see a signed statement of the change.

## Edge cases

- Wrong passphrase; AEAD tag verification fails, the error does not reveal whether the blob or passphrase was wrong, and a local delay of 1 s doubling to 60 s applies after 3 failures without ever wiping the key.
- Unlock takes too long on a low-end phone; the unlock runs in a Web Worker with progress and cancel, and the scrypt cost parameters stay fixed for the blob's recorded version so cost is never silently lowered.
- Browser storage is cleared; the wrapped key is gone and recovery needs the user's backup file or recovery kit; the vault says so honestly at creation.
- Two tabs unlock the same vault; a Web Lock named classrup-vault-unlock serializes unlock, and a lock in one tab locks the others through BroadcastChannel.
- Passphrase change while another device is linked; the wrap is rewritten with a new salt and nonce; other devices are unaffected because each device has its own key.
- Key rotation interrupted after the new key is generated but before the statement is delivered; the vault retains both keys, shows 'rotation pending', and resumes the delivery from the sync outbox.
- Passphrase appears on a list of commonly used passphrases; creation is refused with SECURITY_PASSPHRASE_WEAK and explains how to choose a longer phrase.

## UX and accessibility

- Create vault: passphrase and confirmation with strength meter (minimum 12 code points and not on the 10 000-entry common list), explicit text about what happens if the passphrase is lost, backup file download prompt.
- Unlock screen: passphrase field, progress while deriving the key (scrypt takes 1 to 8 seconds on typical devices), cancel button, lockout countdown after failures.
- Security settings: auto-lock timeout, change passphrase, rotate key, export encrypted backup, key fingerprint display as 4-word list and QR code.

**States:** no-vault; locked; unlocking; unlocked; lockout; rotating; rotation-pending; backup-needed

**Accessibility:** Passphrase fields use autocomplete=current-password or new-password and have visible labels and show/hide toggles with accessible names.; Progress during key derivation is announced politely and cancel is keyboard reachable.; Fingerprint is available as text and as a word list, not only a QR code.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-128-01 | [Domain schema](domain_schema.md) | 3 |
| PS-128-02 | [Validation rules](validation_rules.md) | 3 |
| PS-128-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-128-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-128-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-128-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-128-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-128-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-128-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-128-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/key/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI with the pinned noble versions and standard known-answer vectors.
- Private key bytes are never returned by any API, logged or sent over the network (abuse and network tests).
- Unlock meets 8 s p95 on the Moto G profile without blocking the main thread beyond 50 ms per task.
