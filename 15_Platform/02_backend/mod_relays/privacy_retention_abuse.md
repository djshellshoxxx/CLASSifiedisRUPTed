# PS-118-07 — Privacy, retention and abuse: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-07.R01** The relay stores only signed public projections, encrypted envelopes and relay-local operational data; it sees ciphertext plus minimal routing metadata for P2 data (CTR-PRV-001 PRV-5) and never plaintext P2 or higher.
- **PS-118-07.R02** Logs omit tokens, bodies and personal data, truncate IPs to /24 or /48 and are kept 1 year as RET-AUDIT (CTR-OBS-001 OBS-1).
- **PS-118-07.R03** Operators can read only what the relay holds; seizure of a relay reveals no vault private records, keys or plaintext messages.

## Specification

**Data classification**
- RelayIdentity: P0 public key and metadata; private seed P4 in the key file only.
- Outbox archive: relay-local events, P0 to P1 payloads only (IDs and minimal fields per EVT-5).
- Access logs: truncated IP, route, status, duration, correlationId.

**Retention**
- RelayIdentity rows: kept while the relay exists; retired keys at least 400 days.
- Delivered outbox rows 7 days; outbox archive segments 90 days; dead letters 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay private key theft allows forged receipts | key file 0600, optional scrypt wrapping, never logged or stored in SQLite, rotation command, receipts only evidence delivery to this relay so forged receipts cannot authorize vault actions |
| T02 | Operator or attacker reads private user data on the relay | design: relay holds only public projections and E2E ciphertext; no plaintext P2+ endpoint exists; tests grep stored rows for plaintext markers |
| T03 | Slowloris and oversized body denial of service | headersTimeout 10 s, requestTimeout 30 s, body limit 1 MiB default, per-connection cap 256, reverse proxy rate limits |
| T04 | Cross-origin abuse from a malicious page | CORS allowlist without wildcard, no cookies, bearer tokens only in Authorization headers, preflight cache 600 s |
| T05 | Malicious relay impersonates another | relayId derived from public key; PWA pins the selected relay's key and shows fingerprint, rotation requires signature by previous key |
| T06 | Config secrets leak through logs or crash dumps | config printer redacts names matching KEY | SECRET | PASSPHRASE | TOKEN; *_FILE variants for secrets; startup errors list names only |

**Abuse controls**
- Request limits per connection and per IP are enforced by the mod_api rate limiter with relay policy values; this module sets the transport limits (256 connections, 100 requests per keep-alive connection).
- Rotation limited to 1 per 24 h; status endpoint operator-only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T11 | abuse | PS-118-07.R01, PS-118-07.R03 | scan database and logs after a full workload with canary plaintext in encrypted envelopes | no plaintext canary present, IPs truncated, no tokens in logs |
| TEST-PS-118-09.T12 | abuse | PS-118-07.R02, PS-118-07.R03 | delete key file while identity row exists, then start | refuses with PLATFORM_RELAY_IDENTITY_MISSING; --accept-new-identity creates a new key id and keeps relayId only if operator supplies the seed |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
