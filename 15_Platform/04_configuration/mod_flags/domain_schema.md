# PS-124-01 — Domain schema: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-01.R01** A FlagSetting stores scope, community id (relay scope), key, value, beta roles, reason, actor and revision, with unique (scope, communityId, key).
- **PS-124-01.R02** Vault-scope settings live only in the user's vault and are P1; relay-scope settings live in the relay database and are P0 because they describe hosting policy visible to clients.
- **PS-124-01.R03** Settings are never deleted when a module is turned off; resetting a key removes the row so the registry default applies.

## Specification

### FlagSetting

Schema `classrup.platform.flag_setting/v1` · storage **relay+device** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| scope | enum — vault \| relay |
| tenantId | uuidv7 — community id on the relay (CTR-ID-001 ID-6); the fixed value 00000000-0000-7000-8000-000000000000 for the vault scope |
| key | string — module ID (F04.S01.M01) or feature ID (F04) present in the registry |
| value | enum — off \| on \| beta |
| betaRoles? | string[] — roles among member, moderator, operator, admin; 1..4 items, required when value is beta; for the vault scope the value beta means enabled when Show beta features is on |
| reason? | string — ≤ 200 chars, plain text |
| changedBy | string — did:key of the local principal (vault) or operator device (relay) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one FlagSetting per (scope, tenantId, key).
- A stored on or beta value never violates the dependency rule against the stored effective state of its dependencies at write time.
- Core features F15 and F16 have no stored off value.
- Keys exist in the registry and FUTURE modules cannot be set to on or beta.

### Storage DDL

```sql
CREATE TABLE platform_flag_setting (
  id TEXT PRIMARY KEY, scope TEXT NOT NULL, tenant_id TEXT NOT NULL, key TEXT NOT NULL,
  value TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX platform_flag_key ON platform_flag_setting(scope, tenant_id, key);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T01 | unit | PS-124-01.R01, PS-124-01.R03, PS-124-02.R01 | set key on, reset key | one row per (scope, tenant, key); reset removes the row and default applies; settings kept when module is off |
| TEST-PS-124-09.T03 | property | PS-124-02.R02, PS-124-03.R01, PS-124-01.R02 | random settings and random changes over random acyclic registries | stored state never violates the dependency rule; evaluation never throws; unknown keys evaluate off |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
