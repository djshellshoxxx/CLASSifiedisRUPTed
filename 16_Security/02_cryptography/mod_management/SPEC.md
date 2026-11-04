# F16.S02.M02 — Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-129-01…PS-129-10. **Code:** `packages/security/src/cryptography/management`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A key registry in two places. In a vault it records the user's own keys and the keys of counterparties the vault has seen in verified statements, together with any revocation statements it received. On a relay it records public keys registered for relay access (device keys, the relay's own transport key, the VAPID key, peer relay keys) and the revocations the relay knows. Signature verification consults the registry and returns not only valid or invalid but how fresh the revocation knowledge is, because a revocation can only be known after it reaches the verifier; offline revocation lag is therefore reported, never hidden.

## Responsibilities

- [object Object]
- Register keys from verified key statements (device link, rotation, relay registration) and expose key status queries for the verifier.
- Record revocations from signed revocation statements (classrup.security.keyrevocation/v1) signed by the key itself, by another active key of the same principal, or by the principal's recovery key, and publish a relay revocation list.
- Return status with revocation freshness (lastCheckedAt, source) so callers can require freshness for high-stakes actions and warn when it is stale.
- Poll peers and relays for revocation lists on a schedule and mark keys with unknown freshness when sources are unreachable.

## Not responsible for

- Generating and wrapping keys (F16.S02.M01) and signing formats (F16.S02.M03).
- Identity account records and device linking UX (F07.S01.M01); this module stores the keys those flows produce.
- Relay peer trust decisions (F11.S03.M01), which consume key status.
- Future: key transparency log with signed tree heads; short-lived delegated signing keys; certificate-style attestations by third parties.

## User stories

- As a user, I can revoke a lost device's key from another device or with my recovery kit, and my contacts' vaults learn of it when they next sync.
- As a user verifying a counterparty's consent, I see whether their key was revoked and how recently my vault checked.
- As a relay operator, I publish a revocation list that peers and vaults can poll and verify with my relay key.

## Edge cases

- A revocation statement arrives for a key the vault has never seen; it is stored as a pending revocation and applied if the key appears later in a statement, with the statement's receipt time shown.
- Signature made by a key before its revocation, verified after; the verifier policy marks the signature valid for statements received before the revocation's effective time and invalid for later ones, using the verifier's own receipt time.
- Revocation claims a compromise effective date 20 days in the past; the vault accepts effectiveFrom up to 30 days back but marks every consent received in that window as 'signed during claimed compromise'.
- An attacker holding a compromised key publishes a revocation of the victim's other keys; revocation by another key of the same principal is accepted only if that key is active in the principal's key chain and the action is flagged for confirmation by the victim's recovery key within 7 days.
- Revocation list source unreachable for 8 days; keys from that source show freshness unknown and high-stakes actions ask the user to refresh or proceed with a warning.
- Two conflicting statements claim different successor keys for the same old key (forked vault); both are stored, the key is frozen with status conflicted, and the user must resolve explicitly.
- Registry holds more than 10 active device keys for one principal on a relay; further registrations are refused with SECURITY_KEY_LIMIT.

## UX and accessibility

- My keys: list of device keys with label, created date, last used, fingerprint (word list), status, revoke action with confirmation and reason picker.
- Counterparty key detail (vault): fingerprint, first seen, revocation status, freshness 'checked 3 hours ago from relay X', link to the statement.
- Relay operator: registered keys by purpose, revocation list publication status, peer list freshness.

**States:** loading; active; revoked; expired; conflicted; freshness-unknown; pending-revocation

**Accessibility:** Status is conveyed by words and icons, not color alone.; Revoke confirmation is a dialog with focus trap naming the key fingerprint, buttons at least 44 by 44 px.; Freshness text is plain language and announced when it changes during verification.

## Owned data

- `KeyRecord` (classrup.security.keyrecord/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `security.keyrecord.register`, `security.keyrecord.revoke`, `security.keyrecord.record_revocation`
- Queries: `security.keyrecord.get_status`, `security.keyrecord.list_revocations`, `security.keyrecord.list_own`
- Emits: `security.key.registered`, `security.key.revoked`
- Consumes: `identity.device_key.added`, `identity.device_key.revoked`, `federation.peer.added`, `federation.account.moved`

## Dependencies

F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-129-01 | [Domain schema](domain_schema.md) | 3 |
| PS-129-02 | [Validation rules](validation_rules.md) | 3 |
| PS-129-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-129-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-129-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-129-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-129-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-129-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-129-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-129-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/management/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- A revoked key can never become active again and verification always reports freshness of revocation knowledge.
- Revocation by an attacker with one compromised key cannot override the recovery key.
