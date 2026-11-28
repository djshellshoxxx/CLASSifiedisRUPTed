# PS-122-04 — Commands, queries and events: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-04.R01** The module exposes relay commands for dead-letter replay and read-only queries for the recovery plan and dead letters, all for relay_operator or admin; the restore itself is an offline CLI that does not use the HTTP API.
- **PS-122-04.R02** Replay emits one summary event per call and never changes event payloads or order guarantees.
- **PS-122-04.R03** The module consumes backup events only to refresh the restore-readiness alert; the recovery plan is computed from BackupRecords and authenticated manifests, including WAL segments, which emit no event.
- **PS-122-04.R04** The restore announcement classrup.platform.relay_restore/v1 is a statement signed by the relay key under context classrup-relay-restore:v1 with signer role relay_identity, registered with F11.S01.M01 (N2), served unchanged by F15.S02.M01 and verified by F15.S01.M01 (V16).
- **PS-122-04.R05** For a new identity (relay identity init --new-identity of F15.S02.M01, or relay restore --new-identity) the NewIdentityHook signs the first restore announcement with the new genesis key, naming predecessorRelayId, with epoch 0, lastReceiptSeq 0, restoredTo the newest data the instance holds (announcedAt when it starts empty) and lostWindow from the predecessor's revokedAt (or restoredTo) to announcedAt; vaults apply it only to the new relayId and reroute to it only after the user confirms the new fingerprint.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.deadletter.replay` | platform.deadletter.replay | { eventIds?: uuid[] ≤ 500, filter?: { consumer?, errorCode?, olderThanMs? }, limit ≤ 500, dryRun?: boolean } — relay command, relay_operator or admin (the operator capability platform.deadletter.replay of CTR-EVT-001 EVT-6) | { replayId, requeued, skipped, refused: [{ eventId, code }] } | FORBIDDEN, VALIDATION_FAILED, FEATURE_DISABLED, PLATFORM_DEADLETTER_REPLAY_LIMIT, RATE_LIMITED | platform.deadletter.replayed | no |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.deadletter.list` | platform.deadletter.read | { consumer?, errorCode?, cursor?, limit ≤ 100 } — relay query, relay_operator or admin; returns metadata, never payloads | { items: [{ eventId, type, consumer, errorCode, attempts, replayCount, lastReplayedAt?, deadLetteredAt }], nextCursor? } | FORBIDDEN |
| `platform.recovery.get_plan` | platform.recovery.read_plan | { at?: timestamp } — relay query, relay_operator or admin; reads BackupRecords and authenticated manifests | { baseBackupId, baseConsistentAt, walSegments, archiveSegments, ledgerBackupId, reachableTimestamp, dataLossWindowMs, rtoEstimateMs, warnings[] } | FORBIDDEN, PLATFORM_RECOVERY_TARGET_INVALID, PLATFORM_RECOVERY_WAL_GAP, PLATFORM_RECOVERY_LEDGER_MISSING, PLATFORM_BACKUP_MANIFEST_INVALID |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.deadletter.replayed` | P1 | { replayId, requeued, skipped, refused, operatorActorId, replayedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `platform.backup.completed` | refresh the restore-readiness alert from consistentAt and walPosition; the plan itself re-reads BackupRecords |
| `platform.backup.failed` | mark the restore point stale in the readiness alert and widen the reported data-loss window until the plan re-reads BackupRecords |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_RECOVERY_TARGET_INVALID | 422 | no | restore target is not empty, is on the live volume or is the live data directory, or the requested time is out of range |
| PLATFORM_RECOVERY_WAL_GAP | 409 | no | WAL segment chain has a gap; restore stops at the last contiguous segment |
| PLATFORM_RECOVERY_SNAPSHOT_UNVERIFIED | 422 | no | base snapshot is not verified or its checksum does not match |
| PLATFORM_RECOVERY_KEY_MISMATCH | 422 | no | backup key fingerprint does not match or decryption fails |
| PLATFORM_RECOVERY_LEDGER_MISSING | 422 | no | no authenticated tombstone ledger covers the restore, so deleted public content could be resurrected |
| PLATFORM_DEADLETTER_REPLAY_LIMIT | 409 | no | event already replayed 3 times or selection exceeds 500 events |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
$ relay restore plan --at latest
{ "baseBackupId": "0192f500-…", "baseConsistentAt": "2026-11-04T06:17:40.910Z", "walSegments": 71, "ledgerBackupId": "0192f5ff-…",
  "reachableTimestamp": "2026-11-04T12:12:00Z", "dataLossWindowMs": 292000, "rtoEstimateMs": 5400000 }
$ relay restore --to /srv/relay-new --at latest
... fetching, verifying, applying, replaying (ledger 412 tombstones, 1 830 events re-delivered, 37 lost, push excluded), ready
restore announcement { "relayId": "relay:7k3m...", "keyId": "relay:7k3m...#k2", "restoredTo": "2026-11-04T12:12:00Z",
  "lostWindow": { "from": "2026-11-04T12:12:00Z", "to": "2026-11-04T12:16:52Z" }, "lastReceiptSeq": 88000, "epoch": 1 }
$ relay identity init --new-identity   (after relay identity revoke --reason compromised named successorRelayId relay:q4n8...)
NewIdentityHook -> { "relayId": "relay:q4n8...", "keyId": "relay:q4n8...#k1", "predecessorRelayId": "relay:7k3m...", "epoch": 0, "lastReceiptSeq": 0,
  "restoredTo": "2026-11-04T13:00:00Z", "lostWindow": { "from": "2026-11-04T12:40:00Z", "to": "2026-11-04T13:00:00Z" } }
POST /api/v1/cmd/platform.deadletter.replay { "filter": { "consumer": "relay.index" }, "limit": 100 }
200 { "replayId": "0192f700-…", "requeued": 98, "skipped": 0, "refused": [ { "eventId": "0192f6aa-…", "code": "PLATFORM_DEADLETTER_REPLAY_LIMIT" } ] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T05 | contract | PS-122-04.R01, PS-122-04.R02 | replay, list and plan calls | outputs and the platform.deadletter.replayed payload validate against registry schemas; list omits payloads and shows replayCount |
| TEST-PS-122-09.T06 | integration | PS-122-04.R03 | publish backup.failed and backup.completed events, then add a WAL segment without an event | readiness alert marks the restore point stale then fresh; the plan includes the new segment because it reads BackupRecords |
| TEST-PS-122-09.T21 | integration | PS-122-03.R05, PS-122-04.R04, PS-122-06.R04 | restore with receipts issued after the restored point and an auction bid in the lost window | signed restore announcement served in the well-known document with lostWindow, lastReceiptSeq and epoch 1; the stub outbox returns covered entries to prepared and resends them once; the auction is frozen through AuctionHostPort |
| TEST-PS-122-09.T24 | integration | PS-122-04.R05, PS-122-03.R05 | relay identity init --new-identity after a compromise revocation, with an empty database; then relay restore --new-identity of the fixture set | each new identity's first announcement is signed by its genesis key under classrup-relay-restore:v1, names predecessorRelayId, has epoch 0 and lastReceiptSeq 0 and is served in the well-known document before readyz 200; a stub vault applies it only to the new relayId; the report records predecessorRelayId and excludedBlobs |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
