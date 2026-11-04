# PS-125-01 — Domain schema: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-01.R01** A Tenant stores slug, display name, status, allowed currencies, jurisdiction profile id, default locale, limits and operator keys with the base record fields of CTR-ID-001 (id is the tenantId).
- **PS-125-01.R02** Tenant data is public hosting information (P0) except operator device keys, which are public keys and so also P0, and is retained as RET-STANDARD while the community exists.
- **PS-125-01.R03** LocalSettings is the vault's own preference record with the same settings shape, P1, stored only on the device and exported with the vault.

## Specification

### Tenant

Schema `classrup.platform.tenant/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, used as tenantId everywhere on this relay |
| slug | string — ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$, unique per relay |
| displayName | string — 1..80 characters, plain text |
| status | enum — provisioning \| active \| suspended \| archived |
| allowedCurrencies | string[] — 1..20 distinct codes matching ^[A-Z0-9]{2,12}$ (ISO 4217 alpha-3 or configured asset code) |
| jurisdictionProfile | string — ^[a-z0-9_-]{2,40}$, default 'generic' |
| defaultLocale | string — BCP 47 tag matching ^[a-z]{2,3}(-[A-Z]{2})?$, default 'en' |
| limits | json — { maxRegisteredDevices 1..1000000 default 10000, maxIndexedListingsPerPublisher 1..1000 default 100, maxUploadBytes 65536..10485760 default 5242880, maxMailboxBytesPerRecipient 1048576..1073741824 default 52428800, maxEnvelopeBytes 4096..1048576 default 262144, requestRatePerMinutePerKey 10..1200 default 120, maxCycleLength 3..6 default 5 } |
| operatorKeys | string[] — 1..10 distinct did:key principals with operator role on this tenant |
| suspendedReason? | string — ≤ 200 characters, shown to clients |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At least one operator key exists while status is provisioning-complete (active, suspended).
- slug is unique per relay and immutable after creation.
- Every limit stays within its documented minimum and maximum.
- A tenant in archived status accepts no writes and no configuration changes.

### LocalSettings

Schema `classrup.platform.local_settings/v1` · storage **device** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, one record per vault |
| defaultLocale | string — BCP 47 tag, default taken from the browser language, fallback 'en' |
| preferredCurrencies | string[] — 0..20 codes matching ^[A-Z0-9]{2,12}$, used for display and defaults only |
| localLimits | json — { maxLocalAttachmentBytes 65536..10485760 default 5242880, maxOutboxEntries 10..200 default 200 } |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one LocalSettings record exists per vault and it is never sent to a relay.
- Local limits can only be lower than or equal to the platform maximums (never raise a relay's limits).

### Storage DDL

```sql
CREATE TABLE platform_tenant (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX platform_tenant_slug ON platform_tenant(slug);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T01 | unit | PS-125-01.R01, PS-125-01.R02, PS-125-02.R01 | create a tenant with valid input | stored with revision 1, status active, defaults applied, schema classrup.platform.tenant/v1 |
| TEST-PS-125-09.T18 | integration | PS-125-04.R03, PS-125-01.R03 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies, existing records untouched, new records in removed currency refused by consumers |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
