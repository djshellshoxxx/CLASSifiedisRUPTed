# PS-080-07 — Privacy, retention and abuse: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-07.R01** Original uploads are never persisted on the relay; only the clean re-encoded bytes are stored, and the client keeps the original only if the user keeps it in their own gallery.
- **PS-080-07.R02** IP addresses are used only in memory for the current request or as a salted hash of the /24 or /48 for rate limiting with a daily rotating salt, and are never written to logs in full.
- **PS-080-07.R03** Public time coarsening and user-agent reduction are applied at the boundary where data becomes public or is logged.

## Specification

**Data classification**
- Images: P0 after stripping when the owner publishes them; before that P3 in the vault.
- Truncated IP network: P3 operational data kept at most 24 h (RET-EPHEMERAL); coarsened times: P0.

**Retention**
- Rate-limit keys RET-EPHEMERAL (24 h); no IP data in logs beyond the truncated network; clean images follow their owning listing's retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | GPS or device identifiers remain in a published photo | re-encode pipeline, verifyImageClean on client and relay, relay rejects non-clean images, CI corpus of 40 tricky files scanned with an independent parser |
| T02 | Polyglot or malformed file exploits the decoder | decode in a sandboxed worker, size and dimension limits, trailing bytes discarded, fuzz corpus in CI |
| T03 | IP address correlation through logs or rate-limit tables | /24 and /48 truncation, salted daily-rotating hashes, no full IP in logs, tests scan logs for full addresses |
| T04 | Activity pattern inference from exact public timestamps | public times floored to the hour, ordering by record ID, owner and participants still see exact times |
| T05 | Third-party requests leak the user to outside services | no third-party scripts, fonts or analytics, Referrer-Policy no-referrer for outbound links, CSP restricts connect-src to chosen relays |

**Abuse controls**
- Upload size cap 10 MiB, 2 concurrent image jobs per client, relay image upload limit 60 per hour per truncated network.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T10 | abuse | PS-080-06.R02, PS-080-07.R02 | decoder fuzz with 1 000 malformed files and a worker that hangs | no crash, rejected within 10 s timeout, no output bytes |
| TEST-PS-080-09.T11 | integration | PS-080-07.R01, PS-080-07.R03 | upload through relay double and inspect storage and logs | only clean bytes stored; logs contain no full IP, filename or metadata values |
| TEST-PS-080-09.T12 | integration | PS-080-07.R02, PS-080-06.R03 | rate-limit key construction across a salt rotation | same /24 maps to the same key within a day and to a different key after rotation |
| TEST-PS-080-09.T13 | abuse | PS-080-07.R03, PS-080-06.R02 | 61 uploads in an hour from one /24 | 61st returns RATE_LIMITED from the caller's limiter using the key; 3 concurrent image jobs queued |
| TEST-PS-080-09.T14 | integration | PS-080-07.R03, PS-080-03.R02 | browser test of outbound links and network log | no third-party requests; Referrer-Policy no-referrer present; CSP blocks unlisted hosts |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
