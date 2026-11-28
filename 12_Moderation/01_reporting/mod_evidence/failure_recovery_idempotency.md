# PS-093-06 — Failure recovery and idempotency: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-06.R01** Capture is idempotent per CTR-IDM-001 and reuses the stored evidence blob, incrementing its reference count, when identical bytes already exist in the store.
- **PS-093-06.R02** Capture, blob write or reference increment, access row and outbox event commit in one transaction or not at all.
- **PS-093-06.R03** Purge is two-step and crash-safe, recording the reference decrement and any key destruction before blob deletion, and the sweep resumes after a crash or tab close.

## Specification

- **idempotency:** Local Idempotency-Key required on capture; replay within 24 h returns the stored response; ingest_bundle is idempotent on (sourceRef, contentHash); verify is naturally idempotent; the RetentionPurgePort is idempotent per snapshot id.
- **concurrency:** EvidenceBlob rows are unique per (tenant_id, sha256); capture and purge of snapshots that share a blob update refCount in the same transaction as the snapshot row (IndexedDB readwrite transaction in the vault, BEGIN IMMEDIATE on the relay), so a concurrent capture can never resurrect a blob whose key is being destroyed.
- **retries:** Callers retry DEPENDENCY_UNAVAILABLE from the blob store or the media store with CTR-IDM-001 backoff; MODERATION_EVIDENCE_SOURCE_MISSING, signature and size errors are not retried.
- **offline:** Capture and disclosure previews work fully offline in the vault because they only need locally held signed envelopes; a relay copy exists only after the report statement is delivered.
- **partial failure:** If the blob write fails, the transaction aborts and the caller receives DEPENDENCY_UNAVAILABLE; no orphan snapshot rows exist; blobs with refCount 0 and no key destruction record older than 24 h are shredded by the sweep. Privacy ports (N6): ExportSectionPort, DeletionPort and RetentionPurgePort resume from their last committed snapshot id.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T09 | integration | PS-093-06.R01, PS-093-01.R04 | same Idempotency-Key replayed; two captures of identical content | original response replayed; one EvidenceBlob with refCount 2 and two snapshot rows |
| TEST-PS-093-09.T10 | chaos | PS-093-06.R02, PS-093-06.R03 | blob store fails mid-capture; tab closed between key destruction and blob deletion | no orphan row; purge resumes and completes |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
