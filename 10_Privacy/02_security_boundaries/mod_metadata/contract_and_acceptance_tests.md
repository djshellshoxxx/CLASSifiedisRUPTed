# PS-080-09 — Contract and acceptance tests: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-09.R01** Every requirement is covered by at least one automated test.
- **PS-080-09.R02** A corpus of 40 images with GPS, EXIF, XMP, IPTC, MakerNote, thumbnails and polyglots is processed and scanned by an independent parser (exiftool) in CI.
- **PS-080-09.R03** IP and time helpers are tested with exhaustive edge vectors including IPv6 forms and hour boundaries.

## Specification

See the module test table below (all processes).

**Fixtures:** Image corpus corpus/privacy-images (40 files), IPv4 and IPv6 vectors (60), timestamp vectors (30), user-agent vectors (25).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T01 | unit | PS-080-01.R01, PS-080-01.R02, PS-080-02.R01 | strip each corpus image | output decodes, dimensions at most 4096, pixel content equal within quality tolerance |
| TEST-PS-080-09.T02 | unit | PS-080-02.R02, PS-080-03.R03 | scan every output with verifyImageClean and exiftool | zero metadata findings and zero GPS tags in all 40 outputs |
| TEST-PS-080-09.T03 | unit | PS-080-02.R01, PS-080-02.R03 | animated WebP, 12 MiB file, truncated file, polyglot | documented error codes or clean output with trailing bytes removed |
| TEST-PS-080-09.T04 | unit | PS-080-01.R03, PS-080-03.R01 | IPv4, IPv6, IPv4-mapped and invalid inputs | /24 and /48 networks returned; invalid VALIDATION_FAILED; raw value never returned |
| TEST-PS-080-09.T05 | unit | PS-080-01.R03, PS-080-02.R03 | hour-boundary timestamps and invalid timestamps | floor to hour UTC; owner view unchanged; invalid VALIDATION_FAILED |
| TEST-PS-080-09.T06 | property | PS-080-03.R01, PS-080-03.R03, PS-080-06.R01 | random inputs through each helper twice | deterministic and idempotent; no partial output on forced failure |
| TEST-PS-080-09.T07 | contract | PS-080-04.R01, PS-080-04.R02, PS-080-09.R02 | exercise the public API surface | signatures and error codes match the errors table |
| TEST-PS-080-09.T08 | integration | PS-080-04.R03, PS-080-05.R03 | client strips then relay verifies; send an unstripped image from a stub old client | relay re-encodes or rejects with PRIVACY_METADATA_GPS_PRESENT and stores no original |
| TEST-PS-080-09.T09 | unit | PS-080-05.R01, PS-080-05.R02 | static analysis of imports | no network or storage access in the package |
| TEST-PS-080-09.T10 | abuse | PS-080-06.R02, PS-080-07.R02 | decoder fuzz with 1 000 malformed files and a worker that hangs | no crash, rejected within 10 s timeout, no output bytes |
| TEST-PS-080-09.T11 | integration | PS-080-07.R01, PS-080-07.R03 | upload through relay double and inspect storage and logs | only clean bytes stored; logs contain no full IP, filename or metadata values |
| TEST-PS-080-09.T12 | integration | PS-080-07.R02, PS-080-06.R03 | rate-limit key construction across a salt rotation | same /24 maps to the same key within a day and to a different key after rotation |
| TEST-PS-080-09.T13 | abuse | PS-080-07.R03, PS-080-06.R02 | 61 uploads in an hour from one /24 | 61st returns RATE_LIMITED from the caller's limiter using the key; 3 concurrent image jobs queued |
| TEST-PS-080-09.T14 | integration | PS-080-07.R03, PS-080-03.R02 | browser test of outbound links and network log | no third-party requests; Referrer-Policy no-referrer present; CSP blocks unlisted hosts |
| TEST-PS-080-09.T15 | load | PS-080-08.R01, PS-080-08.R02, PS-080-08.R03 | 12 MP photos on a mid-range device profile and relay worker | p95 ≤ 1.5 s client and ≤ 400 ms relay; verify ≤ 50 ms; corpus clean rate 100 percent |
| TEST-PS-080-09.T16 | unit | PS-080-09.R01, PS-080-09.R03 | traceability tool run | every PS-080 requirement maps to a passing test |
| TEST-PS-080-09.T17 | unit | PS-080-10.R01, PS-080-10.R02, PS-080-10.R03 | export of an image record and reimport of a pre-strip legacy image | export contains clean bytes only; legacy import is re-stripped or quarantined |

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- 100 percent of the 40-image corpus outputs have zero metadata or GPS findings under an independent parser.
- No full IP address and no exact public timestamp appears in any log or public payload in tests.

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
