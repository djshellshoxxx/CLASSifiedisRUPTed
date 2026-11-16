# PS-080-01 — Domain schema: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-01.R01** The library defines the value types CleanImage {bytes, mime, width, height, sha256}, IpNetwork, PublicTimestamp and UaFamily and owns no persistent entity.
- **PS-080-01.R02** Output images carry only pixel data and the minimal container structure required by the format, with a fixed sRGB treatment and no embedded profiles beyond sRGB.
- **PS-080-01.R03** Truncated IP values and coarsened times are the only forms that other modules may store or log.

## Specification

**Note:** Library module with no persistent entity. Value types CleanImage {bytes, mime: image/jpeg|image/png|image/webp, width, height, sha256}, IpNetwork {family, prefix, networkString}, PublicTimestamp {iso hour floor UTC}, UaFamily {family, major}.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T01 | unit | PS-080-01.R01, PS-080-01.R02, PS-080-02.R01 | strip each corpus image | output decodes, dimensions at most 4096, pixel content equal within quality tolerance |
| TEST-PS-080-09.T04 | unit | PS-080-01.R03, PS-080-03.R01 | IPv4, IPv6, IPv4-mapped and invalid inputs | /24 and /48 networks returned; invalid VALIDATION_FAILED; raw value never returned |
| TEST-PS-080-09.T05 | unit | PS-080-01.R03, PS-080-02.R03 | hour-boundary timestamps and invalid timestamps | floor to hour UTC; owner view unchanged; invalid VALIDATION_FAILED |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
