# PS-099-07 — Privacy, retention and abuse: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-07.R01** No raw IP address, actor key or user identifier is stored; keys are HMAC hashes under per-class salts destroyed once the previous epoch leaves the window (at most 48 h for windows up to 24 h, at most 60 days for 30-day windows), and logs contain at most /24 or /48 truncated prefixes per CTR-OBS-001.
- **PS-099-07.R02** Bucket state is kept for its window plus at most 24 h (RET-EPHEMERAL for windows up to 24 h, RET-SHORT for longer ones up to 30 days) and never exported.
- **PS-099-07.R03** Abuse (distributed low-rate attacks, limit evasion by key rotation, limit-based harassment) is addressed by layered scopes and tenant caps.

## Specification

**Data classification**
- RateBucket: P3 hashed operational state.
- RatePolicy: P1 configuration visible to operators and, as published limits, to members.
- Class salts: P4 relay or vault secrets, never exported.

**Retention**
- Buckets: window plus at most 24 h; RET-EPHEMERAL for windows up to 24 h, RET-SHORT for windows over 24 h (at most 30 days).
- Salts: until the previous epoch's last counter leaves the window.
- Policies: RET-STANDARD with revision history kept 1 year in the audit log.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Credential-stuffing or challenge flooding on relay access | relay.access class: 10 per minute per IP prefix, 5 per minute per key, failMode closed |
| T02 | Evasion by creating many new keys | per-IP-prefix scope with multiplier 5, tenant global cap per class, and tier limits from F12.S03.M04 |
| T03 | Proximity query trilateration | read.search class token bucket 60 per minute per key and 120 per minute per /24, minimum search radius enforced elsewhere (CTR-PRV-001 PRV-2) |
| T04 | Privacy leak through rate-limit logs | only hashed keys and truncated prefixes; salts destroyed with their epoch; no raw IPs in storage |
| T05 | Operator disables limits | bounded ranges (V01), locked fail modes (V03), all policy changes audit-logged and visible in the public relay policy |
| T06 | Long-window limits reset at salt rotation | dual-epoch lookup until the previous epoch leaves the window |
| T07 | Vault-supplied counts used to bypass relay limits | relay limits count only requests the relay itself received; stock guards exist only in scope local |

**Abuse controls**
- Tenant-wide cap per capability class (default 2 000 requests per minute per class on a 2 vCPU relay) protects availability when many keys act together.
- Spam velocity penalties apply factor 0.25 for at most 1 hour and are labelled automated.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-07.R01 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48; daily prefix salt rotation | same prefix hash within an epoch; prefix salt destroyed by 48 h; no raw IP or key in rows or logs |
| TEST-PS-099-09.T10 | abuse | PS-099-07.R03 | 20 keys from one /24 hammering write.index; attacker rotates 50 keys | prefix limit reached at 5× actor limit; tenant cap holds |
| TEST-PS-099-09.T11 | integration | PS-099-07.R02, PS-099-01.R01 | injected clock: a 24 h class bucket 25 h after its last update; a 30-day class bucket 31 days after its last update | both purged; export contains none |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
