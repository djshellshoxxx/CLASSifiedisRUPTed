# F07.S01.M02 — Sessions

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S01](../SPEC.md). **Process IDs:** PS-054-01…PS-054-10. **Code:** `packages/identity/src/accounts/sessions`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Two kinds of session, neither needing a central account. A vault unlock session lives only in memory on the user's device - it opens the local vault with the passphrase (or a platform-protected key), auto-locks after 15 minutes idle by default and holds no server credential. A relay access session is an opaque 256-bit token a relay issues after an Ed25519 challenge-response signed by a device key of a DID, used only for that relay's resources (index writes, mailboxes, auction hosting, push subscriptions). Tokens are stored hashed on the relay, expire idle after 7 days and absolute after 30 days, and are listed and revocable by the user.

## Responsibilities

- Unlock and lock the vault - derive the vault key from the passphrase with scrypt (N=2^17, r=8, p=1), keep it in memory only, lock on idle (default 15 minutes, range 1 minute to 8 hours), on tab close and on explicit lock.
- Issue relay challenges (32-byte nonce, 120 s TTL, single use) and verify the signature over classrup-login:v1:<relayId>:<nonce> with a device key authorized by the DID's identity document.
- Issue, rotate and revoke relay access tokens (256-bit random, SHA-256 hash stored, idle 7 days, absolute 30 days, max 20 active per DID per relay).
- List sessions - the vault shows its unlock state and its known relay tokens; a relay shows the sessions of the DID that presents a valid token.

## Not responsible for

- Creating keys and devices (F07.S01.M01) and recovery (F07.S01.M03).
- Authorization decisions; the kernel command bus evaluates capabilities per CTR-CAP-001.
- Passkeys or WebAuthn second factors, which are FUTURE (ADR-0013).
- A global account session; there is none, and the vault never depends on a server to open.
- Future: WebAuthn PRF for vault unlock, hardware-backed non-extractable device keys where supported, per-relay scoped tokens with capability lists.

## User stories

- As a user, I unlock my vault with my passphrase and it locks itself after 15 idle minutes so a borrowed phone does not expose my data.
- As a user, I sign in to a relay with my device key, without a password, and the relay gives me a token valid for at most 30 days.
- As a user, I see my active relay sessions and can revoke any of them.
- As a relay operator, I can see only that a DID has a session, not the vault or the keys.

## Edge cases

- Wrong passphrase entered repeatedly; the vault applies a local backoff of 1 s, 2 s, 4 s up to 15 minutes after 5 failures, and states that this is a convenience, because an attacker with the stored file can guess offline limited only by scrypt cost.
- The challenge nonce is used twice or after 120 s; the second use returns EXPIRED or CONFLICT_STATE and no token is issued.
- The device key was revoked but the relay has not seen the new identity document; the relay accepts the key until it fetches a newer document, and revokes tokens when it does.
- A token is presented from a different network; the relay does not bind tokens to IPs, and the user can see the /24 prefix used at start in the session list.
- Two tabs unlock the same vault; a Web Lock makes one the writer and the other read-only until the first locks.
- The absolute 30-day limit is reached during use; the next request returns EXPIRED and the client silently re-runs the challenge-response with the device key.
- Unknown DID asks for a challenge; the relay returns a decoy challenge (HMAC-derived) so existence cannot be probed, and start fails uniformly with UNAUTHENTICATED.
- The device clock is wrong by an hour; relay-side expiry uses the relay clock and vault idle-lock uses a monotonic timer.

## UX and accessibility

- Unlock screen: passphrase field, show/hide toggle, biometric or platform unlock button where supported, backoff countdown text, link to recovery.
- Settings > Sessions: this device's lock timeout selector, list of relay sessions with relay name, started day, last used, /24 prefix, Revoke and Revoke all others.

**States:** locked; unlocking; unlocked; backoff; relay-session-active; expired; revoked; error

**Accessibility:** The passphrase field has a visible label, a show/hide control, and error text linked with aria-describedby and announced via aria-live polite.; Backoff countdown is text and updates at most every 10 seconds to avoid noisy announcements.; Revoke buttons are at least 44 by 44 px with accessible names including the relay name.

## Owned data

- `LoginChallenge` (classrup.identity.login_challenge/v1, P4, RET-EPHEMERAL)
- `Session` (classrup.identity.session/v1, P4, RET-SHORT)

## Interfaces

- Commands: `identity.session.unlock`, `identity.session.lock`, `identity.login_challenge.issue`, `identity.session.start`, `identity.session.rotate`, `identity.session.revoke`
- Queries: `identity.session.list_own`
- Emits: `identity.session.started`, `identity.session.revoked`
- Consumes: `identity.device_key.revoked`, `identity.recovery.completed`, `security.role.assigned`, `security.role.revoked`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-054-01 | [Domain schema](domain_schema.md) | 3 |
| PS-054-02 | [Validation rules](validation_rules.md) | 3 |
| PS-054-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-054-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-054-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-054-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-054-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-054-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-054-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-054-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/accounts/sessions/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Tokens, nonces, passphrases and vault keys never appear in storage as plaintext, logs, events or URLs (privacy suite).
- Idle and absolute expiry and device-revocation effects are verified with an injected clock.
