# PS-080-04 — Commands, queries and events: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-04.R01** The public surface is the TypeScript package; there are no vault or relay commands, queries or events.
- **PS-080-04.R02** Errors are Result values with codes in the errors table; image processing runs in a worker and returns within the budget or fails with the documented code.
- **PS-080-04.R03** The package exposes fixtures and a verifier CLI used in CI to scan sample uploads.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_METADATA_IMAGE_UNSUPPORTED | 415 | no | image type is unsupported, undecodable or animated |
| PRIVACY_METADATA_IMAGE_TOO_LARGE | 413 | no | image exceeds 10 MiB or 16384 px per side |
| PRIVACY_METADATA_GPS_PRESENT | 422 | no | image still contains GPS or other identifying metadata and was rejected |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module. Package surface (packages/privacy/src/security_boundaries/metadata): stripImage(bytes, opts) returns CleanImage, verifyImageClean(bytes) returns {clean, findings[]}, truncateIp(ip) returns IpNetwork, rateLimitKey(ip, dailySalt) returns hex string, publicTime(iso) returns PublicTimestamp, userAgentFamily(ua), outboundLinkPolicy() returns header and rel values. No vault or relay commands, no events.

### Example

```
stripImage(bytes of IMG_2041.jpg with GPS 52.5208,13.4095 and MakerNote thumbnail, { maxSide: 4096, quality: 0.85 })
=> { bytes: <clean JPEG>, mime: "image/jpeg", width: 4096, height: 3072, sha256: "e3b0…" }
verifyImageClean(clean.bytes) => { clean: true, findings: [] }
truncateIp("203.0.113.57") => "203.0.113.0/24"   truncateIp("2001:db8:abcd:12::1") => "2001:db8:abcd::/48"
publicTime("2026-11-04T14:59:59.999Z") => "2026-11-04T14:00:00.000Z"
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T07 | contract | PS-080-04.R01, PS-080-04.R02, PS-080-09.R02 | exercise the public API surface | signatures and error codes match the errors table |
| TEST-PS-080-09.T08 | integration | PS-080-04.R03, PS-080-05.R03 | client strips then relay verifies; send an unstripped image from a stub old client | relay re-encodes or rejects with PRIVACY_METADATA_GPS_PRESENT and stores no original |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
