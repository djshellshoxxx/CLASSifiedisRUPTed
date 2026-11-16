# PS-098-01 — Domain schema: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-01.R01** An AccountLimit stores key, limit key, tier, base value, risk multiplier, override, effective value and the reasons for each adjustment, with tenant and revision per CTR-ID-001.
- **PS-098-01.R02** Limits are P2 between the member and the relay's moderators and retained under RET-STANDARD with the membership record.
- **PS-098-01.R03** Effective value is always computed as the override when active, otherwise floor(base × multiplier) with a minimum of 1.

## Specification

### AccountLimit

Schema `classrup.moderation.accountlimit/v1` · storage **relay** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| subjectKey | did:key — member key on this relay |
| limitKey | enum — listings_per_day \| open_offers \| open_cycle_proposals \| bids_per_day \| new_conversations_per_day |
| tier | enum — new \| established \| trusted |
| baseValue | int — from tier table, 0..10000 |
| riskMultiplier | number — 1.0, 0.75 or 0.5 |
| overrideValue? | int — 0..10000 set by a moderator |
| overrideReason? | string — 10..500 code points |
| overrideBy? | did:key — moderator key |
| overrideExpiresAt? | timestamp — RFC 3339 UTC, at most 90 days after setting |
| effectiveValue | int — computed, ≥ 0 |
| firstSeenAt | timestamp — RFC 3339 UTC, relay clock |
| completedDeals | int — consumed count, capped at 1000 |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- effectiveValue equals overrideValue when overrideExpiresAt is in the future, otherwise max(1, floor(baseValue × riskMultiplier)) unless baseValue is 0.
- overrideValue requires overrideReason, overrideBy and overrideExpiresAt.
- At most one AccountLimit exists per (tenantId, subjectKey, limitKey).

### Storage DDL

```sql
CREATE TABLE moderation_account_limit (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, limit_key TEXT NOT NULL, tier TEXT NOT NULL,
  effective_value INTEGER NOT NULL, override_expires_at TEXT, first_seen_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_account_limit_key ON moderation_account_limit(tenant_id, subject_key, limit_key);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R03, PS-098-02.R01 | tier table for A, B, C on all five limit keys | A new (5, 10, 3, 20, 20), B established (20, 50, 10, 100, 60), C trusted (100, 200, 25, 500, 200) |
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers and overrides | effective value follows the documented formula; never below 1 unless base is 0 or override sets 0 |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily listing limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
