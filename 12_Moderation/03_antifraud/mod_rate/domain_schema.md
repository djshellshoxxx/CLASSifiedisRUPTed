# PS-099-01 — Domain schema: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-01.R01** A RateBucket stores key hash, scope, capability class, algorithm state (theoretical arrival time or token count), penalty factor and update time, and is ephemeral operational state under RET-EPHEMERAL.
- **PS-099-01.R02** A RatePolicy stores per-tenant limits per capability class with burst, rate, prefix multiplier, fail mode and version, and is retained as configuration under RET-STANDARD.
- **PS-099-01.R03** Raw IP addresses are never stored; prefixes are hashed with a daily rotated salt and the salt is destroyed after 24 hours.

## Specification

### RateBucket

Schema `classrup.moderation.ratebucket/v1` · storage **relay+device** · privacy **P3** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| keyHash | string — HMAC-SHA-256 with the daily salt over scope and key, 64 hex chars |
| tenantId | uuidv7 — store scope |
| scope | enum — actor \| ip_prefix \| tenant \| local |
| capabilityClass | string — policy class such as write.listing, write.offer, read.search, relay.access, report.receive |
| algorithm | enum — gcra \| token_bucket |
| tat | int — GCRA theoretical arrival time in monotonic milliseconds, when gcra |
| tokens | number — current tokens (0..capacity), when token_bucket |
| penaltyFactor | number — 0.25..1.0, default 1.0 |
| penaltyUntil? | timestamp — RFC 3339 UTC, at most 1 hour after setting |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- tokens never exceeds capacity and tat never moves backward except by reset.
- penaltyFactor below 1.0 requires penaltyUntil within 1 hour.
- No row contains an IP address, actor key or any value from which they can be read back.

### RatePolicy

Schema `classrup.moderation.ratepolicy/v1` · storage **relay+device** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| capabilityClass | string — class name, unique per tenant |
| algorithm | enum — gcra \| token_bucket |
| ratePerMinute | int — 1..6000 |
| burst | int — 1..1000 |
| prefixMultiplier | int — 1..20, default 5 |
| failMode | enum — open \| closed |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- burst is at least 1 and at most ratePerMinute × 5 for gcra.
- Classes relay.access, report.receive and key.register always have failMode closed.

### Storage DDL

```sql
CREATE TABLE moderation_rate_policy (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, capability_class TEXT NOT NULL, algorithm TEXT NOT NULL,
  rate_per_minute INTEGER NOT NULL, burst INTEGER NOT NULL, prefix_multiplier INTEGER NOT NULL, fail_mode TEXT NOT NULL,
  revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_rate_policy_class ON moderation_rate_policy(tenant_id, capability_class);
CREATE TABLE moderation_rate_bucket (
  key_hash TEXT NOT NULL, tenant_id TEXT NOT NULL, capability_class TEXT NOT NULL, tat INTEGER, tokens REAL,
  penalty_factor REAL NOT NULL DEFAULT 1, penalty_until TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (key_hash, tenant_id, capability_class));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R01, PS-099-01.R02, PS-099-04.R01 | GCRA 20/hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 3 minutes minus elapsed |
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA and token bucket models | decisions identical; tokens within [0, capacity]; tat monotonic |
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-04.R02 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48 | same prefix hash; salt rotates after 24 h; no raw IP in rows or logs |
| TEST-PS-099-09.T15 | e2e | PS-099-01.R01, PS-099-04.R02 | mobile user sends 11th offer in an hour with local guard set to 10 | confirmation dialog appears; axe zero serious issues |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
