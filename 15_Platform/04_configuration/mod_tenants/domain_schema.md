# PS-125-01 — Domain schema: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-01.R01** A Tenant stores slug, display name, status, allowed currencies, jurisdiction profile id, default locale, limits and revision with the base record fields of CTR-ID-001 (id is the tenantId); its operator keys are not stored but derived from F16.S01.M01 RoleAssignment records of scope tenant:<id>.
- **PS-125-01.R02** Tenant data is public hosting information (P0), including the derived operator public keys, and is retained as RET-STANDARD while the community exists.
- **PS-125-01.R03** LocalSettings is the vault's own preference record (P3, stored only on the device and exported with the vault) and holds the vaultId, a UUIDv7 created once at vault initialisation that is the CTR-ID-001 ID-6 tenantId of every record in that vault; the vault has no relay tenant record.
- **PS-125-01.R04** Every limit is capped by the platform maximums (maxUploadBytes and maxLocalAttachmentBytes ≤ 5242880 per N9, maxEnvelopeBytes ≤ 262144 per CTR-SCH-001 SCH-6) and names the module that enforces it; a limit without an enforcer is not part of the record.

## Specification

### Tenant

Schema `classrup.platform.tenant/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, used as tenantId everywhere on this relay |
| slug | string — ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$, unique per relay |
| displayName | string — 1..80 characters, plain text |
| status | enum — active \| suspended \| archived |
| allowedCurrencies | string[] — 1..20 distinct codes matching ^[A-Z0-9]{2,12}$ (ISO 4217 alpha-3 or configured asset code); enforced by the relay index and publish intake (F06.S01.M01, F11.S01.M02) |
| jurisdictionProfile | string — ^[a-z0-9_-]{2,40}$, default 'generic' |
| defaultLocale | string — BCP 47 tag matching ^[a-z]{2,3}(-[A-Z]{2})?$, default 'en' |
| limits | json — { maxIndexedListingsPerPublisher 1..1000 default 100 (F06.S01.M01 index write), maxUploadBytes 65536..5242880 default 5242880 (F15.S02.M01 media upload), maxMailboxBytesPerRecipient 1048576..1073741824 default 52428800 (F08.S01.M01), maxEnvelopeBytes 4096..262144 default 262144 (F08.S01.M01), maxCycleLength 3..6 default 5 (F02.S02.M03 relay matching) } |
| operatorKeys | derived string[] — did:key subjects of active F16.S01.M01 RoleAssignments with role operator and scope tenant:<id>; read through F16, never stored here |
| suspendedReason? | string — ≤ 200 characters, shown to clients |
| suspendedAt? | timestamp — RFC 3339 UTC |
| configStatementCid | string — cid of the relay-signed classrup.platform.tenant_config/v1 statement of the current revision |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At least one active F16.S01.M01 operator RoleAssignment of scope tenant:<id> exists while status is active or suspended.
- slug is unique per relay and immutable after creation.
- Every limit stays within its documented minimum and maximum, and the maximums never exceed the platform caps.
- A tenant in archived status accepts no writes and no configuration changes.
- Every revision has exactly one relay-signed tenant_config statement, issued in the transaction that created the revision.

### LocalSettings

Schema `classrup.platform.local_settings/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, one record per vault |
| vaultId | uuidv7 — created once at vault initialisation; the CTR-ID-001 ID-6 tenantId of every record in this vault (the dispatch context tenantId of F15.S02.M02); immutable and never sent to a relay |
| defaultLocale | string — BCP 47 tag, default taken from the browser language, fallback 'en' |
| preferredCurrencies | string[] — 0..20 codes matching ^[A-Z0-9]{2,12}$, used for display and defaults only |
| localLimits | json — { maxLocalAttachmentBytes 65536..5242880 default 5242880 (vault blob store of F15.S02.M03 and F08.S01.M03), maxOutboxEntries 10..200 default 200 (F15.S01.M01) } |
| knownRelayConfigs? | json — per relayId the last verified tenant_config statement { tenantId, revision, cid, statement } used to show what changed |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one LocalSettings record exists per vault and it is never sent to a relay.
- Local limits can only be lower than or equal to the platform maximums (never raise a relay's limits).
- vaultId never changes after vault initialisation.

### Storage DDL

```sql
CREATE TABLE platform_tenant (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('active','suspended','archived')),
  revision INTEGER NOT NULL, config_cid TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX platform_tenant_slug ON platform_tenant(slug);
CREATE TABLE platform_tenant_config (tenant_id TEXT NOT NULL, revision INTEGER NOT NULL, cid TEXT NOT NULL,
  statement TEXT NOT NULL, PRIMARY KEY (tenant_id, revision)) WITHOUT ROWID;
-- vault: LocalSettings is an F15.S02.M03 record of type platform.local_settings whose tenant is its own vaultId
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T01 | unit | PS-125-01.R01, PS-125-01.R02, PS-125-02.R01 | create a tenant with valid input | stored with revision 1, status active, defaults applied, schema classrup.platform.tenant/v1, operatorKeys read from F16 |
| TEST-PS-125-09.T10 | abuse | PS-125-07.R02, PS-125-07.R01, PS-125-01.R03 | capture network traffic during LocalSettings changes and publishing | zero requests contain locale, currency preferences or the vaultId |
| TEST-PS-125-09.T15 | contract | PS-125-09.R02, PS-125-09.R03, PS-125-01.R03 | schema registry validation of Tenant, LocalSettings and events; privacy suite | all payloads valid; LocalSettings (with vaultId) classified P3 and absent from relay and federation payloads |
| TEST-PS-125-09.T17 | integration | PS-125-10.R01, PS-125-10.R02, PS-125-10.R03, PS-125-01.R03 | export vault with LocalSettings, import into fresh vault; restore relay from backup; roll back one release | LocalSettings round-trip while the fresh vault keeps its own vaultId; tenants and statements restored with same IDs; old reader ignores new optional fields |
| TEST-PS-125-09.T18 | integration | PS-125-04.R02, PS-125-01.R04 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies and the full snapshot, existing records untouched, the index intake stub refuses a new projection in the removed currency |
| TEST-PS-125-09.T22 | contract | PS-125-01.R04, PS-125-04.R04 | set maxUploadBytes 3145728, maxEnvelopeBytes 65536, maxIndexedListingsPerPublisher 2, maxCycleLength 3; then try maxUploadBytes 10485760 and maxEnvelopeBytes 1048576 | the media route refuses a 4 MiB upload, the mailbox stub a 70 KiB envelope, the index stub the third listing, the matching stub a 4-cycle; the oversized limits are refused with VALIDATION_FAILED |
| TEST-PS-125-09.T25 | unit | PS-125-01.R03 | initialise vaults V1 and V2, dispatch a vault command in each, try a LocalSettings patch with vaultId | each vault has one immutable UUIDv7 vaultId used as the dispatch context tenantId of its records; the two differ; the patch is refused with VALIDATION_FAILED |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
