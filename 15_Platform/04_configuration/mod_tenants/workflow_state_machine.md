# PS-125-03 — Workflow state machine: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-03.R01** A tenant is created directly in active within one transaction that also creates its first operator and admin role assignments through the F16 RoleBootstrapPort and its first signed configuration statement, so no partially provisioned tenant exists, and any transition not listed is refused with CONFLICT_STATE.
- **PS-125-03.R02** Suspension is reversible; archiving is final and is allowed only from suspended to prevent accidents.
- **PS-125-03.R03** Status changes are written with their event and the new signed configuration statement in one transaction.

## Specification

### Tenant lifecycle

Initial **active**; terminal **archived**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| active -> suspended | platform.tenant.change_status by a tenant operator or admin with a reason | bus TenantPort refuses member writes with PLATFORM_TENANT_SUSPENDED; new signed configuration; emits platform.tenant.status_changed |
| suspended -> active | platform.tenant.change_status by a tenant operator or admin | new signed configuration; emits platform.tenant.status_changed |
| suspended -> archived | platform.tenant.change_status by admin after 30 days suspended | read-only export remains for 90 days; tenant role assignments revoked through F16; emits platform.tenant.status_changed |

```mermaid
stateDiagram-v2
  [*] --> active
  active --> suspended: platform.tenant.change_status by a tenant operator or admin with a reason
  suspended --> active: platform.tenant.change_status by a tenant operator or admin
  suspended --> archived: platform.tenant.change_status by admin after 30 days suspended
  archived --> [*]
```

### Timeouts and scheduled transitions

- Archiving requires the tenant to have been suspended for at least 2592000000 ms (30 days); archived tenants are purged from the relay 7776000000 ms (90 days) after archiving.
- Configuration cache TTL 30000 ms in TenantPort, invalidated immediately on change; clients re-fetch the signed configuration at most every 30000 ms.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T03 | property | PS-125-03.R01, PS-125-03.R02 | random sequences of status commands | only declared transitions occur; archived never changes; archive requires 30 days suspended |
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change, no new statement, no event |
| TEST-PS-125-09.T23 | integration | PS-125-03.R01, PS-125-06.R02 | bootstrap with a RoleBootstrapPort that fails on the admin assignment; then a successful bootstrap | no tenant and no assignment after the failure; afterwards one tenant in active with operator and admin assignments and revision 1 statement in one transaction |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
