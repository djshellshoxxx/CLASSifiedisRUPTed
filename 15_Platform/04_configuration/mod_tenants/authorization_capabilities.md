# PS-125-05 — Authorization and capabilities: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-05.R01** Relay policy applies, so tenant operators manage only their tenant, relay admins manage the tenant list, and neither role has any effect on a vault or on other relays (CTR-CAP-001 CAP-9).
- **PS-125-05.R02** Operators are identified by device keys in the tenant record and authenticate with signed requests or relay access tokens obtained by challenge-response; the relay stores no passwords.
- **PS-125-05.R03** Vault policy applies to LocalSettings, so only the unlocked local principal reads or changes them, and no relay can read or write them.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.tenant.create | admin | relay admin device key, or local CLI with filesystem access to the relay data directory (bootstrap) |
| platform.tenant.configure | operator, admin | key in tenant.operatorKeys; tenant status active |
| platform.tenant.assign_operator | operator, admin | key in tenant.operatorKeys may add; removal needs admin; last operator cannot be removed |
| platform.tenant.change_status | operator, admin | operator may suspend and resume; archive needs admin and 30 days suspended |
| platform.tenant.read_public | anonymous, member, moderator, operator, admin | none; operator keys shown only to operators |
| platform.tenant.list | admin | relay admin device key |
| platform.local_settings.update | local-principal | vault unlocked |
| platform.local_settings.read | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T06 | abuse | PS-125-05.R01, PS-125-05.R02, PS-125-05.R03 | non-operator configures; operator of T1 edits T2; relay tries to read LocalSettings | FORBIDDEN or NOT_FOUND; no relay path to LocalSettings |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant read shows cached configuration marked stale |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
