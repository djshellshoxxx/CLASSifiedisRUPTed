# PS-124-02 — Validation rules: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-02.R01** Every write is validated against the registry, the dependency rule, the lock list and role names before any change.
- **PS-124-02.R02** Evaluation never throws; unknown keys evaluate to off and are logged locally.
- **PS-124-02.R03** Each violation maps to one stable error code with params that list the modules involved.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | key exists in the registry and its scope is MVP for on or beta | VALIDATION_FAILED |
| V02 | value is off, on or beta; beta has 1..5 distinct known roles | VALIDATION_FAILED |
| V03 | on or beta requires all depends_on modules effectively on (beta requires on or beta with a superset of roles) | PLATFORM_FLAG_DEPENDENCY |
| V04 | off or reset of a key with effectively-on dependents requires cascade true | PLATFORM_FLAG_DEPENDENCY |
| V05 | key is not under core features F15 or F16 when value is off | PLATFORM_FLAG_LOCKED |
| V06 | expectedRevision equals the stored revision when the setting exists | CONFLICT_REVISION |
| V07 | reason is at most 200 chars and a reason is present when value is off or beta | VALIDATION_FAILED |
| V08 | at most 30 flag changes per minute per actor | RATE_LIMITED |
| V09 | a relay-scope set or reset is made by a key holding an active F16.S01.M01 RoleAssignment of role operator for scope tenant:<tenantId>, or admin, on this relay | FORBIDDEN |
| V10 | platform.flag.reset_relay and platform.flag.set_relay carry tenantId of an existing relay tenant and an Idempotency-Key; platform.flag.set and platform.flag.reset act only on the vault scope of the dispatch context | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T01 | unit | PS-124-01.R01, PS-124-01.R03, PS-124-02.R01 | set key on, reset key | one row per (scope, tenant, key); reset removes the row and default applies; settings kept when module is off |
| TEST-PS-124-09.T02 | unit | PS-124-02.R01, PS-124-02.R03 | each rule V01-V10 violated in turn | documented code returned and nothing stored |
| TEST-PS-124-09.T03 | property | PS-124-02.R02, PS-124-03.R01 | random settings and random changes over random acyclic registries | stored state never violates the dependency rule; evaluation never throws; unknown keys evaluate off |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
