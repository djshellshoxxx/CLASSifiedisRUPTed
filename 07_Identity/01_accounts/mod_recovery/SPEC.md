# F07.S01.M03 — Account recovery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S01](../SPEC.md). **Process IDs:** PS-053-01…PS-053-10. **Code:** `packages/identity/src/accounts/recovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Account recovery without any server holding a secret. The recovery kit is a one-time artifact the user downloads or prints - a 24-word secret (256 bits of entropy) and an encrypted file that wraps the account root key and carries a copy of the public identity document current at kit creation. A key derived with scrypt (N=2^17, r=8, p=1) from the secret encrypts the root seed with XChaCha20-Poly1305. The vault keeps only kit metadata and a public verifier; the kit is never uploaded by default and may go to a user-selected encrypted backup location. Recovery on a new device fetches and verifies the latest identity document, adds a new device key, publishes a signed recovery notice and, if asked, revokes the other device keys after a 72 hour notice window. The window binds honest clients; every verifying vault also waits 72 hours from its own first sight of the notice, and existing devices can dispute, which freezes the recovery as contested rather than cancelling it. Whoever holds the words and the file can act as the account, and creating a new kit does not invalidate an old one; the product states both.

## Responsibilities

- Create the kit on the client - generate the 24-word secret, derive keys with scrypt (N=2^17, r=8, p=1, 16-byte salt), encrypt the account root seed with XChaCha20-Poly1305 (24-byte nonce), embed the current public identity document as a hint, and make the file and printable sheet.
- Own RecoveryKit metadata in the vault - verifier public key, KDF parameters, blob checksum, status, last verification time and optional backup location label; never the 24 words.
- Run recovery on a new device - decrypt locally, obtain and verify the latest identity document (input, the kit's relays, or an export), register the new device key through the F07.S01.M01 port registerRecoveredKey, publish a root-signed recovery notice, and complete or cancel.
- Hold the 72 hour window in the recovering vault, extend it to 7 days when disputed, and report the honest limit that receivers enforce their own wait (F07.S02.M01).
- On existing devices, receive recovery notices for the own DID, show them, and let the user dispute with a device-signed statement that needs no kit state.
- Process incoming disputes in the recovering vault and in peer vaults, and implement RecoveryKitStatusPort.hasVerifiedKit() for F07.S01.M01.

## Not responsible for

- Key generation and device management (F07.S01.M01), identity document verification and the receiver-side wait rule (F07.S02.M01), and sessions (F07.S01.M02).
- Storing or escrowing any recovery secret on a relay or with the operator; there is no operator recovery, and a lost kit with no remaining device means the account cannot be recovered.
- Social recovery or guardians, hardware tokens (FUTURE).
- Future: Shamir-split kit, a dedicated recovery key separate from the root key so a superseded kit can be revoked, passkey-based second factor, guardian contacts, recovery notification channels beyond the identity document and mailbox.

## User stories

- As a new user, I am asked to download or print my recovery kit and to prove I saved it by re-entering 3 randomly chosen words.
- As a user who lost my phone, I install the app on a new device, enter my words and kit file, and regain my identity.
- As a user with a second device, I get a notice that a recovery was started and I can dispute it, which makes the recovery visible to everyone as contested.
- As a security-minded user, I can check that my kit still works without performing a recovery.
- As a contact of someone who recovers, I see 'recovery pending' for 72 hours from when my device first saw the notice before their old devices stop being trusted.

## Edge cases

- The user loses both the words and all devices; the account cannot be recovered and the creation flow said so; the user starts a new identity and can publish a signed statement from nothing, which is not a continuation.
- The user types one wrong word; the checksum words (BIP-39 style 8-bit checksum) detect it before running scrypt, with an error that does not reveal which word.
- The kit file is intact but words are wrong; XChaCha20-Poly1305 authentication fails and the vault applies a backoff of 60 s doubling up to 15 minutes after 5 failures.
- A thief has the printed kit and file; they can sign as the account, honest clients and verifying vaults still wait 72 hours before applying their revocations, and the product advises storing words and file in separate places.
- Recovery is started and the user does nothing for 7 days; the pending recovery expires, the new device key stays linked and announced, the planned revocation of the other keys is cancelled, and identity.recovery.cancelled is emitted with reason expired.
- The old device is offline for the whole 72 hours; on next sync it receives the notice, can still dispute, and if the revocation was already applied elsewhere the dispute makes the identity contested for every receiver.
- Two recoveries start from two new devices in vaults that cannot see each other; both succeed locally, and receivers see two recovery notices for one DID, keep both and show the identity as contested until the user resolves it explicitly.
- The user creates a new kit while recovery is pending in the same vault; refused with CONFLICT_STATE.
- Kit file is corrupted (checksum mismatch); verify_kit reports IDENTITY_KIT_CORRUPT and the vault offers to create a replacement.
- Recovery runs offline in an empty vault with no copy of the latest document; revokeOthers is refused with DEPENDENCY_UNAVAILABLE, or the user chooses the explicit 'device list unknown' mode, which adds the key, revokes nothing and warns that a fork is expected.
- A stolen old device disputes the recovery repeatedly; one dispute per key per 24 hours is processed, the recovery is contested but the kit holder may complete after 7 days with the contested state visible to peers.
- The user creates a new kit after a leak; the old kit still decrypts the same root key, so the UI says that superseding does not revoke the old kit and suggests a new identity if the old kit was exposed.

## UX and accessibility

- Create kit: words shown once in a 4 by 6 grid with copy disabled, print and download buttons, a confirmation step asking for 3 random words, a warning that anyone with the words and file can act as the account and that a newer kit does not revoke an older one, and a checkbox 'I stored the words and the file separately'.
- Recover account: words entry with per-word autocomplete from the 2048-word list, kit file chooser, latest-document status (fetched from relays, from an export, or unknown), progress for key derivation, explanation of the 72 hour window and of contested recoveries.
- Recovery notice banner on existing devices: 'A recovery was started for this account, first seen on <date>, adding device <fingerprint>. Dispute' with a Dispute button and 'This was me'.

**States:** no-kit; kit-active; verifying; recovery-pending; contested; recovery-complete; disputed; expired; device-list-unknown; error

**Accessibility:** Word entry supports keyboard and screen readers, each word field has a label 'Word 1 of 24', and errors are announced via aria-live polite.; The confirmation step does not require a memory puzzle beyond retyping the displayed words (no cognitive function test, WCAG 3.3.8) and allows paste of the whole phrase.; All buttons are at least 44 by 44 px and the printable sheet is high-contrast text.

## Owned data

- `RecoveryKit` (classrup.identity.recovery_kit/v1, P4, RET-STANDARD)

## Interfaces

- Commands: `identity.recovery.create_kit`, `identity.recovery.verify_kit`, `identity.recovery.begin`, `identity.recovery.complete`, `identity.recovery.cancel`, `identity.recovery.receive_notice`, `identity.recovery.dispute`, `identity.recovery.acknowledge`, `identity.recovery.receive_dispute`
- Queries: `identity.recovery.get_status`
- Emits: `identity.recovery.kit_created`, `identity.recovery.completed`, `identity.recovery.requested`, `identity.recovery.cancelled`
- Consumes: `identity.portable_doc.published`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-053-01 | [Domain schema](domain_schema.md) | 3 |
| PS-053-02 | [Validation rules](validation_rules.md) | 4 |
| PS-053-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-053-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-053-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-053-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-053-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-053-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-053-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 5 |
| PS-053-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/accounts/recovery/index.ts`.

## Acceptance criteria

- All tests T01-T25 pass in CI.
- The 24 words and derived keys never appear in storage, logs, events, exports or network traffic (privacy suite).
- Honest clients and verifying vaults that saw the notice do not apply a recovery revocation before 72 hours after their own first sight of it, a dispute makes the recovery contested for every receiver without cancelling it, and the documentation states that an attacker with the words and file can sign as the account.
- The UI and these criteria state that creating a new kit does not revoke an older kit.
