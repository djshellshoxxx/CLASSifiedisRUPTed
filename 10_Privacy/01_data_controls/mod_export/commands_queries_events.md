# PS-078-04 — Commands, queries and events: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-04.R01** Request, cancel and open_download are vault commands (local, no signed statement to others, no relay command); the signature is a local artifact inside the bundle.
- **PS-078-04.R02** ExportSectionPort is the contract each module implements; the orchestrator calls sections in parallel at most 4 at a time.
- **PS-078-04.R03** State changes emit events into the vault outbox in the same IndexedDB transaction as the job update.
- **PS-078-04.R04** ExportSectionPort is defined in the note with typed methods, error semantics and a CI conformance check, and DeletionPort and RetentionPurgePort are implemented for ExportJob and bundles.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.export.request` | privacy.export.request | [vault command, local] { includeMedia?: boolean (default false), mediaFrom?: date, mediaTo?: date, part?: {index, total, setId} } | { jobId, status: requested, estimatedBytes, sections: string[], part? } | UNAUTHENTICATED, PRECONDITION_FAILED, RATE_LIMITED, PRIVACY_EXPORT_QUOTA, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `privacy.export.cancel` | privacy.export.cancel | [vault command, local] { jobId, expectedRevision } | { jobId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `privacy.export.open_download` | privacy.export.download | [vault command, local] { jobId } | { jobId, fileName, sizeBytes, expiresAt, handle (in-app file handle), signatureFingerprint } | NOT_FOUND, EXPIRED, UNAUTHENTICATED, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.export.get` | privacy.export.read | { jobId } | { job: ExportJob } | NOT_FOUND |
| `privacy.export.list_mine` | privacy.export.read | { cursor?, limit ≤ 20 } | { items: ExportJob[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.export.ready` | P3 | { jobId, bundleBytes, expiresAt, sectionCount, part? } |
| `privacy.export.failed` | P3 | { jobId, errorCode, failedModule? } |
| `privacy.export.expired` | P3 | { jobId, reason: time\|deletion } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.requested` | offer the user an export before the grace period ends by showing the export prompt; a reversible UI action, no automatic export |
| `privacy.deletion.completed` | notification only - confirm that the shred step left no bundle file in origin-private storage and delete any leftover ciphertext; never signs or pseudonymizes |
| `identity.device_key.revoked` | if the revoked key is the signing key of a collecting job, restart its signature step with the current key |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_EXPORT_QUOTA | 507 | no | not enough storage for the export bundle or the bundle would exceed 2 GiB; response includes bytes needed and a suggested part split |
| PRIVACY_EXPORT_SECTION_FAILED | 500 | yes | a module section failed validation or production after 3 attempts |
| PRIVACY_EXPORT_SIGNATURE_INVALID | 500 | no | manifest hashes or signature did not verify |
| PRIVACY_EXPORT_TIMEOUT | 504 | yes | the job exceeded 30 minutes of active collection time |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** ExportSectionPort (N6; defined here, implemented by every module that owns user data and registered at vault composition): section() -> {name (for example bazaar.listings), moduleId, schemas: string[] (every schema the section may emit, each with a F10.S02.M02 classification map), media: boolean}; count(snapshot) -> int; async* lines(snapshot, ctx{includeMedia, mediaFrom?, mediaTo?, ownerDid}) -> AsyncIterable<{schema, record}>, read from one read-only IndexedDB transaction per section whose time becomes sectionExportedAt in the manifest. The orchestrator passes each record through redactForExport(record, schema, ctx) before writing it, runs at most 4 sections at a time, and treats a thrown error, a Result error or a 5-minute stall as one failed attempt (3 attempts with 1 s, 5 s, 30 s backoff, then PRIVACY_EXPORT_SECTION_FAILED naming the module); DEPENDENCY_UNAVAILABLE is retried within the attempts, and a line whose schema is not in schemas fails the section (V05). CI conformance check - every module whose catalog entry owns user-data entities registers exactly one section whose schemas cover the schemas of its owned entities, and a contract test streams the module's fixtures through lines() twice with identical bytes. This module's own section privacy.exports exports ExportJob metadata. DeletionPort (wired directly by F10.S01.M04, which depends on this module) plan {willDelete: export bundles and ExportJob rows, willPseudonymize: none, blockers: none} and step shred (delete every bundle file and its key) before the destroy_keys step. RetentionPurgePort (F10.S01.M02) kind privacy.export_job, class RET-SHORT, anchorField expiresAt (or the failed or cancelled time).

### Example

```
vault command privacy.export.request { "includeMedia": false }
=> { "jobId": "0192f3d0-…", "status": "requested", "estimatedBytes": 8420000, "sections": ["bazaar.listings", "commerce.deals", "privacy.consents", "…"] }
ready: manifest line { "format": "classrup-export/v1", "exportedAt": "2026-11-04T10:12:00.000Z", "accountId": "…", "did": "did:key:z6Mk…",
  "modules": ["F01.S01.M01", "…"], "counts": { "bazaar.listings": 42 }, "sha256": { "bazaar.listings": "…" },
  "sectionExportedAt": { "bazaar.listings": "2026-11-04T10:10:41.512Z" }, "sig": "…" }
multi-part: privacy.export.request { "includeMedia": true, "mediaFrom": "2025-01-01", "mediaTo": "2025-12-31", "part": { "index": 2, "total": 2, "setId": "0192f3d1-…" } }
second request with a new command ID while collecting => PRECONDITION_FAILED { "params": { "activeJobId": "0192f3d0-…" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T04 | integration | PS-078-02.R02, PS-078-03.R01, PS-078-04.R02 | 10 module sections, one of which throws after 3 attempts | at most 4 sections run at the same time; job failed naming the module; no partial bundle; PRIVACY_EXPORT_SECTION_FAILED |
| TEST-PS-078-09.T07 | contract | PS-078-04.R01, PS-078-04.R02, PS-078-09.R02 | execute each command and read the bundle | outputs and events validate against registry schemas; manifest matches classrup-export/v1 including sectionExportedAt |
| TEST-PS-078-09.T17 | unit | PS-078-04.R02, PS-078-04.R04 | CI conformance check over the module registry with a module lacking a section, a section whose schemas miss an owned entity, and a section whose lines differ between two runs | build fails in each case and passes for conforming modules |
| TEST-PS-078-09.T19 | chaos | PS-078-04.R03 | abort the IndexedDB transaction that moves a job to ready | neither the job update nor privacy.export.ready is visible afterwards; retry produces both once |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
