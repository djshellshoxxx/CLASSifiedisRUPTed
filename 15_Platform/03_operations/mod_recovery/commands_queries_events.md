# PS-122-04 — Commands, queries and events: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-04.R01** The module exposes relay commands for dead-letter replay and read-only queries for the recovery plan and dead letters, all operator-only; the restore itself is an offline CLI that does not use the HTTP API.
- **PS-122-04.R02** Replay emits one summary event per call and never changes event payloads or order guarantees.
- **PS-122-04.R03** The module consumes backup events to keep the latest restorable point current for the plan.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.deadletter.replay` | platform.deadletter.replay | { eventIds?: uuid[] ≤ 500, filter?: { consumer?, errorCode?, olderThanMs? }, limit ≤ 500, dryRun?: boolean } — relay command, operator only (the operator capability named platform.events.replay in CTR-EVT-001 EVT-6) | { replayId, requeued, skipped, refused: [{ eventId, code }] } | FORBIDDEN, VALIDATION_FAILED, FEATURE_DISABLED, PLATFORM_DEADLETTER_REPLAY_LIMIT, RATE_LIMITED | platform.deadletter.replayed | no |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.deadletter.list` | platform.deadletter.read | { consumer?, errorCode?, cursor?, limit ≤ 100 } — relay query, operator only; returns metadata, never payloads | { items: [{ eventId, type, consumer, errorCode, attempts, replayCount, deadLetteredAt }], nextCursor? } | FORBIDDEN |
| `platform.recovery.get_plan` | platform.recovery.read_plan | { at?: timestamp } — relay query, operator only | { baseBackupId, walSegments, archiveSegments, reachableTimestamp, dataLossWindowMs, rtoEstimateMs, warnings[] } | FORBIDDEN, PLATFORM_RECOVERY_TARGET_INVALID, PLATFORM_RECOVERY_WAL_GAP |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.deadletter.replayed` | P1 | { replayId, requeued, skipped, refused, operatorActorId, replayedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `platform.backup.completed` | update the newest verified restore point used by the recovery plan and reset the restore-readiness alert |
| `platform.backup.failed` | mark the restore point stale and widen the reported data-loss window in the plan |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_RECOVERY_TARGET_INVALID | 422 | no | restore target is not empty, is on the live volume, or the requested time is out of range |
| PLATFORM_RECOVERY_WAL_GAP | 409 | no | WAL segment chain has a gap; restore stops at the last contiguous segment |
| PLATFORM_RECOVERY_SNAPSHOT_UNVERIFIED | 422 | no | base snapshot is not verified or its checksum does not match |
| PLATFORM_RECOVERY_KEY_MISMATCH | 422 | no | backup key fingerprint does not match or decryption fails |
| PLATFORM_RECOVERY_IDENTITY_MISSING | 422 | no | relay identity key file missing and --new-identity not given |
| PLATFORM_DEADLETTER_REPLAY_LIMIT | 409 | no | event already replayed 3 times or selection exceeds 500 events |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
$ relay restore plan --at latest
{ "baseBackupId": "0192f500-…", "walSegments": 71, "reachableTimestamp": "2026-11-04T06:12:00Z", "dataLossWindowMs": 292000, "rtoEstimateMs": 5400000 }
$ relay restore --to /srv/relay-new --at latest
... fetching, verifying, applying, replaying, ready  (restore-report.json written)
POST /api/v1/cmd/platform.deadletter.replay { "filter": { "consumer": "relay.index" }, "limit": 100 }
200 { "replayId": "0192f700-…", "requeued": 98, "skipped": 0, "refused": [ { "eventId": "0192f6aa-…", "code": "PLATFORM_DEADLETTER_REPLAY_LIMIT" } ] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T05 | contract | PS-122-04.R01, PS-122-04.R02 | replay, list and plan calls | outputs and the platform.deadletter.replayed payload validate against registry schemas; list omits payloads |
| TEST-PS-122-09.T06 | integration | PS-122-04.R03, PS-122-01.R02 | publish backup.failed and backup.completed events | plan marks restore point stale then fresh and widens or narrows the data-loss window accordingly |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
