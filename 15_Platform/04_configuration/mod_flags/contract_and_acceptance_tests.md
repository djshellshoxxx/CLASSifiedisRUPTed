# PS-124-09 — Contract and acceptance tests: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-124-09.R02** The dependency rule is covered by property tests over random registries and settings, running the same code for vault and relay adapters.
- **PS-124-09.R03** Contract tests check command and event payloads against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Registry fixture with 12 modules in 3 features (one core), dependencies A->B->C and D->B; relay with tenants T1 and T2, F16.S01.M01 RoleAssignments O1 operator scope tenant:T1, O2 operator scope tenant:T2, AD1 admin, member M1; vaults V1 and V2 with vaultIds and local principal L1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T01 | unit | PS-124-01.R01, PS-124-01.R03, PS-124-02.R01 | set key on, reset key | one row per (scope, tenant, key); reset removes the row and default applies; settings kept when module is off |
| TEST-PS-124-09.T02 | unit | PS-124-02.R01, PS-124-02.R03 | each rule V01-V10 violated in turn | documented code returned and nothing stored |
| TEST-PS-124-09.T03 | property | PS-124-02.R02, PS-124-03.R01 | random settings and random changes over random acyclic registries | stored state never violates the dependency rule; evaluation never throws; unknown keys evaluate off |
| TEST-PS-124-09.T04 | integration | PS-124-03.R02, PS-124-06.R02 | cascade off of B with A and D on, injected failure on the third write | no key changed; without failure A, D, B off in one transaction with three events |
| TEST-PS-124-09.T05 | unit | PS-124-03.R03, PS-124-08.R02 | write then evaluate in the same process and in a second process | same process sees new value immediately; second within 30 s |
| TEST-PS-124-09.T06 | contract | PS-124-04.R01, PS-124-04.R02 | all four commands and both queries in vault and on relay | outputs and platform.flag.changed payloads validate against registry schemas; vault change emits no relay event and sends no network request; reset rejects scope relay and reset_relay rejects a missing tenantId |
| TEST-PS-124-09.T07 | integration | PS-124-04.R03 | publish platform.tenant.created | evaluation cache for the tenant invalidated, no rows created |
| TEST-PS-124-09.T08 | abuse | PS-124-05.R01, PS-124-05.R02, PS-124-05.R03 | member M1 and O2 (operator of T2) change T1's relay flags; relay tries to change vault flags | FORBIDDEN; no remote path alters vault flags |
| TEST-PS-124-09.T09 | integration | PS-124-06.R01, PS-124-03.R01 | same Idempotency-Key replayed with same and different body on set_relay and reset_relay; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION |
| TEST-PS-124-09.T10 | integration | PS-124-06.R03, PS-124-05.R03 | user turns F13 push and F06 location off, then the settings store becomes unreadable in a new process with and without the mirror row; relay settings unreadable; FUTURE module queried | with the mirror the switched-off modules stay off (source last_committed); without it every switchable non-core module is off (source fail_closed) and 'settings unavailable' is shown; relay commands of affected modules answer DEPENDENCY_UNAVAILABLE; FUTURE module off |
| TEST-PS-124-09.T11 | abuse | PS-124-07.R01, PS-124-07.R03 | capture all network traffic while changing vault flags | zero requests carrying flag values; relay evaluation independent of vault flags |
| TEST-PS-124-09.T12 | abuse | PS-124-07.R02, PS-124-07.R03 | operator turns F15 off and 31 changes in one minute | PLATFORM_FLAG_LOCKED and RATE_LIMITED; audit rows written for relay changes with actor and reason |
| TEST-PS-124-09.T13 | load | PS-124-08.R02, PS-124-08.R03 | 50 req/s evaluations plus 5 changes per second on relay for 5 minutes | eval p95 ≤ 1 ms cached, change p95 ≤ 300 ms, metrics exported |
| TEST-PS-124-09.T14 | unit | PS-124-08.R01 | metrics scrape after mixed outcomes | counters per CTR-OBS-001 naming, no user ids as labels |
| TEST-PS-124-09.T15 | unit | PS-124-09.R01 | traceability tool run | every PS-124 requirement maps to a passing test |
| TEST-PS-124-09.T16 | contract | PS-124-09.R02, PS-124-09.R03 | run dependency-rule suite against vault IndexedDB adapter and relay SQLite adapter | identical results |
| TEST-PS-124-09.T17 | a11y | PS-124-04.R01 | Settings > Features scanned with axe | zero serious issues; toggles have names with dependency summary; dialog focus managed |
| TEST-PS-124-09.T18 | integration | PS-124-10.R01, PS-124-10.R02, PS-124-10.R03 | export vault, import into fresh vault, restore relay from backup, roll back one release | vault flags round-trip with the new vault's tenantId; relay flags restored; older reader ignores new optional fields |
| TEST-PS-124-09.T19 | abuse | PS-124-05.R02, PS-124-04.R01 | member M1, O2 and O1 call platform.flag.reset_relay on T1 for a module whose default is on; L1 calls platform.flag.reset with a relay scope argument | M1 and O2 get FORBIDDEN and the module stays off; O1 succeeds with one audit row; the vault reset refuses the relay scope with VALIDATION_FAILED |
| TEST-PS-124-09.T20 | contract | PS-124-01.R02, PS-124-01.R04, PS-124-07.R04 | set vault flags in V1 and V2, set relay flags for T1; inspect V1 and V2 IndexedDB, the relay database and every request | vault rows only in each vault's IndexedDB with tenantId equal to its own vaultId and P3 classification; no vault row or value in any relay request or relay table; relay rows in SQLite classified P0 |
| TEST-PS-124-09.T21 | integration | PS-124-07.R04, PS-124-04.R03 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for L1 | section platform.flags lists vault-scope settings with field classes; deletion removes every vault-scope row and the mirror; purge removes nothing early; no row remains after the event |

## Acceptance criteria

- All tests T01-T21 pass in CI.
- The dependency rule is never violated in stored or evaluated state for vault or relay scope.
- A disabled module returns FEATURE_DISABLED, stops its consumers and keeps its data, and stays disabled when settings cannot be read.
- No remote party can change a vault's flags, a vault's flags are never transmitted, and only a tenant operator or admin can set or reset relay flags.

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
