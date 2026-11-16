# PS-080-02 — Validation rules: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-02.R01** Inputs are validated for supported types, size, dimensions and decodability before processing.
- **PS-080-02.R02** Verification flags any residual metadata marker including GPS IFD, EXIF, XMP packet, IPTC, MakerNote and text chunks.
- **PS-080-02.R03** IP and timestamp helpers validate their input formats and never return unmodified raw values.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | image mime is image/jpeg, image/png, image/webp or convertible HEIC and the file decodes | PRIVACY_METADATA_IMAGE_UNSUPPORTED |
| V02 | input size is at most 10 MiB and dimensions at most 16384 px per side before downscale | PRIVACY_METADATA_IMAGE_TOO_LARGE |
| V03 | output has no EXIF, XMP, IPTC, GPS IFD, MakerNote, text chunk or thumbnail markers | PRIVACY_METADATA_GPS_PRESENT |
| V04 | animated images are rejected in the MVP | PRIVACY_METADATA_IMAGE_UNSUPPORTED |
| V05 | IP string parses as IPv4 or IPv6 and IPv4-mapped IPv6 is normalized | VALIDATION_FAILED |
| V06 | timestamp is a valid RFC 3339 UTC value within 1970 to 2100 | VALIDATION_FAILED |
| V07 | user agent string is at most 512 characters | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T01 | unit | PS-080-01.R01, PS-080-01.R02, PS-080-02.R01 | strip each corpus image | output decodes, dimensions at most 4096, pixel content equal within quality tolerance |
| TEST-PS-080-09.T02 | unit | PS-080-02.R02, PS-080-03.R03 | scan every output with verifyImageClean and exiftool | zero metadata findings and zero GPS tags in all 40 outputs |
| TEST-PS-080-09.T03 | unit | PS-080-02.R01, PS-080-02.R03 | animated WebP, 12 MiB file, truncated file, polyglot | documented error codes or clean output with trailing bytes removed |
| TEST-PS-080-09.T05 | unit | PS-080-01.R03, PS-080-02.R03 | hour-boundary timestamps and invalid timestamps | floor to hour UTC; owner view unchanged; invalid VALIDATION_FAILED |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
