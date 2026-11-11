# PS-078-01 — Domain schema: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-01.R01** An ExportJob stores status, include-media flag, per-section state and hash, totals, manifest hash, signing key ID, and expiry (readyAt plus 7 days).
- **PS-078-01.R02** The bundle itself is not a database record; it is an encrypted file in origin-private storage identified by the job ID, and the job holds its size and SHA-256.
- **PS-078-01.R03** ExportJob is P3, retained as RET-SHORT (30 days) after expiry as a record that an export happened, and never contains user content.
- **PS-078-01.R04** A multi-part export set shares a setId; each part has its own signed manifest with index, total, media date range and the hash of the part-1 manifest, so the parts are linked and each verifies alone.

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
| part? | object — {setId: uuidv7, index: 1..8, total: 1..8, mediaFrom?: date, mediaTo?: date, part1ManifestSha256?: string} |
| sections | array — up to 64 {name, moduleId, state: pending\|running\|done\|failed, count, bytes, sha256, exportedAt} |
| estimatedBytes | int — ≥ 0; refused above 2147483648 per part |
| bundleBytes? | int — encrypted bundle size on disk |
| bundleSha256? | string — sha256 of the plaintext JSON Lines stream |
| manifestSha256? | string — sha256 of the manifest line |
| signatureKeyId? | string — did:key fragment of the device key that signed |
| errorCode? | string — module error code, EXPIRED or PRIVACY_EXPORT_TIMEOUT when failed |
| downloadCount | int — ≥ 0 |
| activeMs | int — foreground collection time spent so far; paused while the PWA is closed |
| lastActivityAt | timestamp — local clock of the last collection step |
| startedAt | timestamp — local clock |
| readyAt? | timestamp — local clock |
| expiresAt? | timestamp — readyAt + 7 days |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one job in requested or collecting status per vault.
- status ready implies bundleSha256, manifestSha256 and signatureKeyId are set and the signature verified.
- expiresAt is exactly readyAt plus 7 days.
- The job record never stores user content or the bundle key.
- Parts of one setId have distinct indexes and non-overlapping media date ranges, and only part 1 carries non-media sections.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T01 | unit | PS-078-01.R01, PS-078-02.R01 | request an export with fresh and stale unlock | fresh creates job with sections; stale returns UNAUTHENTICATED |
| TEST-PS-078-09.T02 | integration | PS-078-01.R02, PS-078-03.R02 | complete an export and inspect storage | bundle is an encrypted file, job holds only hashes and sizes, no content or key |
| TEST-PS-078-09.T18 | integration | PS-078-01.R03 | ExportJob expired at day 0; retention sweep at day 29 and day 31 | record present on day 29 and purged by the RetentionPurgePort on day 31; it never held user content |
| TEST-PS-078-09.T21 | integration | PS-078-01.R04 | vault with 2.5 GiB of media; single request; then a two-part set by media date; restore double | single request PRIVACY_EXPORT_QUOTA with a suggested split; each part ≤ 2 GiB and verifies alone; parts share setId and part 2 carries the part-1 manifest hash; the restore double accepts the set only with both parts |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
