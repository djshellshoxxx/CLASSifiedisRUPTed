# F07.S01.M03 — Account recovery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S01](../SPEC.md). **Process IDs:** PS-053-01…PS-053-10. **Code:** `packages/identity/src/accounts/recovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Account recovery without any server holding a secret. The recovery kit is a one-time artifact the user downloads or prints - a 24-word secret (256 bits of entropy) and an encrypted blob that wraps the account signing key. A key derived with scrypt (N=2^17, r=8, p=1) from the secret encrypts the blob with XChaCha20-Poly1305. The vault keeps only kit metadata and a public verifier; the kit is never uploaded by default and may go to a user-selected encrypted backup location. Recovery on a new device adds a new device key; revoking the other devices is announced and takes effect only after a 72 hour notice window during which an existing device can dispute it. Whoever holds the words and the blob can act as the account, and the product states this.

## Responsibilities

- Create the kit on the client - generate the 24-word secret, derive keys with scrypt (N=2^17, r=8, p=1, 16-byte salt), encrypt the account signing seed with XChaCha20-Poly1305 (24-byte nonce), and make the file and printable sheet.
- Own RecoveryKit metadata in the vault - verifier public key, KDF parameters, blob checksum, status, last verification time and optional backup location label; never the 24 words.
- Run recovery on a new device - decrypt locally, register a new device key through F07.S01.M01, publish a signed recovery notice, and complete or cancel.
- Enforce the 72 hour notice window before other device keys are revoked, and support a signed dispute from an existing device.

## Not responsible for

- Key generation and device management (F07.S01.M01) and sessions (F07.S01.M02).
- Storing or escrowing any recovery secret on a relay or with the operator; there is no operator recovery, and a lost kit with no remaining device means the account cannot be recovered.
- Social recovery or guardians, hardware tokens (FUTURE).
- Future: Shamir-split kit, passkey-based second factor, guardian contacts, recovery notification channels beyond the identity document and mailbox.

## User stories

- As a new user, I am asked to download or print my recovery kit and to prove I saved it by re-entering 3 randomly chosen words.
- As a user who lost my phone, I install the app on a new device, enter my words and kit file, and regain my identity.
- As a user with a second device, I get a notice that a recovery was started and I can dispute it within 72 hours.
- As a security-minded user, I can check that my kit still works without performing a recovery.

## Edge cases

- The user loses both the words and all devices; the account cannot be recovered and the creation flow said so; the user starts a new identity and can publish a signed statement from nothing, which is not a continuation.
- The user types one wrong word; the checksum words (BIP-39 style 8-bit checksum) detect it before running scrypt, with an error that does not reveal which word.
- The kit file is intact but words are wrong; XChaCha20-Poly1305 authentication fails and the vault applies a backoff of 60 s doubling up to 15 minutes after 5 failures.
- A thief has the printed kit and file; they can recover and the notice window is the only brake, so the product advises storing words and file in separate places.
- Recovery is started and the user does nothing for 7 days; the pending state expires back to active and the new device key remains registered.
- The old device is offline for the whole 72 hours; it learns of the notice on next sync, can still dispute until the revocation has been applied by the recoverer, after which the user sees a contested identity document.
- Two recoveries start at once from two new devices; the second is refused with CONFLICT_STATE while the first is pending.
- The user creates a new kit while recovery is pending; refused with CONFLICT_STATE.
- Kit file is corrupted (checksum mismatch); verify_kit reports IDENTITY_KIT_CORRUPT and the vault offers to create a replacement.

## UX and accessibility

- Create kit: words shown once in a 4 by 6 grid with copy disabled, print and download buttons, a confirmation step asking for 3 random words, a warning that anyone with the words and file can act as the account, and a checkbox 'I stored the words and the file separately'.
- Recover account: words entry with per-word autocomplete from the 2048-word list, kit file chooser, progress for key derivation, explanation of the 72 hour window.
- Pending recovery banner on existing devices: 'A recovery was started on <date> for <new device label>. Dispute now' with a Dispute button.

**States:** no-kit; kit-active; verifying; recovery-pending; recovery-complete; disputed; expired; error

**Accessibility:** Word entry supports keyboard and screen readers, each word field has a label 'Word 1 of 24', and errors are announced via aria-live polite.; The confirmation step does not require a memory puzzle beyond retyping the displayed words (no cognitive function test, WCAG 3.3.8) and allows paste of the whole phrase.; All buttons are at least 44 by 44 px and the printable sheet is high-contrast text.

## Owned data

- `RecoveryKit` (classrup.identity.recovery_kit/v1, P4, RET-STANDARD)

## Interfaces

- Commands: `identity.recovery.create_kit`, `identity.recovery.verify_kit`, `identity.recovery.begin`, `identity.recovery.complete`, `identity.recovery.cancel`
- Queries: `identity.recovery.get_status`
- Emits: `identity.recovery.kit_created`, `identity.recovery.completed`, `identity.recovery.requested`, `identity.recovery.cancelled`
- Consumes: `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-053-01 | [Domain schema](domain_schema.md) | 3 |
| PS-053-02 | [Validation rules](validation_rules.md) | 3 |
| PS-053-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-053-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-053-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-053-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-053-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-053-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-053-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-053-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/accounts/recovery/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- The 24 words and derived keys never appear in storage, logs, events, exports or network traffic (privacy suite).
- A recovery with revocation of other devices is impossible before 72 hours and a dispute from an existing device returns the kit to active.
