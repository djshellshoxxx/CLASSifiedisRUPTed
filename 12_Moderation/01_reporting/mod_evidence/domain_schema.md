# PS-093-01 — Domain schema: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-01.R01** An EvidenceSnapshot stores target reference, target revision, the author's signed envelope, canonical content, SHA-256 content hash, capture reason, disclosure mode, blob references and integrity state, with tenant and revision per CTR-ID-001.
- **PS-093-01.R02** Snapshot bodies are P2 between the store owner and the moderators of the relay that received them and retained under RET-EVIDENCE; each body and copied media item lives in an encrypted evidence blob with its own key, destroyed by deleting that key once no active snapshot references the blob.
- **PS-093-01.R03** Snapshots are immutable; only the integrity flag, lifecycle and legal-hold fields change and every change is recorded in the access log.
- **PS-093-01.R04** Evidence blobs are declared in this module's store (EvidenceBlob rows with blob id, SHA-256, size, key id and reference count) and P0 media is referenced by blob:sha256 from F15.S02.M03 MediaBlob (N9) instead of being copied.

## Specification

### EvidenceSnapshot

Schema `classrup.moderation.evidencesnapshot/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault scope or relay hosting scope) |
| targetType | enum — listing \| auction \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal |
| targetId | uuidv7 — captured content identity |
| targetCid | string — content id (sha256-…) of the author's signed envelope |
| targetRevision | int — revision of the target when captured |
| authorKey | did:key — signer of the captured envelope |
| authorSignatureStatus | enum — valid \| invalid \| absent_reporter_claim |
| captureReason | enum — report \| automated_detection \| appeal_review \| legal_request |
| disclosure | enum — public_target \| metadata_only \| participant_disclosure \| reporter_claim |
| disclosureState? | enum — previewed \| export_prepared (P2 targets only) |
| redactionRulesVersion? | string — redact/1 when a disclosure preview ran |
| redactions? | object[] — { rule, count } applied by the preview |
| contentHash | string — hex SHA-256 over JCS bytes of the stored canonical object (full body, metadata object or redacted disclosure), 64 chars |
| bodyBlobId | uuidv7 — EvidenceBlob holding the encrypted canonical object, ≤ 256 KiB |
| mediaRefs | object[] — up to 10 { ref: blob:sha256-… of a P0 MediaBlob (F15.S02.M03) or evidenceBlobId of a copied P2 item, sha256, bytes ≤ 5 MiB, alt? } |
| capturedAt | timestamp — RFC 3339 UTC, the capturing store's clock (a claim for other parties) |
| integrity | enum — verified \| failed |
| lifecycle | enum — active \| purged |
| legalHold | boolean — relay-only cache of privacy.legal_hold.check for authorKey and targetCid; always false in a vault |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- contentHash equals SHA-256 of the canonical JCS bytes of the decrypted body whenever integrity is verified and lifecycle is active.
- Body and media of a snapshot never change after capture; a new capture creates a new record.
- lifecycle purged implies the snapshot holds no blob references and legalHold is false; an EvidenceBlob key is destroyed only when the blob's reference count is 0, so a snapshot under hold keeps its blob readable.
- disclosure participant_disclosure implies disclosureState export_prepared; a P2 target is never stored with disclosure public_target.

### EvidenceAccess

Schema `classrup.moderation.evidenceaccess/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| snapshotId | uuidv7 — ref EvidenceSnapshot |
| accessorId | string — local principal or relay moderator key; redacted in the content author's view |
| accessorRole | enum — local_principal \| reporter \| moderator \| operator \| subject \| system |
| action | enum — read \| verify \| export \| capture \| purge |
| purpose | enum — case_review \| appeal_review \| subject_view \| audit \| legal_request \| system |
| caseId? | uuidv7 — case or appeal context when applicable |
| occurredAt | timestamp — RFC 3339 UTC, store clock |

**Invariants**
- EvidenceAccess rows are append-only; no update or delete is exposed by any command.
- Every read, verify, export and purge of a snapshot creates exactly one EvidenceAccess row in the same transaction.

**Note:** EvidenceBlob (store-local table, not a catalog entity): id uuidv7, tenantId, sha256 of the plaintext, bytes, keyId of the per-blob key wrapped by the vault key or the relay data key (F16.S01.M02), refCount ≥ 0, createdAt. A blob is shared only between snapshots of identical bytes in the same store; P0 public media is never copied here.

### Storage DDL

```sql
CREATE TABLE moderation_evidence_snapshot (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL,
  target_cid TEXT NOT NULL, target_revision INTEGER NOT NULL, author_key TEXT NOT NULL, content_hash TEXT NOT NULL,
  disclosure TEXT NOT NULL, integrity TEXT NOT NULL, lifecycle TEXT NOT NULL, legal_hold INTEGER NOT NULL DEFAULT 0,
  captured_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX moderation_evidence_target ON moderation_evidence_snapshot(tenant_id, target_type, target_id);
CREATE INDEX moderation_evidence_author ON moderation_evidence_snapshot(tenant_id, author_key);
CREATE TABLE moderation_evidence_blob (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, key_id TEXT,
  ref_count INTEGER NOT NULL CHECK (ref_count >= 0), created_at TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_evidence_blob_hash ON moderation_evidence_blob(tenant_id, sha256);
CREATE TABLE moderation_evidence_access (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, accessor_id TEXT NOT NULL,
  accessor_role TEXT NOT NULL, action TEXT NOT NULL, purpose TEXT NOT NULL, case_id TEXT, occurred_at TEXT NOT NULL);
CREATE TRIGGER moderation_evidence_access_no_update BEFORE UPDATE ON moderation_evidence_access
  BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid, disclosure public_target |
| TEST-PS-093-09.T02 | property | PS-093-01.R03, PS-093-03.R01, PS-093-09.R02 | random content objects with key order permuted and known vectors; random sequences of verify, purge and disclosure steps | contentHash identical; mutated body fails verification; only declared transitions succeed; fields other than integrity, lifecycle and legalHold never change |
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | RetentionPurgePort run at RET-EVIDENCE end with and without a relay legal hold | privacy.legal_hold.check called per snapshot; key destroyed and blob deleted only without hold; no purge happens on a privacy.retention.purged event |
| TEST-PS-093-09.T09 | integration | PS-093-06.R01, PS-093-01.R04 | same Idempotency-Key replayed; two captures of identical content | original response replayed; one EvidenceBlob with refCount 2 and two snapshot rows |
| TEST-PS-093-09.T16 | integration | PS-093-01.R04, PS-093-03.R03, PS-093-07.R02 | two snapshots share one blob, one under relay legal hold, both past retention | unheld snapshot purged and refCount drops to 1; blob key survives; after hold release and the next run the blob key is destroyed and the blob deleted |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
