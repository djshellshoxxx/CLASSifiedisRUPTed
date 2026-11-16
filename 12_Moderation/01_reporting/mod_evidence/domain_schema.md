# PS-093-01 — Domain schema: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-01.R01** An EvidenceSnapshot stores target reference, target revision, the author's signed envelope, canonical content, SHA-256 content hash, capture reason, encryption key reference and integrity state, with tenant and revision per CTR-ID-001.
- **PS-093-01.R02** Snapshot bodies are P3 and retained under RET-EVIDENCE; each body is encrypted with a per-object key and destroyed by deleting that key at retention end.
- **PS-093-01.R03** Snapshots are immutable; only integrity and legal-hold fields change and every change is recorded in the access log.

## Specification

### EvidenceSnapshot

Schema `classrup.moderation.evidencesnapshot/v1` · storage **relay+device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault scope or relay hosting scope) |
| targetType | enum — listing \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal |
| targetId | uuidv7 — captured content identity |
| targetCid | string — content id (sha256-…) of the author's signed envelope |
| targetRevision | int — revision of the target when captured |
| authorKey | did:key — signer of the captured envelope |
| authorSignatureStatus | enum — valid \| invalid \| absent_reporter_claim |
| captureReason | enum — report \| automated_detection \| appeal_review \| legal_request |
| contentHash | string — hex SHA-256 over JCS bytes of the canonical content object, 64 chars |
| bodyRef | string — id of encrypted blob; body ≤ 256 KiB canonical JSON |
| mediaHashes | string[] — hex SHA-256 of up to 5 media items, each ≤ 2 MiB, copies kept in encrypted blobs |
| keyId | uuidv7 — per-object key id; deleting the key shreds body and media |
| capturedAt | timestamp — RFC 3339 UTC, the capturing store's clock (a claim for other parties) |
| integrity | enum — verified \| integrity_failed \| purged |
| legalHold | boolean — true while an F10.S01.M02 hold covers the owner |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- contentHash equals SHA-256 of the canonical JCS bytes of the decrypted body whenever integrity is verified.
- Body and media of a snapshot never change after capture; a new capture creates a new record.
- integrity purged implies the key is destroyed and legalHold is false.

### EvidenceAccess

Schema `classrup.moderation.evidenceaccess/v1` · storage **relay+device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| snapshotId | uuidv7 — ref EvidenceSnapshot |
| accessorId | string — local principal or relay moderator key |
| action | enum — read \| verify \| export \| capture \| purge |
| purpose | enum — case_review \| appeal_review \| subject_view \| audit \| legal_request \| system |
| caseId? | uuidv7 — case or appeal context when applicable |
| occurredAt | timestamp — RFC 3339 UTC, store clock |

**Invariants**
- EvidenceAccess rows are append-only; no update or delete is exposed by any command.
- Every read of a snapshot body creates exactly one EvidenceAccess row in the same transaction as the read.

### Storage DDL

```sql
CREATE TABLE moderation_evidence_snapshot (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL,
  target_cid TEXT NOT NULL, target_revision INTEGER NOT NULL, author_key TEXT NOT NULL, content_hash TEXT NOT NULL,
  integrity TEXT NOT NULL, legal_hold INTEGER NOT NULL DEFAULT 0, captured_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX moderation_evidence_target ON moderation_evidence_snapshot(tenant_id, target_type, target_id);
CREATE INDEX moderation_evidence_author ON moderation_evidence_snapshot(tenant_id, author_key);
CREATE TABLE moderation_evidence_access (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, accessor_id TEXT NOT NULL,
  action TEXT NOT NULL, purpose TEXT NOT NULL, case_id TEXT, occurred_at TEXT NOT NULL);
CREATE TRIGGER moderation_evidence_access_no_update BEFORE UPDATE ON moderation_evidence_access
  BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid |
| TEST-PS-093-09.T02 | property | PS-093-01.R03, PS-093-03.R01 | random content objects with key order permuted | contentHash identical; mutated body fails verification |
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | retention end with and without legal hold | key destroyed and blobs deleted only without hold |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
