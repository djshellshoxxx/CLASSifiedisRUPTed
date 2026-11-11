# PS-125-05 — Authorization and capabilities: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-05.R01** Relay policy applies; operator and admin roles are F16.S01.M01 RoleAssignment records - an operator scoped tenant:<id> manages only that tenant's configuration and status, a relay admin manages the tenant list and operator assignments, relay-wide capabilities (identity, backups, recovery, dead letters) need the distinct relay_operator role, and no role has any effect on a vault or on other relays (CTR-CAP-001 CAP-9).
- **PS-125-05.R02** Operators authenticate with signed requests or relay access tokens obtained by challenge-response; the relay stores no passwords and the tenant record stores no operator list of its own.
- **PS-125-05.R03** Vault policy applies to LocalSettings, so only the unlocked local principal reads or changes them, and no relay can read or write them.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.tenant.create | admin | relay-scope admin RoleAssignment, or local CLI with filesystem access to the relay data directory (bootstrap creates the first assignments through RoleBootstrapPort) |
| platform.tenant.configure | operator, admin | active F16.S01.M01 operator RoleAssignment of scope tenant:<tenantId>, or admin; tenant status active or suspended |
| platform.tenant.assign_operator | admin | relay-scope admin; delegates to security.roleassignment.assign and revoke with expiry ≤ 365 days; last operator cannot be removed; tenant operators cannot add operators |
| platform.tenant.change_status | operator, admin | tenant operator of scope tenant:<tenantId> may suspend and resume; archive needs admin and 30 days suspended |
| platform.tenant.read_public | anonymous, member, moderator, operator, relay_operator, admin | none; returns the relay-signed configuration statement |
| platform.tenant.list | admin | relay-scope admin RoleAssignment |
| platform.local_settings.update | local-principal | vault unlocked |
| platform.local_settings.read | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T06 | abuse | PS-125-05.R01, PS-125-05.R02, PS-125-05.R03 | M1 configures T1; O1 edits T2; relay tries to read LocalSettings | FORBIDDEN or NOT_FOUND; no relay path to LocalSettings |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant shown from the stored signed statement marked stale |
| TEST-PS-125-09.T19 | abuse | PS-125-05.R01, PS-125-05.R02 | tenant operator O1 calls assign_operator, security.roleassignment.assign, platform.relay_identity.rotate, platform.backup.run and platform.deadletter.replay | all FORBIDDEN; R1 (relay_operator) may run the relay-wide ones and still cannot configure T1 |
| TEST-PS-125-09.T20 | abuse | PS-125-05.R01, PS-125-04.R04 | O1 suspends T2; T1 suspended by O1, then M1 writes to T1 and T2 | first FORBIDDEN; member writes to T1 refused by the bus TenantPort stage with PLATFORM_TENANT_SUSPENDED, writes to T2 succeed, reads and exports of T1 succeed, O1 can still configure and resume T1 |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
