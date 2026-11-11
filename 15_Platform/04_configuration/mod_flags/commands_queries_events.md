# PS-124-04 — Commands, queries and events: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-04.R01** The module has two vault-local commands (set and reset, vault scope only) and two relay commands (set_relay and reset_relay, relay scope only, each with tenantId and Idempotency-Key), plus queries for evaluation and listing, all with the signatures below.
- **PS-124-04.R02** A vault-local change produces no signed statement and never leaves the device; a relay change is a relay command that emits a relay-local event.
- **PS-124-04.R03** The module consumes platform.tenant.created to prepare evaluation for a new community, and privacy.deletion.completed to confirm that the deleted principal's vault-scope settings are gone (N6).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.flag.set` | platform.flag.set | { key, value: off\|on\|beta, betaRoles?, cascade?: boolean, reason?, expectedRevision? } — vault-local command, actor is the unlocked local principal, scope vault, tenantId from the dispatch context (vaultId) | { changed: [{ key, previous, value, revision }] } | VALIDATION_FAILED, PLATFORM_FLAG_DEPENDENCY, PLATFORM_FLAG_LOCKED, CONFLICT_REVISION, RATE_LIMITED | platform.flag.changed | yes (Idempotency-Key) |
| `platform.flag.set_relay` | platform.flag.set_relay | { tenantId, key, value: off\|on\|beta, betaRoles?, cascade?: boolean, reason, expectedRevision? } — relay command with Idempotency-Key, signed by a key holding the tenant operator or admin role | { changed: [{ key, previous, value, revision }] } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, PLATFORM_FLAG_DEPENDENCY, PLATFORM_FLAG_LOCKED, CONFLICT_REVISION, RATE_LIMITED | platform.flag.changed | yes (Idempotency-Key) |
| `platform.flag.reset` | platform.flag.set | { key, cascade?, expectedRevision } — vault-local command, scope vault only; removes the setting so the registry default applies | { changed: [{ key, previous, value, revision }] } | NOT_FOUND, VALIDATION_FAILED, PLATFORM_FLAG_DEPENDENCY, PLATFORM_FLAG_LOCKED, CONFLICT_REVISION | platform.flag.changed | yes (Idempotency-Key) |
| `platform.flag.reset_relay` | platform.flag.set_relay | { tenantId, key, cascade?, expectedRevision, reason } — relay command with Idempotency-Key, scope relay only, signed by a key holding the tenant operator or admin role (V09); removes the setting so the registry default applies | { changed: [{ key, previous, value, revision }] } | FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, PLATFORM_FLAG_DEPENDENCY, PLATFORM_FLAG_LOCKED, CONFLICT_REVISION, RATE_LIMITED | platform.flag.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.flag.evaluate` | platform.flag.read_effective | { scope: vault\|relay, tenantId?, keys?: id[] (default all), roles?: string[] } — vault-local query or relay query; roles default to the caller's roles | { values: { [key]: on\|off }, cachedUntil, registryHash, source: committed\|last_committed\|fail_closed } | NOT_FOUND |
| `platform.flag.list` | platform.flag.read_settings | { scope: vault\|relay, tenantId?, cursor?, limit ≤ 200 } — vault-local query or relay query (tenant operator or admin) | { items: [{ key, value, betaRoles?, effective, blockedBy?: id[], revision, reason? }], nextCursor? } | FORBIDDEN, NOT_FOUND, DEPENDENCY_UNAVAILABLE |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.flag.changed` | P1 | { scope, tenantId, key, previous, value, betaRoles?, cascadeOf?, changedBy, changedAt, revision } |

### Events consumed

| Type | Effect |
|---|---|
| `platform.tenant.created` | invalidate the evaluation cache for the new tenant; no rows are created because defaults come from the registry |
| `privacy.deletion.completed` | confirm that the DeletionPort removed every vault-scope FlagSetting and mirror row of the deleted principal's vault; flag settings hold no evidence, so nothing is pseudonymized |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_FLAG_DEPENDENCY | 422 | no | the change violates the module dependency rule; params list blocking or dependent modules |
| PLATFORM_FLAG_LOCKED | 422 | no | core feature cannot be switched off |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
platform.flag.set({ key: "F04.S01.M01", value: "on", reason: "enable auctions" })
-> 422 { "code": "PLATFORM_FLAG_DEPENDENCY", "params": { "blockedBy": ["F09.S03.M01"] } }
platform.flag.set_relay({ tenantId: "0192f3a4-…", key: "F04", value: "beta", betaRoles: ["operator"], reason: "operator-only trial" })
-> 200 { "changed": [ { "key": "F04", "previous": "off", "value": "beta", "revision": 2 } ] }
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000011
platform.flag.reset_relay({ tenantId: "0192f3a4-…", key: "F04", expectedRevision: 2, reason: "end of trial" })   (member key)
-> 403 { "code": "FORBIDDEN" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T06 | contract | PS-124-04.R01, PS-124-04.R02 | all four commands and both queries in vault and on relay | outputs and platform.flag.changed payloads validate against registry schemas; vault change emits no relay event and sends no network request; reset rejects scope relay and reset_relay rejects a missing tenantId |
| TEST-PS-124-09.T07 | integration | PS-124-04.R03 | publish platform.tenant.created | evaluation cache for the tenant invalidated, no rows created |
| TEST-PS-124-09.T17 | a11y | PS-124-04.R01 | Settings > Features scanned with axe | zero serious issues; toggles have names with dependency summary; dialog focus managed |
| TEST-PS-124-09.T19 | abuse | PS-124-05.R02, PS-124-04.R01 | member M1, O2 and O1 call platform.flag.reset_relay on T1 for a module whose default is on; L1 calls platform.flag.reset with a relay scope argument | M1 and O2 get FORBIDDEN and the module stays off; O1 succeeds with one audit row; the vault reset refuses the relay scope with VALIDATION_FAILED |
| TEST-PS-124-09.T21 | integration | PS-124-07.R04, PS-124-04.R03 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for L1 | section platform.flags lists vault-scope settings with field classes; deletion removes every vault-scope row and the mirror; purge removes nothing early; no row remains after the event |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
