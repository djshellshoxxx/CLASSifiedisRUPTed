# PS-125-04 — Commands, queries and events: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-04.R01** Tenant commands are relay commands with Idempotency-Key; LocalSettings commands are vault-local; every tenant revision produces one relay-signed classrup.platform.tenant_config/v1 statement, signed through F15.S02.M01 under context classrup-tenant-config:v1 with signer role relay_identity and registered with F11.S01.M01 (N2).
- **PS-125-04.R02** Every tenant command emits its events in the same transaction as the state change, and platform.tenant.configured carries the full configuration snapshot (it is also emitted at creation and on operator changes), so consumers such as F10.S01.M02 never need to read the tenant.
- **PS-125-04.R03** The module consumes security.role.assigned and security.role.revoked for tenant-scoped roles to re-issue the configuration with the derived operator keys, and privacy.deletion.completed for LocalSettings.
- **PS-125-04.R04** TenantPort is registered with the F15.S02.M02 bus as a stage after authentication that returns PLATFORM_TENANT_SUSPENDED for writes to a suspended or archived tenant, and with the F15.S02.M01 relay process; it offers limits(tenantId) to the enforcers named per limit (F06.S01.M01, F06.S02.M03, F11.S01.M02, F08.S01.M01, F02.S02.M03 depend on this module; the bus, the relay process and the vault blob store receive it by inverted registration because they are upstream of it).
- **PS-125-04.R05** The vault keeps the last verified configuration statement per selected relay in LocalSettings.knownRelayConfigs and shows what changed; two different statements for one (tenantId, revision) are proof of equivocation and shown as a warning.
- **PS-125-04.R06** Every classrup.platform.tenant_config/v1 statement carries jurisdictionProfile as ProfileRef {publisherId?, code} and the derived operatorKeys; the vault registers an operatorKeys resolver with F11.S01.M01 at composition (inverted registration, no depends_on edge) that answers operatorKeys(relayId) from the verified statement in LocalSettings.knownRelayConfigs and answers none when the vault holds no verified statement for that relay, so F18.S02.M02 transparency drafts and reports resolve the relay operator role only from a relay-signed operator list.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.tenant.create` | platform.tenant.create | { slug, displayName, allowedCurrencies, jurisdictionProfile?: ProfileRef { publisherId?, code } (default { code: generic }), defaultLocale?, limits?, operatorKeys (1..10), adminKey? (local CLI bootstrap only), breakGlassReason? (local CLI only, 20..500 code points) } — relay command, admin over HTTP (no adminKey) or local CLI bootstrap; first assignments created through F16 RoleBootstrapPort.bootstrap({ adminKey?, operatorKeys, tenantId, breakGlassReason?, osUser }) in the same transaction | { tenantId, revision: 1, status: active, configStatementCid, roleAssignmentIds } | FORBIDDEN, VALIDATION_FAILED, PLATFORM_TENANT_SLUG_TAKEN, PLATFORM_TENANT_LIMIT, SECURITY_BOOTSTRAP_REFUSED | platform.tenant.created, platform.tenant.configured | yes (Idempotency-Key) |
| `platform.tenant.configure` | platform.tenant.configure | { tenantId, expectedRevision, patch: { displayName?, allowedCurrencies?, jurisdictionProfile?: ProfileRef { publisherId?, code }, defaultLocale?, limits? } } — relay command, tenant operator or admin | { tenantId, revision, changed: string[], configStatementCid } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION, PLATFORM_TENANT_SUSPENDED | platform.tenant.configured | yes (Idempotency-Key) |
| `platform.tenant.assign_operator` | platform.tenant.assign_operator | { tenantId, expectedRevision, add?: [{ key: did:key, expiresInMs ≤ 31536000000 }], remove?: roleAssignmentId[] } — relay command, admin only; calls security.roleassignment.assign and revoke (F16.S01.M01) with role operator and scope tenant:<tenantId> in the same transaction; never grants an admin role (admin grants are security.roleassignment.propose and approve) | { tenantId, revision, operatorKeys (derived), roleAssignmentIds, configStatementCid } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, CONFLICT_REVISION, PLATFORM_TENANT_LAST_OPERATOR, PLATFORM_TENANT_SUSPENDED | platform.tenant.configured | yes (Idempotency-Key) |
| `platform.tenant.change_status` | platform.tenant.change_status | { tenantId, expectedRevision, status: active\|suspended\|archived, reason? } — relay command, tenant operator (suspend, resume) or admin (archive) | { tenantId, revision, status, configStatementCid } | FORBIDDEN, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | platform.tenant.status_changed | yes (Idempotency-Key) |
| `platform.local_settings.update` | platform.local_settings.update | { expectedRevision?, patch: { defaultLocale?, preferredCurrencies?, localLimits?, a11yMotion?: system\|reduced, moneyDisplay?: symbol\|code\|name } } — vault-local command, actor is the unlocked local principal | { revision } | VALIDATION_FAILED, CONFLICT_REVISION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.tenant.get` | platform.tenant.read_public | { tenantId? \| slug?, revision? } — relay query, public; defaults to the relay's only tenant and the current revision | { statement: classrup.platform.tenant_config/v1 { relayId, tenantId, slug, displayName, revision, status, suspendedReason?, allowedCurrencies, jurisdictionProfile: ProfileRef { publisherId?, code }, defaultLocale, limits, operatorKeys (derived did:key[], verified by F18.S02.M02 receivers), issuedAt, keyId, sig } } | NOT_FOUND |
| `platform.tenant.list` | platform.tenant.list | { status?, cursor?, limit ≤ 50 } — relay query, admin | { items: Tenant[], nextCursor? } | FORBIDDEN |
| `platform.local_settings.get` | platform.local_settings.read | { } (no input) — vault-local query | { vaultId, defaultLocale, preferredCurrencies, localLimits, a11yMotion (default system), moneyDisplay (default symbol), knownRelayConfigs?, revision } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.tenant.created` | P0 | { tenantId, slug, revision, allowedCurrencies, defaultLocale, jurisdictionProfile: ProfileRef { publisherId?, code }, limits, operatorKeys, configStatementCid } |
| `platform.tenant.configured` | P0 | { tenantId, revision, changed: string[], status, allowedCurrencies, removedCurrencies, jurisdictionProfile: ProfileRef { publisherId?, code }, defaultLocale, limits, operatorKeys, configStatementCid } (full snapshot on every revision, including revision 1 at creation) |
| `platform.tenant.status_changed` | P0 | { tenantId, from, to, reason?, revision, configStatementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `security.role.assigned` | when the assignment's scope is tenant:<id> with role operator, re-issue that tenant's signed configuration with the derived operatorKeys and emit platform.tenant.configured with changed [operatorKeys] |
| `security.role.revoked` | when the revoked assignment's scope is tenant:<id> with role operator, re-issue that tenant's signed configuration and emit platform.tenant.configured with changed [operatorKeys] |
| `privacy.deletion.completed` | confirm that the DeletionPort removed the deleted principal's LocalSettings (vault erase); LocalSettings hold no evidence, so nothing is pseudonymized |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_TENANT_SLUG_TAKEN | 409 | no | a tenant with this slug already exists on this relay |
| PLATFORM_TENANT_LAST_OPERATOR | 409 | no | the change would leave the tenant with no active operator assignment |
| PLATFORM_TENANT_SUSPENDED | 403 | no | tenant is suspended or archived on this relay; writes are refused |
| PLATFORM_TENANT_LIMIT | 409 | no | the relay already hosts the maximum of 50 tenants |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
$ relay tenant bootstrap --slug oldtown --name "Old Town Swap" --currencies EUR --locale de --operator did:key:z6MkOp... --admin did:key:z6MkAd...
-> RoleBootstrapPort.bootstrap({ adminKey: "did:key:z6MkAd...", operatorKeys: ["did:key:z6MkOp..."], tenantId: "0192f3a4-…", osUser: "classrup" })
-> tenant created (revision 1), RoleAssignments operator scope tenant:0192f3a4-… and admin scope relay created in the same transaction
$ relay tenant bootstrap --slug riverside ... --admin did:key:z6MkAd2...   (an admin already exists)
-> SECURITY_BOOTSTRAP_REFUSED; nothing created (add --break-glass --reason "<20..500 code points>" only after a confirmed admin compromise)
vault: platform.local_settings.update { "patch": { "a11yMotion": "reduced", "moneyDisplay": "code" } } -> { "revision": 4 }
POST /api/v1/cmd/platform.tenant.configure
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000021
{ "tenantId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 1, "patch": { "allowedCurrencies": ["EUR", "CHF"], "limits": { "maxUploadBytes": 3145728 } } }
200 { "tenantId": "0192f3a4-…", "revision": 2, "changed": ["allowedCurrencies", "limits"], "configStatementCid": "sha256-Tc2..." }
event platform.tenant.configured { "tenantId": "0192f3a4-…", "revision": 2, "changed": ["allowedCurrencies","limits"], "status": "active",
  "allowedCurrencies": ["EUR","CHF"], "removedCurrencies": [], "jurisdictionProfile": { "code": "generic" }, "defaultLocale": "de", "limits": { … }, "operatorKeys": ["did:key:z6MkOp..."] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change, no new statement, no event |
| TEST-PS-125-09.T05 | contract | PS-125-04.R01, PS-125-04.R02, PS-125-04.R03 | all commands and queries on relay and in vault | outputs and the three event payloads validate against registry schemas; only the tenant_config statement is produced |
| TEST-PS-125-09.T16 | a11y | PS-125-04.R01 | operator console Community form, relay details sheet and Settings > Preferences scanned with axe | zero serious issues; errors linked via aria-describedby; targets ≥ 44 px |
| TEST-PS-125-09.T18 | integration | PS-125-04.R02, PS-125-01.R04 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies and the full snapshot, existing records untouched, the index intake stub refuses a new projection in the removed currency |
| TEST-PS-125-09.T20 | abuse | PS-125-05.R01, PS-125-04.R04 | O1 suspends T2; T1 suspended by O1, then M1 writes to T1 and T2 | first FORBIDDEN; member writes to T1 refused by the bus TenantPort stage with PLATFORM_TENANT_SUSPENDED, writes to T2 succeed, reads and exports of T1 succeed, O1 can still configure and resume T1 |
| TEST-PS-125-09.T21 | contract | PS-125-04.R01, PS-125-04.R05 | fetch the signed configuration for revisions 1 and 2; then a relay stub serves V1 and V2 different statements for revision 2 | statements verify under context classrup-tenant-config:v1 with the relay key; V1 stores revision 1 and shows the diff to revision 2; the conflicting statement for one revision raises the equivocation warning |
| TEST-PS-125-09.T22 | contract | PS-125-01.R04, PS-125-04.R04 | set maxUploadBytes 3145728, maxEnvelopeBytes 65536, maxIndexedListingsPerPublisher 2, maxCycleLength 3; then try maxUploadBytes 10485760 and maxEnvelopeBytes 1048576 | the media route refuses a 4 MiB upload, the mailbox stub a 70 KiB envelope, the index stub the third listing, the matching stub a 4-cycle; the oversized limits are refused with VALIDATION_FAILED |
| TEST-PS-125-09.T24 | integration | PS-125-04.R03 | A1 grants O3 operator for T1 directly with security.roleassignment.assign, then revokes it | each change yields a new signed configuration and platform.tenant.configured with changed [operatorKeys] listing, then dropping, O3 |
| TEST-PS-125-09.T27 | integration | PS-125-04.R02 | create a tenant with jurisdictionProfile { code: de_eu } while a stub F10.S01.M02 consumes only platform.tenant.configured | the stub applies the ProfileRef { code: de_eu } from the revision 1 configured event without reading the tenant |
| TEST-PS-125-09.T28 | contract | PS-125-01.R05, PS-125-04.R04 | default discovery settings; then anonymousAllowed false, anonymousMinRadiusKm 50 and maxDepth 200; then anonymousMinRadiusKm 10, anonymousCenterLevel L2 and maxDepth 501 | the signed configuration and limits(tenantId) give true, 25, L1, 500 and then the new values to an F06.S02.M03 stub, which refuses anonymous callers, a 25 km anonymous radius and depth 201; the three invalid values are refused with VALIDATION_FAILED |
| TEST-PS-125-09.T31 | contract | PS-125-01.R07, PS-125-02.R01, PS-125-04.R01 | create T1 without jurisdictionProfile, configure { code: eu_de }, then { publisherId: did:key KP, code: eu_de }; then a plain string eu_de, { code: EU }, { publisherId: notakey, code: eu_de } and { code: eu_de, version: 2 } | defaults to { code: generic } and the F18.S01.M01 resolve stub returns the bundled generic profile; both valid references are stored, signed in tenant_config and carried in platform.tenant.configured unchanged; the four invalid values are refused with VALIDATION_FAILED and their field paths |
| TEST-PS-125-09.T32 | integration | PS-125-04.R06, PS-125-01.R07 | V1 stores the verified tenant_config of relay R listing O1 and O2; the F18.S02.M02 receive stub checks a report compiled by O1 and reviewed by O2, one reviewed by X, and one for a relay V1 holds no statement for; A1 revokes O2, V1 re-fetches and the O1-O2 report is checked again | the resolver returns [O1, O2], roleFor accepts the first report and resolves no role for X or for the unknown relay; after the revocation the resolver returns [O1] from the new verified statement and the reviewer role of O2 is no longer resolved |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
