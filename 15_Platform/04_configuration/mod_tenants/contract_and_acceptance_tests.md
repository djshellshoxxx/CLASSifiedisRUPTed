# PS-125-09 — Contract and acceptance tests: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-125-09.R02** Contract tests check command inputs, outputs and event payloads against the schema registry for both relay and vault commands.
- **PS-125-09.R03** A privacy test proves LocalSettings never leave the device.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay with F16.S01.M01 role fixtures (admin A1 scope relay, relay_operator R1, operators O1 scope tenant:T1 and O2 scope tenant:T2, member M1), tenants T1 (EUR) and T2 (CHF); stub enforcers for F06.S01.M01, F08.S01.M01, F02.S02.M03 and the F15.S02.M01 media route reading TenantPort; vaults V1 and V2 with local principal L1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T01 | unit | PS-125-01.R01, PS-125-01.R02, PS-125-02.R01 | create a tenant with valid input | stored with revision 1, status active, defaults applied, schema classrup.platform.tenant/v1, operatorKeys read from F16 |
| TEST-PS-125-09.T02 | unit | PS-125-02.R01, PS-125-02.R02, PS-125-02.R03 | each rule V01-V13 violated in turn | documented code returned and nothing stored; a malformed slug gets VALIDATION_FAILED and a used slug PLATFORM_TENANT_SLUG_TAKEN; fields list the offending paths |
| TEST-PS-125-09.T03 | property | PS-125-03.R01, PS-125-03.R02 | random sequences of status commands | only declared transitions occur; archived never changes; archive requires 30 days suspended |
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change, no new statement, no event |
| TEST-PS-125-09.T05 | contract | PS-125-04.R01, PS-125-04.R02, PS-125-04.R03 | all commands and queries on relay and in vault | outputs and the three event payloads validate against registry schemas; only the tenant_config statement is produced |
| TEST-PS-125-09.T06 | abuse | PS-125-05.R01, PS-125-05.R02, PS-125-05.R03 | M1 configures T1; O1 edits T2; relay tries to read LocalSettings | FORBIDDEN or NOT_FOUND; no relay path to LocalSettings |
| TEST-PS-125-09.T07 | integration | PS-125-06.R01, PS-125-06.R02 | replay same Idempotency-Key with same and different body; run bootstrap twice; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; second bootstrap returns existing tenant and assignments; CONFLICT_REVISION |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant shown from the stored signed statement marked stale |
| TEST-PS-125-09.T09 | integration | PS-125-07.R01, PS-125-07.R03 | archive tenant and advance 90 days | purged from relay; operator export exists; audit retained 1 year |
| TEST-PS-125-09.T10 | abuse | PS-125-07.R02, PS-125-07.R01, PS-125-01.R03 | capture network traffic during LocalSettings changes and publishing | zero requests contain locale, currency preferences or the vaultId |
| TEST-PS-125-09.T11 | abuse | PS-125-07.R01, PS-125-07.R02 | O1 adds a key through assign_operator; A1 removes the last operator of T1 | FORBIDDEN and PLATFORM_TENANT_LAST_OPERATOR; the client shows the signed configuration with unchanged operators |
| TEST-PS-125-09.T12 | load | PS-125-08.R02, PS-125-08.R03 | 50 req/s tenant reads and 5 configure per second for 5 minutes | read p95 ≤ 20 ms cached, configure p95 ≤ 300 ms, consumers apply within 2 s |
| TEST-PS-125-09.T13 | unit | PS-125-08.R01 | metrics scrape | counters per CTR-OBS-001 naming, tenant label hashed, no names |
| TEST-PS-125-09.T14 | unit | PS-125-09.R01 | traceability tool run | every PS-125 requirement maps to a passing test |
| TEST-PS-125-09.T15 | contract | PS-125-09.R02, PS-125-09.R03, PS-125-01.R03 | schema registry validation of Tenant, LocalSettings and events; privacy suite | all payloads valid; LocalSettings (with vaultId) classified P3 and absent from relay and federation payloads |
| TEST-PS-125-09.T16 | a11y | PS-125-04.R01 | operator console Community form, relay details sheet and Settings > Preferences scanned with axe | zero serious issues; errors linked via aria-describedby; targets ≥ 44 px |
| TEST-PS-125-09.T17 | integration | PS-125-10.R01, PS-125-10.R02, PS-125-10.R03, PS-125-01.R03 | export vault with LocalSettings, import into fresh vault; restore relay from backup; roll back one release | LocalSettings round-trip while the fresh vault keeps its own vaultId; tenants and statements restored with same IDs; old reader ignores new optional fields |
| TEST-PS-125-09.T18 | integration | PS-125-04.R02, PS-125-01.R04 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies and the full snapshot, existing records untouched, the index intake stub refuses a new projection in the removed currency |
| TEST-PS-125-09.T19 | abuse | PS-125-05.R01, PS-125-05.R02 | tenant operator O1 calls assign_operator, security.roleassignment.assign, platform.relay_identity.rotate, platform.backup.run and platform.deadletter.replay | all FORBIDDEN; R1 (relay_operator) may run the relay-wide ones and still cannot configure T1 |
| TEST-PS-125-09.T20 | abuse | PS-125-05.R01, PS-125-04.R04 | O1 suspends T2; T1 suspended by O1, then M1 writes to T1 and T2 | first FORBIDDEN; member writes to T1 refused by the bus TenantPort stage with PLATFORM_TENANT_SUSPENDED, writes to T2 succeed, reads and exports of T1 succeed, O1 can still configure and resume T1 |
| TEST-PS-125-09.T21 | contract | PS-125-04.R01, PS-125-04.R05 | fetch the signed configuration for revisions 1 and 2; then a relay stub serves V1 and V2 different statements for revision 2 | statements verify under context classrup-tenant-config:v1 with the relay key; V1 stores revision 1 and shows the diff to revision 2; the conflicting statement for one revision raises the equivocation warning |
| TEST-PS-125-09.T22 | contract | PS-125-01.R04, PS-125-04.R04 | set maxUploadBytes 3145728, maxEnvelopeBytes 65536, maxIndexedListingsPerPublisher 2, maxCycleLength 3; then try maxUploadBytes 10485760 and maxEnvelopeBytes 1048576 | the media route refuses a 4 MiB upload, the mailbox stub a 70 KiB envelope, the index stub the third listing, the matching stub a 4-cycle; the oversized limits are refused with VALIDATION_FAILED |
| TEST-PS-125-09.T23 | integration | PS-125-03.R01, PS-125-06.R02 | bootstrap with a RoleBootstrapPort that fails on the admin assignment; then a successful bootstrap | no tenant and no assignment after the failure; afterwards one tenant in active with operator and admin assignments and revision 1 statement in one transaction |
| TEST-PS-125-09.T24 | integration | PS-125-04.R03 | A1 grants O3 operator for T1 directly with security.roleassignment.assign, then revokes it | each change yields a new signed configuration and platform.tenant.configured with changed [operatorKeys] listing, then dropping, O3 |
| TEST-PS-125-09.T25 | unit | PS-125-01.R03 | initialise vaults V1 and V2, dispatch a vault command in each, try a LocalSettings patch with vaultId | each vault has one immutable UUIDv7 vaultId used as the dispatch context tenantId of its records; the two differ; the patch is refused with VALIDATION_FAILED |
| TEST-PS-125-09.T26 | integration | PS-125-07.R04 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for L1 | section platform.local_settings with P3 field classes; deletion removes LocalSettings; nothing purged early; no row remains |
| TEST-PS-125-09.T27 | integration | PS-125-04.R02 | create a tenant with jurisdictionProfile de_eu while a stub F10.S01.M02 consumes only platform.tenant.configured | the stub applies de_eu from the revision 1 configured event without reading the tenant |

## Acceptance criteria

- All tests T01-T27 pass in CI.
- A relay can bootstrap from the CLI and host several tenants with separate currencies, locales and limits, and every limit is enforced by its named module.
- Operator changes are made only through F16 role assignments by admins, are validated, audited and visible to clients as signed configuration; the last operator can never be removed.
- LocalSettings never leave the device, no relay tenant record exists in the vault, and every vault record carries its vault's own vaultId as tenantId.

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
