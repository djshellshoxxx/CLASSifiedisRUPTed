# F07.S01.M01 — Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S01](../SPEC.md). **Process IDs:** PS-052-01…PS-052-10. **Code:** `packages/identity/src/accounts/pseudonyms`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Local-first identity. An Account is the local principal in the user's vault - an Ed25519 account root key whose did:key is the identifier, a chosen pseudonym as display label, and a set of Ed25519 device keys. There is no central account database. The root key is held only on the root device (the creating device, or the recovering device after a recovery) and inside the recovery kit, and it signs only identity documents, device links, device revocations and recovery notices; every routine statement (profile, review, attestation, consent, handle claim, relay login, envelopes) is signed by a device key that the author's current identity document lists as active. Pseudonym rules (NFKC, mixed-script and confusable-skeleton checks per UTS #39) run on the device; strict uniqueness exists only inside a relay that chooses to run an optional handle registry. Device keys are added with a link signed by the root key plus a possession signature by the new key, and revoked with classrup.security.keyrevocation/v1 statements whose signer roles are explicit. Revoking a stolen non-root device protects every verifier that learns of the revocation; a stolen root device or kit can still sign as the account, and the product says so.

## Responsibilities

- Create the local principal - generate the account root key and the first device key on the device, derive the did:key, store only public keys and key references (private keys sit encrypted in the kernel keystore under ADR-0013 parameters), and keep the root key only on this root device and in the recovery kit.
- Validate pseudonyms - NFKC normalization, 3..32 code points, allowed characters, Highly Restrictive script rule and the UTS 39 skeleton, reserved names, and warn when a pseudonym is confusable with a known contact.
- Manage device keys - add via a link signed by the root key with a possession signature by the new key (max 10 active), revoke with explicit signer roles (the key itself or the root key take effect at once, another device key waits 7 days as pending, mutual revocations freeze as contested), never revoke the last active key without a verified recovery kit.
- Own the optional relay HandleRegistration - claim, release and 30 day change cooldown enforced by that relay for its own namespace, with claim and release statements bound to the relay, a fresh claim time and the registration revision.
- Define the one DID and key fingerprint used by every identity screen and by F16.S02.M02 - 16 base58btc characters of SHA-256 over the raw 32-byte public key (about 93 bits), with an 8-word spoken form.
- Provide the port registerRecoveredKey to F07.S01.M03 and declare the injected ports RecoveryKitStatusPort, KeyStatusPort, ConsentCheckPort and the F10 privacy ports, so the dependency graph stays acyclic.

## Not responsible for

- Unlocking the vault and relay access tokens (F07.S01.M02).
- Recovery kit creation and use (F07.S01.M03), though recovery calls this module's registerRecoveredKey port.
- Public profile content (F07.S02.M02) and the published identity document with its chain, fork and union-of-revocations rules (F07.S02.M01).
- Key records and relay revocation lists (F16.S02.M02, which owns the classrup.security.keyrevocation/v1 statement type this module produces for device keys).
- Global pseudonym uniqueness - it does not exist; a pseudonym is a label and two relays can hold the same handle for different DIDs.
- Future: passkeys and WebAuthn as an additional factor, social recovery, edit-distance protection of well-known pseudonyms, rotation of the account root key with a signed move statement, keeping the root key only offline.

## User stories

- As a new user, I create an identity on my phone without an email or server account; the app generates my keys and asks me for a passphrase to protect them.
- As a user, I pick a pseudonym and am told if it is too similar to someone I already know.
- As a user with two devices, I add my laptop by approving it from my phone (the root device), and I can revoke the laptop if it is lost.
- As a relay user, I can claim my handle on a relay that offers a registry and keep it unique there.
- As a user whose laptop was stolen, I revoke it from my phone and every contact who receives the revocation stops accepting statements it signs afterwards.

## Edge cases

- Pseudonym mixes Latin and Cyrillic letters (for example 'раyраl'); rejected as a mixed-script confusable with IDENTITY_PSEUDONYM_INVALID.
- Pseudonym differs from a known contact only by a homoglyph; accepted locally but the UI shows a warning with the contact's name (IDENTITY_PSEUDONYM_CONFUSABLE is returned only by a relay registry).
- Two relays hold the same handle for different DIDs; allowed and shown with the DID fingerprint (16 base58btc characters of SHA-256 of the root public key, about 93 bits, never the constant did:key prefix) wherever ambiguity is possible.
- The user tries to change the pseudonym twice within 30 days; the local guard warns and requires confirmation, and a relay registry refuses with IDENTITY_PSEUDONYM_COOLDOWN.
- The user revokes the only active device key; refused with IDENTITY_LAST_DEVICE_KEY unless RecoveryKitStatusPort reports a created and verified recovery kit.
- A revoked device signs a statement; a verifier whose latest verified document already marks the key revoked refuses it whatever createdAt claims, and a verifier that learns of the revocation later quarantines the statements it first saw at or after revokesEffectiveAt (clamped to no earlier than 30 days before its earliest evidence of the revoking document) and keeps earlier ones with a revoked-signer marker, because the time of signing cannot be proven (F07.S02.M01, F11.S01.M02).
- The 11th device is added; refused with IDENTITY_DEVICE_LIMIT.
- Pseudonym contains right-to-left override or zero-width characters; rejected.
- The user forgets the vault passphrase and has no recovery kit; the account cannot be recovered, and the creation flow states this before finishing.
- A stolen linked device revokes the two other devices; both revocations wait as pending for 7 days, the legitimate devices see them and counter-revoke the thief's key, which freezes the keys as contested until the root key decides.
- A link statement lists another user's device public key under this DID; refused with IDENTITY_LINK_INVALID because the possession signature over this DID is missing.
- A handle claim captured on relay A is replayed to relay B, or an old release is replayed after the owner reclaimed the handle; refused because claims name the relay and releases name the registration revision.
- A linked (non-root) device tries to add another device; refused with IDENTITY_ROOT_KEY_REQUIRED and the UI points to the root device or the recovery kit.

## UX and accessibility

- Create identity: pseudonym field with live checks, passphrase entry with strength meter, explanation that keys stay on this device and that a stolen device file can be attacked offline, and a mandatory prompt to create a recovery kit.
- Devices: list of device keys with label, fingerprint, added date and last-used day, a 'root device' badge, pending and contested revocation states, Add device (QR link, root device only) and Revoke with confirmation.
- Relay handle: claim or release a handle on a chosen relay with status and cooldown remaining, and a note that the handle is unique only on that relay.

**States:** loading; empty; valid; confusable-warning; invalid; pending-offline; claimed; revocation-pending; contested; conflict; error

**Accessibility:** Pseudonym validation messages are associated with the input by aria-describedby and announced via aria-live polite.; The QR link flow has a copyable text code alternative and all controls are at least 44 by 44 px.; Passphrase strength is shown as text, not colour only, and no cognitive-function test is used to unlock (WCAG 3.3.8).

## Owned data

- `Account` (classrup.identity.account/v1, P0, RET-STANDARD)
- `DeviceKey` (classrup.identity.device_key/v1, P3, RET-STANDARD)
- `HandleRegistration` (classrup.identity.handle_registration/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `identity.account.create`, `identity.pseudonym.change`, `identity.device_key.add`, `identity.device_key.revoke`, `identity.device_key.receive`, `identity.handle.claim`, `identity.handle.release`
- Queries: `identity.pseudonym.check`, `identity.account.get_own`
- Emits: `identity.account.created`, `identity.pseudonym.changed`, `identity.device_key.added`, `identity.device_key.revoked`
- Consumes: `privacy.deletion.completed`

## Dependencies

F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-052-01 | [Domain schema](domain_schema.md) | 5 |
| PS-052-02 | [Validation rules](validation_rules.md) | 5 |
| PS-052-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-052-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-052-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-052-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-052-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-052-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-052-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-052-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/accounts/pseudonyms/index.ts`.

## Acceptance criteria

- All tests T01-T29 pass in CI.
- No private key, passphrase or email is ever present in module storage, events, logs or relay payloads (privacy suite), and the root key exists only on the root device keystore and in the kit.
- Homoglyph and mixed-script pseudonym samples are rejected or warned according to the rules, and no claim of global pseudonym uniqueness appears in the UI or docs.
- A stolen linked device cannot revoke the legitimate devices on its own, and the UI states that a stolen root device or kit can still sign as the account.
