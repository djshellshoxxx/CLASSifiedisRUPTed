# F11.S03.M03 — Account and relay migration

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S03](../SPEC.md). **Process IDs:** PS-090-01…PS-090-10. **Code:** `packages/federation/src/interop/migration`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Moves a principal's user-selected home relay (the relay it lists first and delivers to), and optionally a relay's address, without losing local records or history. The principal signs a move statement (classrup.federation.move/v1) with a device key that its portable identity document lists as active; the did:key stays the same and its chains simply continue on the new relay. No relay is authoritative for the principal's records, so a move changes only where others fetch and deliver: the old relay serves a redirect for 180 days and receivers update their fetch hints after verifying the statement. A 24 h veto window, measured on each receiver's own clock from its first verified receipt (or from the old relay's signed receipt time) and never from the claimed announcement time, lets another device key cancel a move made with a stolen key; signer key status is checked at the receiver's time. Conflicting moves of one subject go to conflict review and activate nothing. The user's vault export is coupled to the new relay import. ActivityPub and AT Protocol bridges are documented mappings only (Future).

## Responsibilities

- Own MigrationRecord for account moves (principal changes its selected home relay) and relay moves (operator changes base URL with the same relay key).
- Build, sign (through F11.S01.M02 publish) and send the move statement, copy the principal's public records and tombstones to the new relay through F11.S02.M01, and publish the updated relays list in the portable identity document (F07.S02.M01).
- Enforce a 24 h veto window on each receiver's clock, a cool-down of one move per 30 days, a 24 h minimum key age and a 180-day redirect on the old relay.
- Verify inbound move statements from other principals and relays, open a commitment conflict through F11.S02.M03 for conflicting moves, and emit federation.account.moved only for statements that verify and become effective on this receiver.
- Provide the redirect lookup GET /fed/v1/moved?author=did on relays and document the ActivityPub and AT Protocol mappings as Future work.
- Register the N6 privacy ports for the migration history.

## Not responsible for

- Key generation, device key registration, revocation and recovery (F07 identity).
- Record verification and storage on the new relay (F11.S01.M02); acceptance there never depends on a move.
- Delivery retries and queues (F11.S02.M01 and F15.S01.M01).
- Conflict records and their resolution (F11.S02.M03).
- Vault export format (CTR-IOX-001 and F10 export modules); this module only triggers and verifies the coupling.
- Future: ActivityPub Move activity and alsoKnownAs, AT Protocol did:plc migration and handle rebinding; MVP documents the field mapping in docs/federation/bridges.md and implements none of it.
- Future: migration of private mailbox contents between relays; MVP leaves mailboxes to expire and the vault re-subscribes.

## User stories

- As a user, I can move to another relay, see each step (copy records, announce, wait 24 h, redirect) and keep every record I own on my device throughout.
- As a user whose phone was stolen, I can veto a move from a second registered device during the 24 h window, even if the thief backdated the move.
- As a reader, I am sent to the author's new relay when I open an old link, and I see that the author moved.
- As a relay operator, I can announce a new base URL for my relay so peers update without re-peering when the key is unchanged.

## Edge cases

- Move statement signed by a device key that the latest verified portable document marks revoked at the receiver's time; rejected with FEDERATION_MOVE_SIGNER_INVALID whatever announcedAt claims.
- The signer key is revoked after the move was announced but before it becomes effective on this receiver; the promotion re-check cancels it and no account.moved is emitted.
- Second move requested 10 days after the first; refused with FEDERATION_MOVE_COOLDOWN.
- A stolen key signs a move claiming announcedAt 25 h ago; an observer holds it for a full 24 h from its own first verified receipt and a veto from K2 at 23 h still cancels it; the old relay, receiving it straight from the device, refuses it because announcedAt is more than 10 min from its clock.
- Veto from a second device key arrives 23 h 59 min after this receiver's first receipt; move cancelled; a veto arriving after the local effective time is ignored.
- New relay unreachable or refuses the account; migration stays prepared or announced, redirect is not activated, the old relay stays the selected delivery relay and the user can cancel.
- Two move statements for the same did with different targets; F11.S02.M03 opens a commitment conflict for move:subject, both moves are held and no redirect is activated.
- Relay move statement signed by a different key than the pinned relay key; dropped with FEDERATION_KEY_MISMATCH and counted only against the sender that signed the delivering request, never against the relay it names.
- The user deletes the account during a pending move; the move is cancelled and tombstones are sent to both relays.
- Move whose announcedAt claims a time more than 10 minutes in the receiver's future; refused as VALIDATION_FAILED since timestamps are claims.

## UX and accessibility

- Move wizard: choose new relay (relay chooser), review what moves (public records count, tombstones), what stays on device, and the 24 h veto notice.
- Migration progress: steps copy records, announce, veto window countdown, redirect active, with delivery states per step (not claiming more than reached).
- Veto prompt on other devices: 'This account is being moved to relay X. Cancel the move?' with the time remaining on this device's clock.
- Moved banner on mirrored content: 'This author moved to relay X' with a link.

**States:** loading; empty; prepared; copying; announced; veto-window; held-conflict; effective; cancelled; closed; failed

**Accessibility:** Wizard steps use a labelled ordered list with the current step marked aria-current and each step's status given in text.; The veto countdown is available as text and announced at 12 h, 1 h and 10 min through aria-live polite, not by colour or animation alone.; Cancel and confirm buttons are ≥ 44×44 px and confirm dialogs trap and restore focus.

## Owned data

- `MigrationRecord` (classrup.federation.migration/v1, P0, RET-EVIDENCE)

## Interfaces

- Commands: `federation.migration.prepare`, `federation.migration.copy`, `federation.migration.announce`, `federation.migration.cancel`, `federation.migration.receive_move`
- Queries: `federation.migration.get`, `federation.migration.redirect`
- Emits: `federation.account.moved`
- Consumes: `identity.portable_doc.published`, `identity.device_key.revoked`, `federation.delivery.failed`, `federation.conflict.detected`, `federation.conflict.resolved`, `privacy.deletion.requested`, `privacy.deletion.completed`

## Dependencies

F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-090-01 | [Domain schema](domain_schema.md) | 3 |
| PS-090-02 | [Validation rules](validation_rules.md) | 5 |
| PS-090-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-090-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-090-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-090-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-090-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-090-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-090-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-090-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/interop/migration/index.ts`.

## Acceptance criteria

- All tests T01–T25 pass in CI.
- A stolen-key move, including one with a backdated announcedAt, is cancelled by a second device key within the veto window (abuse tests T04 and T22).
- The did and every local record are unchanged by a move, and no relay becomes authoritative for the principal's records.
- Bridge documents exist and are marked Future.
