# PS-099-01 — Domain schema: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-01.R01** A RateBucket stores key hash, scope, capability class, algorithm state (theoretical arrival time, token count or window sub-counters), penalty factor, salt epoch and update time, and is operational state kept for its policy window plus at most 24 h (RET-EPHEMERAL for windows up to 24 h, RET-SHORT for longer windows up to 30 days).
- **PS-099-01.R02** A RatePolicy stores per-tenant limits per capability class with algorithm, limit, period, burst, allowed scopes, prefix multiplier, fail mode and version, and is retained as configuration under RET-STANDARD.
- **PS-099-01.R03** Raw IP addresses and keys are never stored; they are hashed under a per-class salt whose epoch is at least the policy window, the previous epoch's salt is kept only until its last counter leaves the window, and IP-prefix scopes are limited to windows of at most 24 h so prefix salts are destroyed at most 48 h after creation.
- **PS-099-01.R04** A policy expresses any limit from 1 per 30 days to 100 000 per second as { limit, periodMs, burst }, and GCRA uses the emission interval periodMs / limit.

## Specification

### RateBucket

Schema `classrup.moderation.ratebucket/v1` · storage **relay+device** · privacy **P3** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| keyHash | string — HMAC-SHA-256 under the class salt of saltEpoch over scope and key, 64 hex chars |
| tenantId | uuidv7 — store scope |
| scope | enum — actor \| ip_prefix \| tenant \| local |
| capabilityClass | string — policy class such as write.index, write.mailbox.new_recipient, read.search, relay.access, report.receive |
| algorithm | enum — gcra \| token_bucket \| window_counter |
| saltEpoch | int — epoch number of the class salt used for keyHash |
| tat? | int — GCRA theoretical arrival time in monotonic milliseconds, when gcra |
| tokens? | number — current tokens (0..capacity), when token_bucket |
| windowCounters? | object — sub-bucket start to count (1 minute for windows ≤ 1 h, 1 hour for ≤ 24 h, 1 day above), when window_counter |
| penaltyFactor | number — 0.25..1.0, default 1.0 |
| penaltyUntil? | timestamp — RFC 3339 UTC, at most 1 hour after setting |
| reducedUntil? | timestamp — RFC 3339 UTC, only on marker rows of class report.receive.reduced: signal observedAt + 30 days |
| expiresAt | timestamp — RFC 3339 UTC, last update + periodMs, at most 24 h beyond the window; reducedUntil for marker rows |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- tokens never exceeds capacity, tat never moves backward except by reset, and the sum of windowCounters inside any window never exceeds the limit plus the cost of the refused request.
- penaltyFactor below 1.0 requires penaltyUntil within 1 hour.
- No row contains an IP address, actor key or any value from which they can be read back, and scope ip_prefix exists only for classes with periodMs ≤ 86400000.

### RatePolicy

Schema `classrup.moderation.ratepolicy/v1` · storage **relay+device** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope |
| capabilityClass | string — class name, unique per tenant |
| algorithm | enum — gcra \| token_bucket \| window_counter |
| limit | int — 1..100000 requests per period |
| periodMs | int — 1000..2592000000 (1 second to 30 days) |
| burst | int — 1..1000; gcra burst tolerance and token bucket capacity; unused by window_counter |
| scopes | string[] — subset of actor, ip_prefix, tenant, local |
| prefixMultiplier | int — 1..20, default 5 |
| failMode | enum — open \| closed |
| kind | enum — flow \| stock (stock only in scope local) |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- For gcra the emission interval is periodMs / limit and burst is at most limit; ip_prefix appears in scopes only when periodMs ≤ 86400000.
- Classes relay.access, report.receive, report.receive.reduced and key.register always have failMode closed.
- Stock policies exist only in scope local and count the vault's own records; relays never receive their counts.

**Note:** Built-in classes (relay defaults): relay.access gcra 5 per minute per key and 10 per minute per prefix (closed); key.register gcra 3 per hour (closed); report.receive window_counter 20 per 24 h per key and 60 per 24 h per /24 (closed); report.receive.reduced window_counter 3 per 24 h per key (closed); appeal.receive.day 5 per 24 h and appeal.receive.30d 20 per 30 days per key; evidence.capture 60 per hour; moderation.action.apply 50 per 24 h per moderator; policy.publish 20 per 24 h; accountlimit.override 30 per 24 h; signal.manual 10 per 24 h; risk.recompute 60 per hour; write.index gcra 20 per hour burst 5; write.mailbox.new_recipient and write.bid window_counter per key per 24 h with the per-key limit from F12.S03.M04; read.search token bucket 60 per minute per key and 120 per minute per /24. Vault local guards: local.offer.sent 10 per hour, local.report.filed 10 per hour, local.offer.open stock 10 and local.cycle_proposal.open stock 3, all confirmations only.

### Storage DDL

```sql
CREATE TABLE moderation_rate_policy (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, capability_class TEXT NOT NULL, algorithm TEXT NOT NULL,
  limit_count INTEGER NOT NULL, period_ms INTEGER NOT NULL, burst INTEGER NOT NULL, scopes TEXT NOT NULL,
  prefix_multiplier INTEGER NOT NULL, fail_mode TEXT NOT NULL, kind TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_rate_policy_class ON moderation_rate_policy(tenant_id, capability_class);
CREATE TABLE moderation_rate_bucket (
  key_hash TEXT NOT NULL, tenant_id TEXT NOT NULL, capability_class TEXT NOT NULL, salt_epoch INTEGER NOT NULL, tat INTEGER, tokens REAL,
  window_counters TEXT, penalty_factor REAL NOT NULL DEFAULT 1, penalty_until TEXT, expires_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY (key_hash, tenant_id, capability_class));
CREATE INDEX moderation_rate_bucket_expiry ON moderation_rate_bucket(tenant_id, expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R04, PS-099-04.R01 | GCRA 20 per hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 180000 minus elapsed |
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA, token bucket and window counter models | decisions identical; tokens within [0, capacity]; tat monotonic; window sums never exceed the limit |
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-07.R01 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48; daily prefix salt rotation | same prefix hash within an epoch; prefix salt destroyed by 48 h; no raw IP or key in rows or logs |
| TEST-PS-099-09.T11 | integration | PS-099-07.R02, PS-099-01.R01 | injected clock: a 24 h class bucket 25 h after its last update; a 30-day class bucket 31 days after its last update | both purged; export contains none |
| TEST-PS-099-09.T16 | property | PS-099-03.R04, PS-099-01.R03 | 20-per-30-days window_counter with arrivals spread over 60 days and a salt rotation on day 15 | at most 20 allowed in any 30-day window across the rotation; previous salt destroyed once its last counter leaves the window |
| TEST-PS-099-09.T18 | unit | PS-099-01.R02, PS-099-01.R04 | ratepolicy.set for 5 per 24 h, 20 per hour, 50 per 24 h and 20 per 30 days | all accepted and stored with limit and periodMs; GCRA emission interval reported as periodMs / limit |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
