# PS-118-07 — Privacy, retention and abuse: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-07.R01** The relay stores only signed public projections, encrypted envelopes, P0 public media and relay-local operational data; it sees ciphertext plus minimal routing metadata for P2 data (CTR-PRV-001 PRV-5) and never plaintext P2 or higher.
- **PS-118-07.R02** Logs omit tokens, bodies and personal data, record only registered route templates without path parameters, query strings, mailbox ids or listing ids, truncate IPs to /24 or /48 and omit the IP prefix entirely on mailbox routes, and are kept 1 year as RET-AUDIT then deleted (CTR-OBS-001 OBS-1).
- **PS-118-07.R03** Operators can read only what the relay holds; seizure of a relay reveals no vault private records, keys or plaintext messages, and its logs do not link client addresses to mailboxes.
- **PS-118-07.R04** A receipt for a mailbox put signs only the digest of the ciphertext and the mailbox destination, never the plaintext statement cid, so receipts disclose nothing beyond PRV-5 routing metadata.

## Specification

**Data classification**
- RelayIdentity: P0 public key history and metadata; private seed and revocation certificates P4 in operator-held files only.
- Receipt counter: P0 epoch and seq per relay.
- Outbox archive: relay-local events, P0 to P1 payloads only (IDs and minimal fields per EVT-5).
- Access logs: route template, status, duration, correlationId, truncated IP (absent on mailbox routes).

**Retention**
- RelayIdentity rows: kept while the relay exists; retired keys at least 400 days; revoked keys for the life of the relay.
- Delivered outbox rows 7 days; outbox archive segments 90 days; dead letters 30 days; access logs 1 year (RET-AUDIT), rotated daily and deleted after 365 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay private key theft allows forged or backdated receipts | key file 0600, optional scrypt wrapping, never logged or stored in SQLite; CLI revocation signed by the key or its pre-signed certificate, exempt from rate limits; receipts by a revoked key valid only if stored before revokedAt; receipts never authorize vault actions |
| T02 | Operator or attacker reads private user data on the relay | design: relay holds only public projections, P0 media and E2E ciphertext; no plaintext P2+ endpoint exists; the media route serves P0 unencrypted blobs only; tests grep stored rows for plaintext markers |
| T03 | Slowloris and oversized body denial of service | headersTimeout 10 s, requestTimeout 30 s, JSON body limit 262144 bytes, media 5308416 bytes, per-connection cap 256, reverse proxy rate limits |
| T04 | Cross-origin abuse from a malicious page | CORS allowlist without wildcard, no cookies, bearer tokens only in Authorization headers, preflight cache 600 s |
| T05 | Malicious relay impersonates another or a thief forks the identity | relayId self-certifying from the genesis key; rotations signed by the previous key with prevKeyId and seq; two rotations from one prevKeyId are equivocation that vaults detect and freeze; new identities always get a new relayId |
| T06 | Config secrets leak through logs or crash dumps | secrets use the F16.S01.M02 RELAY_SECRET_<NAME>[_FILE] names, which this loader never reads or prints; the relay seed lives only in the Secret wrapper (renders [REDACTED]); config printer redacts names containing KEY, SECRET, PASSPHRASE or TOKEN; startup errors list names only |
| T09 | A test-only clock or seed route shipped in production lets anyone move receipt or auction times or plant data | production entry main.ts registers no such route (V16); the FakeClock and seeding exist only in the in-process e2e entry; F17.S01.M04 V07 and T21 probe and scan the build |
| T10 | Users follow an attacker's relay after a compromise, or lose their relay because nothing links the new identity | the compromise revocation names successorRelayId and the new identity's first restore announcement names predecessorRelayId, both signed; vaults still require an out-of-band fingerprint confirmation (F16.S03.M03 RB-01) before rerouting |
| T07 | Operator or seizer rebuilds the communication graph from access logs | route templates only, no mailbox or listing ids, no query strings, no IP prefix on mailbox routes; mailbox-id canary test |
| T08 | A receipt for one mailbox presented as proof for another | receipt binds destination and the digest of the exact bytes; vault verification compares both |

**Abuse controls**
- Request limits per connection and per IP are enforced by the mod_api rate limiter with relay policy values; this module sets the transport limits (256 connections, 100 requests per keep-alive connection).
- Rotation limited to 1 per 24 h; revocation CLI-only; status endpoint relay_operator or admin only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T11 | abuse | PS-118-07.R01, PS-118-07.R02, PS-118-07.R03 | full workload with canary plaintext in encrypted envelopes and a canary mailbox id in mailbox paths and queries; then advance the log clock 366 days | no plaintext canary in database or logs; no mailbox-id canary in any log line; only route templates; IPs truncated and absent on mailbox routes; no tokens; log files older than 365 days deleted |
| TEST-PS-118-09.T19 | contract | PS-118-04.R04, PS-118-07.R04 | mailbox put to A, index write, federation inbox batch and media upload; rotate; verify each receipt with the vault verifier; present A's receipt for mailbox B | receipts validate as classrup.platform.relay_receipt/v1 with context classrup-relay-receipt:v1, digest of the exact bytes (ciphertext for the mailbox) and no cid for the mailbox put; keyId resolves to the right key after rotation; A's receipt rejected for B |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, F16.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
