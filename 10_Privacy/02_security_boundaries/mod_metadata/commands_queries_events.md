# PS-080-04 — Commands, queries and events: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

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
| PRIVACY_METADATA_IMAGE_TOO_LARGE | 413 | no | image exceeds 10 MiB or 16384 px per side on input, or cannot be brought to 5 MiB on output |
| PRIVACY_METADATA_GPS_PRESENT | 422 | no | image still contains GPS or other identifying metadata and was rejected |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module. Package surface (packages/privacy/src/security_boundaries/metadata): stripImage(bytes, opts) returns CleanImage (browser only), verifyImageClean(bytes) returns {clean, findings[]} (browser and relay), truncateIp(ip) returns IpNetwork for in-memory use, rateLimitKey(ip, dailySalt) returns hex HMAC-SHA256 of the truncated network, publicTime(iso) returns PublicTimestamp, publicRecordId(now) returns a UUIDv7 with the hour-floored time, assertCoarseTime(payload) returns {ok, findings[]}, userAgentFamily(ua), outboundLinkPolicy() returns header and rel values. Relays call verifyImageClean only and store exactly the received bytes when clean (N9). CTR-PRV-001 PRV-4 still says images are re-encoded server-side; that sentence is superseded by N9 and this spec and needs an ADR-0016 amendment of CTR-PRV-001. No vault or relay commands, no events.

### Example

```
stripImage(bytes of IMG_2041.jpg with GPS 52.5208,13.4095 and MakerNote thumbnail, { maxSide: 4096, quality: 0.85 })
=> { bytes: <clean JPEG, 3.1 MiB>, mime: "image/jpeg", width: 4096, height: 3072, sha256: "e3b0…" }
verifyImageClean(clean.bytes) => { clean: true, findings: [] }      relay receives an unstripped file => PRIVACY_METADATA_GPS_PRESENT
truncateIp("203.0.113.57") => "203.0.113.0/24" (memory only)   rateLimitKey("203.0.113.57", daySalt) => "9f2c…"
publicTime("2026-11-04T14:59:59.999Z") => "2026-11-04T14:00:00.000Z"   publicRecordId("2026-11-04T14:59:59.999Z") => UUIDv7 with time 14:00:00.000Z
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T07 | contract | PS-080-04.R01, PS-080-04.R02, PS-080-09.R02 | exercise the public API surface | signatures and error codes match the errors table |
| TEST-PS-080-09.T22 | integration | PS-080-04.R03 | run the verifier CLI in CI on the sample upload folder with one dirty file | CLI exits non-zero naming the dirty file and its findings; exits 0 after it is removed |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
