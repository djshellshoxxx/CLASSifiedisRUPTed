# PS-078-04 — Commands, queries and events: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-04.R01** Request, cancel and open_download are vault commands (local, no signed statement to others, no relay command); the signature is a local artifact inside the bundle.
- **PS-078-04.R02** ExportSectionPort is the contract each module implements; the orchestrator calls sections in parallel at most 4 at a time.
- **PS-078-04.R03** State changes emit events into the vault outbox in the same IndexedDB transaction as the job update.
- **PS-078-04.R04** ExportSectionPort is defined in the note with typed methods, error semantics and a CI conformance check, and DeletionPort and RetentionPurgePort are implemented for ExportJob and bundles.
- **PS-078-04.R05** Export sections are discovered through the kernel port registry at vault composition, by inverted registration for modules that cannot list this module in depends_on, a section name registered by two modules fails composition, and the registrants include identity.account and identity.device_keys (F07.S01.M01), platform.outbox (F15.S01.M01), platform.local_settings (F15.S04.M03) and the federation sections federation.records and federation.tombstones (F11.S01.M02), federation.routes (F11.S02.M01), federation.conflicts (F11.S02.M03), federation.peers (F11.S03.M01), federation.block_rules (F11.S03.M02) and federation.migrations (F11.S03.M03).
- **PS-078-04.R06** The governance sections are registered from the vault composition root by inverted registration, because F18.S01.M01 and F18.S02.M01 sit on the path F10.S01.M02 -> F18.S01.M01 -> F18.S02.M01 and cannot list this module in depends_on - governance.policy_comments, governance.trusted_publishers and governance.pending_statements, with governance.policy_proposals, from F18.S02.M01, and governance.profile_selection (including the age declaration, P3 for the owner only), with governance.jurisdiction_profiles, from F18.S01.M01.

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

**Note:** ExportSectionPort (N6; defined here, implemented by every module that owns user data and registered at vault composition in the kernel port registry, by inverted registration for modules that cannot list this module in depends_on): section() -> {name (for example bazaar.listings), moduleId, schemas: string[] (every schema the section may emit, each with a F10.S02.M02 classification map), media: boolean}; count(snapshot) -> int; async* lines(snapshot, ctx{includeMedia, mediaFrom?, mediaTo?, ownerDid}) -> AsyncIterable<{schema, record}>, read from one read-only IndexedDB transaction per section whose time becomes sectionExportedAt in the manifest. The orchestrator passes each record through redactForExport(record, schema, ctx) before writing it, runs at most 4 sections at a time, and treats a thrown error, a Result error or a 5-minute stall as one failed attempt (3 attempts with 1 s, 5 s, 30 s backoff, then PRIVACY_EXPORT_SECTION_FAILED naming the module); DEPENDENCY_UNAVAILABLE is retried within the attempts, and a line whose schema is not in schemas fails the section (V05). CI conformance check - every module whose catalog entry owns user-data entities registers at least one section, each section name starts with the module's feature slug and is registered by exactly one module, the schemas of a module's sections together cover the schemas of its owned entities, and a contract test streams the module's fixtures through lines() twice with identical bytes. Known registrants without a depends_on edge to this module - F07.S01.M01 (identity.account, identity.device_keys), F15.S01.M01 (platform.outbox), F15.S04.M03 (platform.local_settings), F18.S01.M01 (governance.jurisdiction_profiles, governance.profile_selection) and F18.S02.M01 (governance.policy_proposals, governance.policy_comments, governance.trusted_publishers, governance.pending_statements), the two governance modules registering from the vault composition root because F10.S01.M02 depends on F18.S01.M01, which depends on F18.S02.M01; the F11 modules register federation.records, federation.tombstones, federation.routes, federation.conflicts, federation.peers, federation.block_rules and federation.migrations through the same registry. This module's own section privacy.exports exports ExportJob metadata. DeletionPort (wired directly by F10.S01.M04, which depends on this module) plan {willDelete: export bundles and ExportJob rows, willPseudonymize: none, blockers: none} and step shred (delete every bundle file and its key) before the destroy_keys step. RetentionPurgePort (F10.S01.M02) kind privacy.export_job, class RET-SHORT, anchorField expiresAt (or the failed or cancelled time).

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
| TEST-PS-078-09.T17 | unit | PS-078-04.R02, PS-078-04.R04 | CI conformance check over the module registry with a module lacking a section, a section whose schemas miss an owned entity, a section whose lines differ between two runs, a section name without the module's slug, and a module with two sections whose schemas together cover its entities | build fails in the first four cases and passes for the two-section module and other conforming modules |
| TEST-PS-078-09.T19 | chaos | PS-078-04.R03 | abort the IndexedDB transaction that moves a job to ready | neither the job update nor privacy.export.ready is visible afterwards; retry produces both once |
| TEST-PS-078-09.T23 | integration | PS-078-04.R05 | vault composition with the kernel port registry and stub registrants for F07.S01.M01, F15.S01.M01, F15.S04.M03 and the seven F11 sections, then a second registrant for federation.records, then F15.S01.M01 missing | the manifest lists identity.account, identity.device_keys, platform.outbox, platform.local_settings and every federation section with counts and hashes, and none of these modules needs a depends_on edge; the duplicate fails composition naming both modules; the missing registrant fails the job with PRIVACY_EXPORT_SECTION_FAILED naming F15.S01.M01 |
| TEST-PS-078-09.T24 | integration | PS-078-04.R06, PS-078-04.R05 | vault composition with stub registrants for F18.S02.M01 (policy proposals, policy comments, trusted publishers, pending statements) and F18.S01.M01 (jurisdiction profiles, a profile selection with declaredAgeAtLeast 18), then a second registrant for governance.policy_comments | the manifest lists all six governance sections with counts and hashes, the selection line keeps the age declaration in the owner's bundle after redactForExport, neither module has a depends_on edge to this module and the depends_on graph stays acyclic; the duplicate fails composition naming both modules |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
