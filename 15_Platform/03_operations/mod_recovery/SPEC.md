# F15.S03.M03 — Disaster recovery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S03](../SPEC.md). **Process IDs:** PS-122-01…PS-122-10. **Code:** `apps/relay/src/ops/recovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Restore tooling and the runbook for a relay, with targets of RPO 6 h and RTO 4 h (CTR-IOX-001 IOX-3, IOX-4), plus operator replay of dead-lettered events (CTR-EVT-001 EVT-6). Recovery always creates a new relay instance from verified, authenticated backups of F15.S03.M02, applies WAL frames after the snapshot's walPosition up to the chosen time, re-applies the tombstone ledger, re-delivers only those archived events that the restored data actually contains to relay consumers without external side effects, publishes a relay-signed restore announcement so vault outboxes resend what the relay lost, freezes relay-hosted auctions with activity in the lost window, and only then opens the port. Under ADR-0016 the relay holds no user-owned private records, so recovery of a user's private data is a vault restore from the user's own export (F10.S01.M03), which this module documents but does not perform. Data written after the last archived WAL frame is lost, which is the stated RPO, and the report says exactly how much.

## Responsibilities

- Provide the restore command relay restore --to <dir> [--at <timestamp>|latest] [--new-identity] that locates the base snapshot through authenticated manifests, verifies checksums, decrypts, applies WAL frames after the snapshot's walPosition in order up to the target time, runs integrity checks and migrations check, re-applies the tombstone ledger, and writes a restore report.
- Provide a recovery plan query computed from BackupRecords and authenticated manifests (not from events) that shows which snapshot, WAL segments, archive and ledger artifacts would be used, the expected data-loss window and an RTO estimate before anything is restored.
- Re-deliver archived outbox events only when occurredAt ≤ reachedTimestamp, the event's aggregate revision exists in the restored records and the consumer's inbox row is absent, never to consumers registered with external side effects (push, email), and report every later event as lost.
- Publish after restore a relay-signed restore announcement classrup.platform.relay_restore/v1 { relayId, keyId, restoredTo, lostWindow, lastReceiptSeq, epoch, announcedAt, predecessorRelayId? } (epoch is the new receipt epoch; receipts of earlier epochs with seq above lastReceiptSeq are the ones the relay lost; predecessorRelayId only from a new identity) served by F15.S02.M01 in /.well-known/classrup-relay.json, increment the receipt epoch, and freeze relay-hosted auctions with activity in the lost window through the AuctionHostPort registered by F04.
- Register the NewIdentityHook with the F15.S02.M01 relay process (inverted registration, because this module depends on F15.S02.M01) so that relay identity init --new-identity, with or without a restore, publishes a restore announcement signed by the new identity and naming predecessorRelayId before the port opens (F16.S03.M03 RB-01).
- Provide dead-letter listing and operator replay (max 500 events per call, max 3 replays per event, tracked in the dead_letter replay_count) with audit and a dry-run mode, and purge dead letters 30 days after dead-lettering.
- Maintain the restore runbook with timed steps that fit in 4 h and the quarterly drill checklist.

## Not responsible for

- Taking and verifying backups, manifest authentication and the tombstone ledger (F15.S03.M02 mod_backups).
- The dead_letter table and its columns (F15.S02.M03 owns it, including replay_count and last_replayed_at).
- Resending lost deliveries (vault outboxes of F15.S01.M01 and F11.S02.M01 react to the restore announcement) and renegotiating frozen auctions (F04 auction modules).
- Recovery of a user's vault; the user restores from their own export, F10.S01.M03 and the recovery kit of F07, and nothing here can read or rebuild a vault.
- Failover orchestration, hot standby and DNS automation. Future: warm standby relay with continuous WAL shipping; Future: automatic DNS cutover.
- Incident process and communications (F16.S03.M02 and F16.S03.M03).

## User stories

- As a relay operator, after losing my server I can restore the latest backup to a new machine in under 4 hours, losing at most the last 6 hours (typically 5 minutes), and know exactly what was lost.
- As a relay operator, I can see which events failed delivery, fix the cause and replay them without duplicating side effects.
- As a member, I understand that if my relay is lost, my private records are safe in my own vault, my deliveries show as pending until I choose another relay, and anything the restored relay lost is sent again automatically.

## Edge cases

- The newest snapshot fails verification; the plan automatically selects the newest verified snapshot and states the larger data-loss window.
- A WAL segment in the middle of the chain is missing or corrupt; restore stops at the last contiguous segment and reports the exact timestamp reached, never applying later segments.
- A manifest has been relabelled or does not link into the chain; the plan and restore reject it with PLATFORM_BACKUP_MANIFEST_INVALID and use the authenticated chain only.
- The relay identity key file is not available; restore proceeds only with --new-identity, which creates a new genesis key and therefore a new relayId (or activates the pending successor named by a compromise revocation); its first restore announcement names predecessorRelayId, vaults see a different relay, the old relay's entries stay pending until users confirm the new fingerprint and reroute, and the report says so.
- The restored snapshot holds attachment rows of F08.S01.M03 whose encrypted MediaBlobs F15.S03.M02 excluded from the backup set; the restore report counts them in excludedBlobs, and the F08.S01.M03 reconciliation sweep marks those rows expired after the relay starts, so no attachment is served from a backup.
- Restored data is older than receipts the relay already issued; the signed restore announcement names lostWindow and lastReceiptSeq, vault outboxes resend the covered entries, and relay-hosted auctions with bids or a close in the lost window are frozen for renegotiation instead of contradicting bid orders or results already signed.
- An archived event occurred after the reached timestamp, or its aggregate revision is missing from the restored records; it is not re-delivered and is counted as lost.
- A push notification consumer has archived events in the replay range; it is excluded from restore re-delivery so no notification is sent twice.
- Dead-lettered event is replayed but the consumer module is disabled by flag; replay is refused with FEATURE_DISABLED and the event stays dead-lettered; a requeued event whose consumer is disabled later returns to dead_lettered.
- Replay of the same event is requested a fourth time; refused with PLATFORM_DEADLETTER_REPLAY_LIMIT and the operator must investigate.
- Restore target directory is not empty, is on the same volume as the live database, or is the live data directory itself; the tool refuses.

## UX and accessibility



Operator CLI and API: relay restore, relay restore plan, relay deadletter list, relay deadletter replay [--dry-run]. A restore report is written to <dir>/restore-report.json and printed. No end-user UI; the PWA only shows relay reachability, pending delivery states and the 'this relay restored an older backup' banner of F15.S01.M01.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: `platform.deadletter.replay`
- Queries: `platform.deadletter.list`, `platform.recovery.get_plan`
- Emits: `platform.deadletter.replayed`
- Consumes: `platform.backup.completed`, `platform.backup.failed`

## Dependencies

F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-122-01 | [Domain schema](domain_schema.md) | 3 |
| PS-122-02 | [Validation rules](validation_rules.md) | 3 |
| PS-122-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-122-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-122-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-122-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-122-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-122-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-122-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-122-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/recovery/index.ts`.

## Acceptance criteria

- All tests T01-T16 and T18-T24 pass in CI and the manual drill T17 is completed at least every 100 days.
- A restore to a new instance completes within 4 h with at most 6 h of data loss, and the report states both numbers and every lost event.
- Dead-letter replay never produces duplicate side effects, writes only dead_letter and inbox rows and is limited to 3 replays per event.
- After a restore, vault outboxes learn from a signed announcement what the relay lost, and no relay-hosted auction contradicts what it signed before.
- Recovery never reads or reconstructs vault data, and user private records remain recoverable only from the user's own export.
