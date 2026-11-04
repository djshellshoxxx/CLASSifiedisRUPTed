# PS-125-04 — Commands, queries and events: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-04.R01** Tenant commands are relay commands with Idempotency-Key; LocalSettings commands are vault-local; no command produces a signed statement.
- **PS-125-04.R02** Every tenant command emits its events in the same transaction as the state change, and payloads carry only changed fields and IDs.
- **PS-125-04.R03** The module consumes no events from other modules.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.tenant.create` | platform.tenant.create | { slug, displayName, allowedCurrencies, jurisdictionProfile?, defaultLocale?, limits?, operatorKeys } — relay command, admin or local CLI bootstrap | { tenantId, revision: 1, status: active } | FORBIDDEN, VALIDATION_FAILED, PLATFORM_TENANT_SLUG_TAKEN, PLATFORM_TENANT_LIMIT | platform.tenant.created | yes (Idempotency-Key) |
| `platform.tenant.configure` | platform.tenant.configure | { tenantId, expectedRevision, patch: { displayName?, allowedCurrencies?, jurisdictionProfile?, defaultLocale?, limits? } } — relay command, operator | { tenantId, revision, changed: string[] } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION, PLATFORM_TENANT_SUSPENDED | platform.tenant.configured | yes (Idempotency-Key) |
| `platform.tenant.assign_operator` | platform.tenant.assign_operator | { tenantId, expectedRevision, add?: did[], remove?: did[] } — relay command, admin or an existing operator adding keys; removal needs admin | { tenantId, revision, operatorKeys } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION, PLATFORM_TENANT_LAST_OPERATOR, PLATFORM_TENANT_SUSPENDED | platform.tenant.configured | yes (Idempotency-Key) |
| `platform.tenant.change_status` | platform.tenant.change_status | { tenantId, expectedRevision, status: active\|suspended\|archived, reason? } — relay command, operator (suspend, resume) or admin (archive) | { tenantId, revision, status } | FORBIDDEN, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | platform.tenant.status_changed | yes (Idempotency-Key) |
| `platform.local_settings.update` | platform.local_settings.update | { expectedRevision?, patch: { defaultLocale?, preferredCurrencies?, localLimits? } } — vault-local command, actor is the unlocked local principal | { revision } | VALIDATION_FAILED, CONFLICT_REVISION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.tenant.get` | platform.tenant.read_public | { tenantId? \| slug? } — relay query, public; defaults to the relay's only tenant | { id, slug, displayName, status, allowedCurrencies, jurisdictionProfile, defaultLocale, limits, revision } (operator keys included only for operators) | NOT_FOUND |
| `platform.tenant.list` | platform.tenant.list | { status?, cursor?, limit ≤ 50 } — relay query, admin | { items: Tenant[], nextCursor? } | FORBIDDEN |
| `platform.local_settings.get` | platform.local_settings.read | { } (no input) — vault-local query | { defaultLocale, preferredCurrencies, localLimits, revision } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.tenant.created` | P0 | { tenantId, slug, allowedCurrencies, defaultLocale, jurisdictionProfile, operatorKeys } |
| `platform.tenant.configured` | P0 | { tenantId, changed: string[], allowedCurrencies?, removedCurrencies?, defaultLocale?, jurisdictionProfile?, limits?, operatorKeys?, revision } |
| `platform.tenant.status_changed` | P0 | { tenantId, from, to, reason?, revision } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_TENANT_SLUG_TAKEN | 409 | no | a tenant with this slug already exists on this relay |
| PLATFORM_TENANT_LAST_OPERATOR | 409 | no | the change would leave the tenant with no operator key |
| PLATFORM_TENANT_SUSPENDED | 403 | no | tenant is suspended or archived on this relay; writes are refused |
| PLATFORM_TENANT_LIMIT | 409 | no | the relay already hosts the maximum of 50 tenants |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
$ relay tenant bootstrap --slug oldtown --name "Old Town Swap" --currencies EUR --locale de --operator did:key:z6Mk...
POST /api/v1/cmd/platform.tenant.configure
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000021
{ "tenantId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 1, "patch": { "allowedCurrencies": ["EUR", "CHF"], "limits": { "maxUploadBytes": 3145728 } } }
200 { "tenantId": "0192f3a4-…", "revision": 2, "changed": ["allowedCurrencies", "limits"] }
event platform.tenant.configured { "tenantId": "0192f3a4-…", "changed": ["allowedCurrencies","limits"], "allowedCurrencies": ["EUR","CHF"], "removedCurrencies": [], "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change visible, no event |
| TEST-PS-125-09.T05 | contract | PS-125-04.R01, PS-125-04.R02, PS-125-04.R03 | all commands and queries on relay and in vault | outputs and the three event payloads validate against registry schemas; no signed statement produced |
| TEST-PS-125-09.T16 | a11y | PS-125-04.R01 | operator console Community form and Settings > Preferences scanned with axe | zero serious issues; errors linked via aria-describedby; targets ≥ 44 px |
| TEST-PS-125-09.T18 | integration | PS-125-04.R03, PS-125-01.R03 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies, existing records untouched, new records in removed currency refused by consumers |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
