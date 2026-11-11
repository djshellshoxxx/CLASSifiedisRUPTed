# PS-080-10 — Import, export, backup and rollback: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-10.R01** Images exported from a vault are the clean bytes the user published or kept; the export never adds metadata.
- **PS-080-10.R02** Images imported from older exports or other vaults pass through stripImage and verifyImageClean before they are accepted into listings.
- **PS-080-10.R03** Codec or pipeline changes are versioned, and previously stored clean images are never re-processed in place.

## Specification

- **export:** No module data. Export sections of owning modules embed clean image bytes; this module guarantees they pass verifyImageClean.
- **import:** Every imported image is stripped in the browser and verified; failures are quarantined with PRIVACY_METADATA_GPS_PRESENT or PRIVACY_METADATA_IMAGE_UNSUPPORTED.
- **backup:** Library only; images are backed up with their owning records through the vault export (IOX-6).
- **migration rollback:** Pipeline version recorded in CleanImage metadata of owning modules; a rollback pins the previous library version, and the corpus test must pass on both before release.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T17 | unit | PS-080-10.R01, PS-080-10.R02, PS-080-10.R03 | export of an image record and reimport of a pre-strip legacy image | export contains clean bytes only; legacy import is re-stripped or quarantined |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
