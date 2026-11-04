# F11.S03.M03 — Account and relay migration

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S03](../SPEC.md). **Process IDs:** PS-090-01…PS-090-10. **Code:** `packages/federation/src/interop/migration`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Moves a principal's home relay, and optionally a relay's address, without losing local records or history. The principal signs a move statement (classrup.federation.move/v1) with a registered device key. The did:key stays the same, so the author chain (seq/prev) continues on the new relay. The old relay serves a redirect for 180 days, and receivers rebind the author's origin relay only after verifying the statement. A 24 h veto window lets another registered device key cancel a move made with a stolen key. The user's vault export is coupled to the new relay import. ActivityPub and AT Protocol bridges are documented mappings only (Future).

## Responsibilities

- Own MigrationRecord for account moves (principal changes home relay) and relay moves (operator changes base URL with the same relay key).
- Build, sign and send the move statement, copy the principal's public records and tombstones to the new relay through F11.S02.M01, and publish the updated home relay in the portable identity document (F07.S02.M01).
- Enforce a 24 h veto window, a cool-down of one move per 30 days and a 180-day redirect on the old relay.
- Verify inbound move statements from other principals and relays and emit federation.account.moved only for statements that verify and become effective.
- Provide the redirect lookup GET /fed/v1/moved?author=did on relays and document the ActivityPub and AT Protocol mappings as Future work.

## Not responsible for

- Key generation, device key registration and recovery (F07 identity).
- Record verification and storage on the new relay (F11.S01.M02).
- Delivery retries and queues (F11.S02.M01).
- Vault export format (CTR-IOX-001 and F10 export modules); this module only triggers and verifies the coupling.
- Future: ActivityPub Move activity and alsoKnownAs, AT Protocol did:plc migration and handle rebinding; MVP documents the field mapping in docs/federation/bridges.md and implements none of it.
- Future: migration of private mailbox contents between relays; MVP leaves mailboxes to expire and the vault re-subscribes.

## User stories

- As a user, I can move to another relay, see each step (copy records, announce, wait 24 h, redirect) and keep every record I own on my device throughout.
- As a user whose phone was stolen, I can veto a move from a second registered device during the 24 h window.
- As a reader, I am sent to the author's new relay when I open an old link, and I see that the author moved.
- As a relay operator, I can announce a new base URL for my relay so peers update without re-peering when the key is unchanged.

## Edge cases

- Move statement signed by a device key that was revoked before effectiveAt; rejected with FEDERATION_MOVE_SIGNER_INVALID.
- Second move requested 10 days after the first; refused with FEDERATION_MOVE_COOLDOWN.
- Veto from a second device key arrives 23 h 59 min after announcement; move cancelled; veto arriving after 24 h is ignored.
- New relay unreachable or refuses the account; migration stays announced, redirect is not activated, and the user can cancel.
- Two move statements for the same did with different targets; both go to conflict review (F11.S02.M03) and no redirect is activated.
- Relay move statement signed by a different key than the pinned relay key; ignored with FEDERATION_KEY_MISMATCH and peer suspended by F11.S03.M01.
- The user deletes the account during a pending move; the move is cancelled and tombstones are sent to both relays.
- Move whose effectiveAt claims a time more than 7 days in the future; refused as VALIDATION_FAILED since timestamps are claims.

## UX and accessibility

- Move wizard: choose new relay (relay chooser), review what moves (public records count, tombstones), what stays on device, and the 24 h veto notice.
- Migration progress: steps copy records, announce, veto window countdown, redirect active, with delivery states per step (not claiming more than reached).
- Veto prompt on other devices: 'This account is being moved to relay X. Cancel the move?' with the time remaining.
- Moved banner on mirrored content: 'This author moved to relay X' with a link.

**States:** loading; empty; prepared; copying; announced; veto-window; effective; cancelled; closed; failed

**Accessibility:** Wizard steps use a labelled ordered list with the current step marked aria-current and each step's status given in text.; The veto countdown is available as text and announced at 12 h, 1 h and 10 min through aria-live polite, not by colour or animation alone.; Cancel and confirm buttons are ≥ 44×44 px and confirm dialogs trap and restore focus.

## Owned data

- `MigrationRecord` (classrup.federation.migration/v1, P0, RET-EVIDENCE)

## Interfaces

- Commands: `federation.migration.prepare`, `federation.migration.copy`, `federation.migration.announce`, `federation.migration.cancel`, `federation.migration.receive_move`
- Queries: `federation.migration.get`, `federation.migration.redirect`
- Emits: `federation.account.moved`
- Consumes: `identity.portable_doc.published`, `identity.device_key.revoked`, `federation.delivery.failed`, `federation.conflict.detected`, `privacy.deletion.requested`

## Dependencies

F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-090-01 | [Domain schema](domain_schema.md) | 3 |
| PS-090-02 | [Validation rules](validation_rules.md) | 3 |
| PS-090-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-090-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-090-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-090-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-090-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-090-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-090-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-090-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/interop/migration/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI.
- A stolen-key move is cancelled by a second device key within the veto window (abuse test).
- The did and every local record are unchanged by a move.
- Bridge documents exist and are marked Future.
