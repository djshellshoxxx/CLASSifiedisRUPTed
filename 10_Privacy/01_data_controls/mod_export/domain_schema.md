# PS-078-01 — Domain schema: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-01.R01** An ExportJob stores status, include-media flag, per-section state and hash, totals, manifest hash, signing key ID, and expiry (readyAt plus 7 days).
- **PS-078-01.R02** The bundle itself is not a database record; it is an encrypted file in origin-private storage identified by the job ID, and the job holds its size and SHA-256.
- **PS-078-01.R03** ExportJob is P3, retained as RET-SHORT (30 days) after expiry as a record that an export happened, and never contains user content.

## Specification

### ExportJob

Schema `classrup.privacy.export_job/v1` · storage **device** · privacy **P3** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| did | did — principal exported |
| status | enum — requested \| collecting \| ready \| failed \| expired \| cancelled |
| includeMedia | boolean — default false |
| sections | array — up to 64 {name, moduleId, state: pending\|running\|done\|failed, count, bytes, sha256} |
| estimatedBytes | int — ≥ 0; refused above 2147483648 |
| bundleBytes? | int — encrypted bundle size on disk |
| bundleSha256? | string — sha256 of the plaintext JSON Lines stream |
| manifestSha256? | string — sha256 of the manifest line |
| signatureKeyId? | string — did:key fragment of the device key that signed |
| errorCode? | string — module error code when failed |
| downloadCount | int — ≥ 0 |
| startedAt | timestamp — local clock |
| readyAt? | timestamp — local clock |
| expiresAt? | timestamp — readyAt + 7 days |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one job in requested or collecting status per vault.
- status ready implies bundleSha256, manifestSha256 and signatureKeyId are set and the signature verified.
- expiresAt is exactly readyAt plus 7 days.
- The job record never stores user content or the bundle key.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T01 | unit | PS-078-01.R01, PS-078-01.R03, PS-078-02.R01 | request an export with fresh and stale unlock | fresh creates job with sections; stale returns UNAUTHENTICATED |
| TEST-PS-078-09.T02 | integration | PS-078-01.R02, PS-078-03.R02 | complete an export and inspect storage | bundle is an encrypted file, job holds only hashes and sizes, no content or key |
| TEST-PS-078-09.T16 | e2e | PS-078-01.R03, PS-078-10.R01, PS-078-10.R02, PS-078-10.R03 | export, import into a fresh vault via IOX-2 dry-run and commit, roll back one release | all sections round-trip with identical counts; v1 bundle readable by the previous release; axe zero serious issues on export screens |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
