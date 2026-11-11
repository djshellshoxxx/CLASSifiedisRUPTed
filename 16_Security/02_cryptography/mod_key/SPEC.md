# F16.S02.M01 — Key lifecycle

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-128-01…PS-128-10. **Code:** `packages/security/src/cryptography/key`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Client library for the user's own keys in the browser vault. It generates the account root key and the device keys (Ed25519, @noble/curves 2.4.0) and exposes them as separate handles, so that the root key signs only the statements F07 reserves for it and device keys sign everything else. Each device's X25519 agreement key is derived deterministically from that device's Ed25519 key, so the root-signed portable identity document that lists the device key also binds its agreement key and no relay can substitute one. Private keys are wrapped for storage in IndexedDB with a passphrase-derived key (scrypt N=2^17, r=8, p=1) and XChaCha20-Poly1305 from @noble/ciphers 2.4.0, unlocked on demand and locked after idle time. Device keys are rotated through the F07 identity flow (new device key, root-signed device link, overlap, revocation of the old key, new portable identity document); the root key is not rotated in MVP and is recovered through F07.S01.M03. There is no server-held user secret and no central account; private keys never leave the vault except in the user's own encrypted export. argon2 is not used because the available JavaScript implementations are unaudited, and noble-ciphers 2.x has no stated third-party audit, which is recorded as an accepted risk with mitigations.

## Responsibilities

- Generate the Ed25519 root key and device keys from the browser CSPRNG (crypto.getRandomValues), derive the did:key principal from the root key, derive each device's X25519 agreement key from its Ed25519 key, and show fingerprints only through F07.S01.M01 fingerprintOf.
- Wrap private keys with scrypt (N=131072, r=8, p=1, 16-byte random salt, 32-byte output) and XChaCha20-Poly1305 (24-byte random nonce) and store only the wrapped blobs.
- Unlock into memory on passphrase entry, lock on idle (default 15 minutes, range 1 to 60), on tab hide for 5 minutes, and on explicit lock.
- Enforce key roles in sign(keyRole, context, payload) - the root handle signs only the F07 root-only statement list and a device handle never signs root-only types.
- Rotate device keys through F07.S01.M01 (identity.device_key.add with a root-signed device link and the new key's possession signature, an overlap of 0 to 7 days, then identity.device_key.revoke of the old key with reason superseded) and queue the resulting statements and portable identity document through the F15.S01.M01 sync outbox.
- Produce a passphrase-protected key export (backup file) and import it, with the recovery kit remaining under the user's control.

## Not responsible for

- Signature envelope and context registry (F16.S02.M03) and the JCS, Ed25519 and did:key primitives (F11.S01.M03).
- User key validity and revocation status (F07.S02.M01 KeyStatusPort) and the key cache with freshness (F16.S02.M02).
- Device linking rules, the device_link and keyrevocation identity rules and the portable identity document (F07.S01.M01, F07.S02.M01), recovery kit creation and account recovery (F07.S01.M03).
- Server-side key handling; relays never receive private keys.
- Future: rotation of the account root key with a signed move statement; platform-protected non-extractable keys through WebCrypto or WebAuthn where Ed25519 is supported; passkey as second factor; Shamir split of recovery material.

## User stories

- As a new user, I create a vault by choosing a passphrase and get a key without any account on a server.
- As a user, I unlock my vault with my passphrase and it locks itself when I am away.
- As a user, I rotate a device key if I suspect it is exposed, and my contacts see the change in my signed identity document.

## Edge cases

- Wrong passphrase; AEAD tag verification fails, the error does not reveal whether the blob or passphrase was wrong, and a local delay of 1 s doubling to 60 s applies after 3 failures without ever wiping the key.
- Unlock takes too long on a low-end phone; the unlock runs in a Web Worker with progress and cancel, and the scrypt cost parameters stay fixed for the blob's recorded version so cost is never silently lowered.
- Browser storage is cleared; the wrapped key is gone and recovery needs the user's backup file or recovery kit; the vault says so honestly at creation.
- Two tabs unlock the same vault; a Web Lock named classrup-vault-unlock serializes unlock, and a lock in one tab locks the others through BroadcastChannel.
- Passphrase change while another device is linked; the wrap is rewritten with a new salt and nonce; other devices are unaffected because each device has its own key.
- Device rotation interrupted after the new key is generated but before the root-signed device link is recorded; the old key stays active, the new key is unused, the vault shows 'rotation pending' and resumes from the persisted progress.
- Passphrase appears on a list of commonly used passphrases; creation is refused with SECURITY_PASSPHRASE_WEAK and explains how to choose a longer phrase.
- A user pastes the passphrase from a password manager or lets it autofill the unlock field; the field accepts it, because no handler cancels paste, drop or input events, and validation runs only on the entered value.
- Rotation is started on a linked device that does not hold the root key; the new key and its possession signature are prepared there and the vault shows 'waiting for approval on your root device', because only the root key signs the device link.
- A relay-served mailbox hint carries an X25519 key for a contact that differs from the one derived from the contact's listed device key; the hint is ignored and messages are wrapped only to the derived key.
- Application code asks the root handle to sign a listing, or a device handle to sign a portable identity document; both are refused with SECURITY_KEY_ROLE_FORBIDDEN.
- The user picks an overlap of 10 days; refused with SECURITY_ROTATION_INVALID because the bound is 0 to 7 days.

## UX and accessibility

- Create vault: passphrase and confirmation with strength meter (minimum 12 code points and not on the 10 000-entry common list), explicit text about what happens if the passphrase is lost, backup file download prompt.
- Unlock screen: passphrase field, progress while deriving the key (scrypt takes 1 to 8 seconds on typical devices), cancel button, lockout countdown after failures.
- Security settings: auto-lock timeout, change passphrase, rotate this device's key (overlap 0 to 7 days, root-device approval step on linked devices), export and import encrypted backup (passphrase entry with paste and password-manager autofill allowed), fingerprint from F07.S01.M01 fingerprintOf as 16 characters, 8-word spoken form and QR code.

**States:** no-vault; locked; unlocking; unlocked; lockout; rotating; rotation-pending; awaiting-root-approval; backup-needed

**Accessibility:** Passphrase fields on create, unlock, change-passphrase and backup export and import use autocomplete=current-password (existing secret) or new-password (new secret), have visible labels and show/hide toggles with accessible names, never cancel paste, drop or input events and allow password-manager autofill (CTR-UX-001 UX-5, checked by F14.S01.M03 V07).; Progress during key derivation is announced politely and cancel is keyboard reachable.; Fingerprint is available as text and as a word list, not only a QR code.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-128-01 | [Domain schema](domain_schema.md) | 4 |
| PS-128-02 | [Validation rules](validation_rules.md) | 4 |
| PS-128-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-128-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-128-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-128-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-128-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-128-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-128-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-128-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/key/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI with the pinned noble versions and standard known-answer vectors.
- Private key bytes are never returned by any API, logged or sent over the network (abuse and network tests), and agreement keys are only ever derived from listed device keys.
- Unlock meets 8 s p95 on the Moto G profile without blocking the main thread beyond 50 ms per task.
