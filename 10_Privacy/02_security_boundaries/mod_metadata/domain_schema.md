# PS-080-01 — Domain schema: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-01.R01** The library defines the value types CleanImage {bytes, mime, width, height, sha256}, IpNetwork, PublicTimestamp and UaFamily and owns no persistent entity.
- **PS-080-01.R02** Output images carry only pixel data and the minimal container structure required by the format, with a fixed sRGB treatment and no embedded profiles beyond sRGB.
- **PS-080-01.R03** Coarsened times and daily-salted rate-limit keys are the only time- and IP-derived forms that other modules may store or log; truncated networks exist only in memory.
- **PS-080-01.R04** CleanImage bytes are at most 5 MiB, the MediaBlob limit (N9), reached by stepping quality and then dimensions down; otherwise the call fails with PRIVACY_METADATA_IMAGE_TOO_LARGE.
- **PS-080-01.R05** Public projections carry only hour-floored timestamps and record IDs minted by publicRecordId, and ordering inside an hour uses the per-author seq of the envelope (CTR-FED-001 FED-3), never a time value.

## Specification

**Note:** Library module with no persistent entity. Value types CleanImage {bytes ≤ 5 MiB, mime: image/jpeg|image/png|image/webp, width, height, sha256, pipelineVersion}, IpNetwork {family, prefix, networkString} (memory only), PublicTimestamp {iso hour floor UTC}, UaFamily {family, major}.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T01 | unit | PS-080-01.R01, PS-080-01.R02, PS-080-02.R01 | strip each corpus image | output decodes, dimensions at most 4096, pixel content equal within quality tolerance |
| TEST-PS-080-09.T11 | integration | PS-080-01.R03, PS-080-07.R01 | upload through relay double and inspect storage and logs | only clean bytes stored; logs contain no full IP, no truncated network, no filename and no metadata values |
| TEST-PS-080-09.T20 | unit | PS-080-01.R04 | 4096 px high-detail PNG, 4096 px noisy JPEG and an image that cannot reach 5 MiB at 2048 px | outputs are at most 5 MiB through quality then dimension steps; the last fails with PRIVACY_METADATA_IMAGE_TOO_LARGE |
| TEST-PS-080-09.T21 | contract | PS-080-01.R05 | publishing double packages listings, profiles and offerings through the F11.S01.M01 packaging double; assertCoarseTime on every P0 payload and envelope | no timestamp finer than the hour and no UUIDv7 with a time finer than the hour; items within one hour are ordered by seq |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
