# F07.S01.M01 — Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S01](../SPEC.md). **Process IDs:** PS-052-01…PS-052-10. **Code:** `packages/identity/src/accounts/pseudonyms`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Local-first identity. An Account is the local principal in the user's vault - an Ed25519 account signing key whose did:key is the identifier, a chosen pseudonym as display label, and a set of Ed25519 device keys. There is no central account database. Pseudonym rules (NFKC, mixed-script and confusable-skeleton checks per UTS #39) run on the device; strict uniqueness exists only inside a relay that chooses to run an optional handle registry. Device keys are added with a signed link from an existing device and revoked with a signed revocation statement.

## Responsibilities

- Create the local principal - generate the account signing key and first device key on the device, derive the did:key, store only public keys and key references (private keys sit encrypted in the kernel keystore under ADR-0013 parameters).
- Validate pseudonyms - NFKC normalization, 3..32 code points, allowed characters, Highly Restrictive script rule and UTS
- Manage device keys - add via a signed link statement from an active device (max 10 active), revoke via a signed revocation statement, never revoke the last active key without a recovery kit.
- Own the optional relay HandleRegistration - claim, release and 30 day change cooldown enforced by that relay for its own namespace.

## Not responsible for

- Unlocking the vault and relay access tokens (F07.S01.M02).
- Recovery kit creation and use (F07.S01.M03), though recovery calls this module's registerRecoveredKey function.
- Public profile content (F07.S02.M02) and the published identity document (F07.S02.M01).
- Global pseudonym uniqueness - it does not exist; a pseudonym is a label and two relays can hold the same handle for different DIDs.
- Future: passkeys and WebAuthn as an additional factor, social recovery, edit-distance protection of well-known pseudonyms.

## User stories

- As a new user, I create an identity on my phone without an email or server account; the app generates my keys and asks me for a passphrase to protect them.
- As a user, I pick a pseudonym and am told if it is too similar to someone I already know.
- As a user with two devices, I add my laptop by approving it from my phone, and I can revoke the laptop if it is lost.
- As a relay user, I can claim my handle on a relay that offers a registry and keep it unique there.

## Edge cases

- Pseudonym mixes Latin and Cyrillic letters (for example 'раyраl'); rejected as a mixed-script confusable with IDENTITY_PSEUDONYM_INVALID.
- Pseudonym differs from a known contact only by a homoglyph; accepted locally but the UI shows a warning with the contact's name (IDENTITY_PSEUDONYM_CONFUSABLE is returned only by a relay registry).
- Two relays hold the same handle for different DIDs; allowed and shown with the DID fingerprint (first 8 characters of the did:key suffix) wherever ambiguity is possible.
- The user tries to change the pseudonym twice within 30 days; the local guard warns and requires confirmation, and a relay registry refuses with IDENTITY_PSEUDONYM_COOLDOWN.
- The user revokes the only active device key; refused with IDENTITY_LAST_DEVICE_KEY unless a recovery kit has been created and verified.
- A revoked device signs a statement that peers receive before they have seen the revocation; peers accept it until they learn of the revocation, because time of signing cannot be proven.
- The 11th device is added; refused with IDENTITY_DEVICE_LIMIT.
- Pseudonym contains right-to-left override or zero-width characters; rejected.
- The user forgets the vault passphrase and has no recovery kit; the account cannot be recovered, and the creation flow states this before finishing.

## UX and accessibility

- Create identity: pseudonym field with live checks, passphrase entry with strength meter, explanation that keys stay on this device, and a mandatory prompt to create a recovery kit.
- Devices: list of device keys with label, added date and last-used day, Add device (QR link) and Revoke with confirmation.
- Relay handle: claim or release a handle on a chosen relay with status and cooldown remaining.

**States:** loading; empty; valid; confusable-warning; invalid; pending-offline; claimed; conflict; error

**Accessibility:** Pseudonym validation messages are associated with the input by aria-describedby and announced via aria-live polite.; The QR link flow has a copyable text code alternative and all controls are at least 44 by 44 px.; Passphrase strength is shown as text, not colour only, and no cognitive-function test is used to unlock (WCAG 3.3.8).

## Owned data

- `Account` (classrup.identity.account/v1, P0, RET-STANDARD)
- `DeviceKey` (classrup.identity.device_key/v1, P3, RET-STANDARD)
- `HandleRegistration` (classrup.identity.handle_registration/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `identity.account.create`, `identity.pseudonym.change`, `identity.device_key.add`, `identity.device_key.revoke`, `identity.handle.claim`, `identity.handle.release`
- Queries: `identity.pseudonym.check`, `identity.account.get_own`
- Emits: `identity.account.created`, `identity.pseudonym.changed`, `identity.device_key.added`, `identity.device_key.revoked`
- Consumes: `privacy.deletion.completed`

## Dependencies

CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-052-01 | [Domain schema](domain_schema.md) | 3 |
| PS-052-02 | [Validation rules](validation_rules.md) | 3 |
| PS-052-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-052-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-052-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-052-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-052-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-052-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-052-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-052-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/accounts/pseudonyms/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No private key, passphrase or email is ever present in module storage, events, logs or relay payloads (privacy suite).
- Homoglyph and mixed-script pseudonym samples are rejected or warned according to the rules, and no claim of global pseudonym uniqueness appears in the UI or docs.
