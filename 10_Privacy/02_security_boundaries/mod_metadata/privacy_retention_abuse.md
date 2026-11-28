# PS-080-07 — Privacy, retention and abuse: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-07.R01** Relays store exactly the client-cleaned bytes whose content address is referenced by the signed listing and reject anything else; original uploads never reach relay storage, and the client keeps the original only if the user keeps it in their own gallery.
- **PS-080-07.R02** IP addresses and truncated networks are used only in memory for the current request; the only retained form is the daily-salted rateLimitKey (RET-EPHEMERAL, 24 h), and logs contain no address or network.
- **PS-080-07.R03** Public time coarsening and user-agent reduction are applied at the boundary where data becomes public or is logged.
- **PS-080-07.R04** Outbound requests follow the header policy, namely Referrer-Policy no-referrer, no third-party requests, no analytics cookies, and a CSP whose connect-src lists only the relays the user chose.

## Specification

**Data classification**
- Images: P0 after stripping when the owner publishes them; before that P3 in the vault.
- Truncated IP network: P3, memory only, never stored or logged. rateLimitKey: P1 operational key kept at most 24 h (RET-EPHEMERAL). Coarsened times and hour-floored public IDs: P0.

**Retention**
- Rate-limit keys RET-EPHEMERAL (24 h); no IP-derived value in logs except rateLimitKey; clean images follow their owning listing's retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | GPS or device identifiers remain in a published photo | browser re-encode pipeline, verifyImageClean on client and relay, relay rejects non-clean images and never stores substituted bytes, CI corpus of 40 tricky files scanned with an independent parser |
| T02 | Polyglot or malformed file exploits the decoder | decode in a sandboxed worker, size and dimension limits, trailing bytes discarded, fuzz corpus in CI |
| T03 | IP address correlation through logs or rate-limit tables | networks only in memory, daily-salted HMAC keys rotated every 24 h as the only retained form, no address or network in logs; residual risk - an IPv6 /48 or IPv4 /24 still usually identifies one household or site, so within one day the key links that site's requests; tests scan logs for full addresses and truncated networks |
| T04 | Activity pattern inference from exact public timestamps or time-ordered IDs | public projections sign hour-floored timestamps and publicRecordId IDs, ordering inside the hour by per-author seq, assertCoarseTime in tests; residual risk - relays and peers see the arrival time of each statement and can order an author's statements by seq, and the vault owner and participants still see exact times |
| T05 | Third-party requests leak the user to outside services | no third-party scripts, fonts or analytics, Referrer-Policy no-referrer for outbound links, CSP restricts connect-src to chosen relays |

**Abuse controls**
- Upload size cap 10 MiB input and 5 MiB output, 2 concurrent image jobs per client, relay image upload limit 60 per hour per rateLimitKey.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T04 | unit | PS-080-02.R03, PS-080-07.R02 | IPv4, IPv6, IPv4-mapped and invalid inputs | /24 and /48 networks returned in memory; invalid VALIDATION_FAILED; raw value never returned; no helper writes the network anywhere |
| TEST-PS-080-09.T05 | unit | PS-080-02.R03, PS-080-07.R03 | hour-boundary timestamps and invalid timestamps | floor to hour UTC; owner view unchanged; invalid VALIDATION_FAILED |
| TEST-PS-080-09.T08 | integration | PS-080-05.R03, PS-080-07.R01 | client strips then relay verifies; send an unstripped image from a stub old client | clean upload stored with exactly the bytes whose hash is in the listing; the unstripped image is rejected with PRIVACY_METADATA_GPS_PRESENT, never re-encoded and never stored |
| TEST-PS-080-09.T11 | integration | PS-080-01.R03, PS-080-07.R01 | upload through relay double and inspect storage and logs | only clean bytes stored; logs contain no full IP, no truncated network, no filename and no metadata values |
| TEST-PS-080-09.T12 | integration | PS-080-07.R02 | rate-limit key construction across a salt rotation | same /24 maps to the same key within a day and to a different key after rotation |
| TEST-PS-080-09.T13 | abuse | PS-080-07.R02 | 61 uploads in an hour from one /24 | 61st returns RATE_LIMITED from the caller's limiter using rateLimitKey; 3 concurrent image jobs queued |
| TEST-PS-080-09.T14 | integration | PS-080-07.R04 | browser test of outbound links and network log | no third-party requests; Referrer-Policy no-referrer present; no analytics cookies; CSP blocks unlisted hosts |
| TEST-PS-080-09.T19 | unit | PS-080-02.R03, PS-080-07.R03 | the 25 user-agent vectors and a 513-character string | family and major version only, no minor version, platform build or device model; the 513-character input fails with VALIDATION_FAILED |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
