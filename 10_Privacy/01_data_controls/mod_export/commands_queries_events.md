# PS-078-04 — Commands, queries and events: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-04.R01** Request, cancel and open_download are vault commands (local, no signed statement to others, no relay command); the signature is a local artifact inside the bundle.
- **PS-078-04.R02** ExportSectionPort is the contract each module implements; the orchestrator calls sections in parallel at most 4 at a time.
- **PS-078-04.R03** State changes emit events into the vault outbox in the same IndexedDB transaction as the job update.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.export.request` | privacy.export.request | [vault command, local] { includeMedia?: boolean (default false) } | { jobId, status: requested, estimatedBytes, sections: string[] } | UNAUTHENTICATED, PRECONDITION_FAILED, RATE_LIMITED, PRIVACY_EXPORT_QUOTA |  | yes (Idempotency-Key) |
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
| `privacy.export.ready` | P3 | { jobId, bundleBytes, expiresAt, sectionCount } |
| `privacy.export.failed` | P3 | { jobId, errorCode, failedModule? } |
| `privacy.export.expired` | P3 | { jobId, reason: time\|deletion } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.requested` | offer the user an export before the grace period ends by showing the export prompt; no automatic export |
| `privacy.deletion.completed` | expire any ready bundle immediately and shred its key |
| `identity.device_key.revoked` | if the revoked key is the signing key of a collecting job, restart its signature step with the current key |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_EXPORT_QUOTA | 507 | no | not enough storage for the export bundle; response includes bytes needed |
| PRIVACY_EXPORT_SECTION_FAILED | 500 | yes | a module section failed validation or production after 3 attempts |
| PRIVACY_EXPORT_SIGNATURE_INVALID | 500 | no | manifest hashes or signature did not verify |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command privacy.export.request { "includeMedia": false }
=> { "jobId": "0192f3d0-…", "status": "requested", "estimatedBytes": 8420000, "sections": ["bazaar.listings", "commerce.deals", "privacy.consents", "…"] }
ready: manifest line { "format": "classrup-export/v1", "exportedAt": "2026-11-04T10:12:00.000Z", "accountId": "…", "did": "did:key:z6Mk…",
  "modules": ["F01.S01.M01", "…"], "counts": { "bazaar.listings": 42 }, "sha256": { "bazaar.listings": "…" }, "sig": "…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T06 | integration | PS-078-03.R03, PS-078-04.R03 | clock advanced 7 days and account deletion completes | bundle deleted, key shredded, privacy.export.expired emitted with the right reason |
| TEST-PS-078-09.T07 | contract | PS-078-04.R01, PS-078-04.R02, PS-078-09.R02 | execute each command and read the bundle | outputs and events validate against registry schemas; manifest matches classrup-export/v1 |
| TEST-PS-078-09.T08 | integration | PS-078-04.R03, PS-078-06.R02 | PWA closed mid-collection and reopened within 24 h | resumes from the last completed section and produces identical hashes |
| TEST-PS-078-09.T17 | unit | PS-078-04.R03 | CI check that every module owning user data registers a section | build fails for a module without a section |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
