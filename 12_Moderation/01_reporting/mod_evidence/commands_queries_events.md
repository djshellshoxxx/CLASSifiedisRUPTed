# PS-093-04 — Commands, queries and events: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-04.R01** Capture and verify are vault or relay local commands that produce no signed statement; snapshots travel inside signed report or case bundles only.
- **PS-093-04.R02** Capture emits moderation.evidence.captured in the same transaction as the snapshot and its access row.
- **PS-093-04.R03** The module consumes legal hold and retention events to protect or destroy snapshots.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.evidence.capture` | moderation.evidence.capture | { targetType, targetId, targetRevision?, captureReason, caseId?, reporterClaim?: boolean } | { snapshotId, contentHash, authorSignatureStatus, capturedAt, revision: 1 } | VALIDATION_FAILED, MODERATION_EVIDENCE_SOURCE_MISSING, MODERATION_EVIDENCE_SIGNATURE_INVALID, PAYLOAD_TOO_LARGE, FORBIDDEN | moderation.evidence.captured | yes (Idempotency-Key) |
| `moderation.evidence.verify` | moderation.evidence.verify | { snapshotId } | { snapshotId, integrity, recomputedHash, authorSignatureStatus } | NOT_FOUND, EXPIRED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.evidence.read` | moderation.evidence.read_as_reviewer | { snapshotId, caseId } | { snapshot: { id, targetType, targetId, targetRevision, content, mediaRefs[], contentHash, authorSignatureStatus, capturedAt, integrity } } | NOT_FOUND, FORBIDDEN, EXPIRED |
| `moderation.evidence.read_own` | moderation.evidence.read_as_subject | { snapshotId, appealId } | { snapshot: same as read, reporter data omitted } | NOT_FOUND, EXPIRED |
| `moderation.evidence.list_access` | moderation.evidence.read_access_log | { snapshotId, cursor?, limit ≤ 100 } | { items: EvidenceAccess[], nextCursor? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.evidence.captured` | P3 | { snapshotId, targetType, targetId, targetCid, targetRevision, contentHash, captureReason } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.legal_hold.placed` | set legalHold=true on snapshots of the held author and skip them in purge sweeps |
| `privacy.legal_hold.released` | set legalHold=false so the next retention sweep may purge expired snapshots |
| `privacy.retention.purged` | purge snapshots whose RET-EVIDENCE period ended for the purged scope, destroying their keys |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_EVIDENCE_SOURCE_MISSING | 409 | no | the store does not hold the target envelope or the requested revision |
| MODERATION_EVIDENCE_SIGNATURE_INVALID | 422 | no | author signature over the captured envelope does not verify |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command moderation.evidence.capture (local, Idempotency-Key 0192f3b0-0000-7000-8000-000000000b01)
{ "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "targetRevision": 3, "captureReason": "report" }
-> { "snapshotId": "0192f3b0-2222-7000-8000-000000000002", "contentHash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "authorSignatureStatus": "valid", "capturedAt": "2026-11-04T10:00:00.120Z", "revision": 1 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | retention end with and without legal hold | key destroyed and blobs deleted only without hold |
| TEST-PS-093-09.T06 | contract | PS-093-04.R01, PS-093-04.R02, PS-093-09.R02 | each command and query | outputs and captured event validate against registry schemas; no statement is produced by capture |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
