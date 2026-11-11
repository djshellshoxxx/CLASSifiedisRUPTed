# PS-093-04 — Commands, queries and events: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-04.R01** Capture and verify are vault or relay local commands that produce no signed statement; snapshots travel inside signed report or case bundles only.
- **PS-093-04.R02** Capture emits moderation.evidence.captured in the same transaction as the snapshot and its access row.
- **PS-093-04.R03** The module re-checks legal holds through privacy.legal_hold.check when hold events arrive and before every purge, consumes privacy.deletion.completed, and is purged only through the RetentionPurgePort it registers with F10.S01.M02, never by a purge-completed event.
- **PS-093-04.R04** Relay intake of a report or appeal bundle stores the evidence it carries as relay snapshots after re-verifying hashes and author signatures, and resolves referenced P0 media by blob:sha256.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.evidence.capture` | moderation.evidence.capture | { targetType, targetId, targetRevision?, captureReason, caseId?, reporterClaim?: boolean } | { snapshotId, contentHash, authorSignatureStatus, disclosure, capturedAt, revision: 1 } | VALIDATION_FAILED, MODERATION_EVIDENCE_SOURCE_MISSING, MODERATION_EVIDENCE_SIGNATURE_INVALID, PAYLOAD_TOO_LARGE, FORBIDDEN | moderation.evidence.captured | yes (Idempotency-Key) |
| `moderation.evidence.ingest_bundle` | moderation.evidence.ingest_bundle | { sourceRef: reportId \| appealId, snapshot: { canonicalObject, authorEnvelope, disclosure, mediaRefs[] } } | { snapshotId, contentHash, integrity, missingMedia[] } | VALIDATION_FAILED, MODERATION_EVIDENCE_SIGNATURE_INVALID, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE | moderation.evidence.captured | yes (Idempotency-Key) |
| `moderation.evidence.verify` | moderation.evidence.verify | { snapshotId } | { snapshotId, integrity, recomputedHash, authorSignatureStatus } | NOT_FOUND, EXPIRED |  | yes (Idempotency-Key) |
| `moderation.evidence.prepare_disclosure` | moderation.evidence.disclose | { snapshotId, manualRedactions?: string[] } | { snapshotId, previewDigest, redactedObject, redactions: { rule, count }[], rulesVersion: redact/1 } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `moderation.evidence.approve_disclosure` | moderation.evidence.disclose | { snapshotId, previewDigest } | { snapshotId, disclosure: participant_disclosure, contentHash } | NOT_FOUND, CONFLICT_STATE, PRECONDITION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.evidence.read` | moderation.evidence.read_as_reviewer | { snapshotId, caseId } | { snapshot: { id, targetType, targetId, targetRevision, content, mediaRefs[], contentHash, authorSignatureStatus, disclosure, capturedAt, integrity } } | NOT_FOUND, FORBIDDEN, EXPIRED |
| `moderation.evidence.read_own` | moderation.evidence.read_as_subject | { snapshotId, appealId } | { snapshot: same as read, reporter data omitted } | NOT_FOUND, EXPIRED |
| `moderation.evidence.list_access` | moderation.evidence.read_access_log | { snapshotId, cursor?, limit ≤ 100 } | { items: EvidenceAccess[] for operators and the store owner; for the content author only { purpose, accessorRole, occurredAt } with accessorId redacted and rows of accessorRole reporter excluded, nextCursor? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.evidence.captured` | P2 | { snapshotId, targetType, targetId, targetCid, targetRevision, contentHash, captureReason, disclosure } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.legal_hold.placed` | relay only: the payload names no subject, so call privacy.legal_hold.check for authorKey (kind author) and targetCid (kind record) of active snapshots and set legalHold on the held ones; purge re-checks regardless of the flag |
| `privacy.legal_hold.released` | relay only: re-check privacy.legal_hold.check for snapshots with legalHold true and clear the flag where no hold remains, so the next RetentionPurgePort run may purge them |
| `privacy.deletion.completed` | vault: purge snapshots and blobs captured by the deleted principal unless the request kept evidence, in which case accessorId and the capturing principal are replaced by the payload pseudonym; authorKey of other people's content is unchanged |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_EVIDENCE_SOURCE_MISSING | 409 | no | the store does not hold the target envelope or the requested revision |
| MODERATION_EVIDENCE_SIGNATURE_INVALID | 422 | no | author signature over the captured envelope does not verify |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** No signed statements are produced here (N2); snapshots travel inside classrup.moderation.report/v1 (F12.S01.M01) and classrup.moderation.appeal/v1 (F12.S01.M03) bodies sealed to the relay moderation key. Media follow N9: P0 media are referenced by blob:sha256 of F15.S02.M03 MediaBlob, P2 media are copied into encrypted evidence blobs and sent as sealed attachments referenced by sha256. Privacy ports (N6): ExportSectionPort (section moderation.evidence), DeletionPort (purge or pseudonymize as above) and RetentionPurgePort (RET-EVIDENCE, hold re-check per snapshot) are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault command moderation.evidence.capture (local, Idempotency-Key 0192f3b0-0000-7000-8000-000000000b01)
{ "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "targetRevision": 3, "captureReason": "report" }
-> { "snapshotId": "0192f3b0-2222-7000-8000-000000000002", "contentHash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "authorSignatureStatus": "valid", "disclosure": "public_target", "capturedAt": "2026-11-04T10:00:00.120Z", "revision": 1 }
vault command moderation.evidence.prepare_disclosure { "snapshotId": "0192f3b0-2223-7000-8000-000000000003" }
-> { "previewDigest": "7a51…", "redactions": [ { "rule": "phone", "count": 1 }, { "rule": "geohash_gt5", "count": 1 } ], "rulesVersion": "redact/1" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | RetentionPurgePort run at RET-EVIDENCE end with and without a relay legal hold | privacy.legal_hold.check called per snapshot; key destroyed and blob deleted only without hold; no purge happens on a privacy.retention.purged event |
| TEST-PS-093-09.T06 | contract | PS-093-04.R01, PS-093-04.R02 | each command and query | outputs and captured event validate against registry schemas; capture produces no statement |
| TEST-PS-093-09.T17 | integration | PS-093-02.R02, PS-093-04.R04 | report listing L with 10 photos of 5 MiB and a message with 2 P2 photos; relay ingests both bundles | listing reportable with 10 blob:sha256 references and no copies; P2 photos copied into evidence blobs; relay re-verifies hashes and resolves P0 media by reference |
| TEST-PS-093-09.T21 | integration | PS-093-04.R03 | privacy.legal_hold.placed then released on a relay | snapshots of the held author flagged after privacy.legal_hold.check; flag cleared on release; purge only afterwards |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
