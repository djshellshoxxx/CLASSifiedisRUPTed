# PS-125-09 — Contract and acceptance tests: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-125-09.R02** Contract tests check command inputs, outputs and event payloads against the schema registry for both relay and vault commands.
- **PS-125-09.R03** A privacy test proves LocalSettings never leave the device.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay with admin A1, operators O1 and O2 (did:key), tenants T1 (EUR) and T2 (CHF); vault with local principal L1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T01 | unit | PS-125-01.R01, PS-125-01.R02, PS-125-02.R01 | create a tenant with valid input | stored with revision 1, status active, defaults applied, schema classrup.platform.tenant/v1 |
| TEST-PS-125-09.T02 | unit | PS-125-02.R01, PS-125-02.R02, PS-125-02.R03 | each rule V01-V10 violated in turn | documented code returned and nothing stored; fields list the offending paths |
| TEST-PS-125-09.T03 | property | PS-125-03.R01, PS-125-03.R02 | random sequences of status commands | only declared transitions occur; archived never changes; archive requires 30 days suspended |
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change visible, no event |
| TEST-PS-125-09.T05 | contract | PS-125-04.R01, PS-125-04.R02, PS-125-04.R03 | all commands and queries on relay and in vault | outputs and the three event payloads validate against registry schemas; no signed statement produced |
| TEST-PS-125-09.T06 | abuse | PS-125-05.R01, PS-125-05.R02, PS-125-05.R03 | non-operator configures; operator of T1 edits T2; relay tries to read LocalSettings | FORBIDDEN or NOT_FOUND; no relay path to LocalSettings |
| TEST-PS-125-09.T07 | integration | PS-125-06.R01, PS-125-06.R02 | replay same Idempotency-Key with same and different body; run bootstrap twice; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; second bootstrap returns existing tenant; CONFLICT_REVISION |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant read shows cached configuration marked stale |
| TEST-PS-125-09.T09 | integration | PS-125-07.R01, PS-125-07.R03 | archive tenant and advance 90 days | purged from relay; operator export exists; audit retained 1 year |
| TEST-PS-125-09.T10 | abuse | PS-125-07.R02, PS-125-07.R01 | capture network traffic during LocalSettings changes and publishing | zero requests contain locale or currency preferences |
| TEST-PS-125-09.T11 | abuse | PS-125-07.R01, PS-125-07.R02 | add a malicious operator key without existing operator signature; remove the last operator | FORBIDDEN and PLATFORM_TENANT_LAST_OPERATOR; events displayed in client |
| TEST-PS-125-09.T12 | load | PS-125-08.R02, PS-125-08.R03 | 50 req/s tenant reads and 5 configure per second for 5 minutes | read p95 ≤ 20 ms cached, configure p95 ≤ 300 ms, consumers apply within 2 s |
| TEST-PS-125-09.T13 | unit | PS-125-08.R01 | metrics scrape | counters per CTR-OBS-001 naming, tenant label hashed, no names |
| TEST-PS-125-09.T14 | unit | PS-125-09.R01 | traceability tool run | every PS-125 requirement maps to a passing test |
| TEST-PS-125-09.T15 | contract | PS-125-09.R02, PS-125-09.R03 | schema registry validation of Tenant, LocalSettings and events; privacy suite | all payloads valid; LocalSettings absent from relay and federation payloads |
| TEST-PS-125-09.T16 | a11y | PS-125-04.R01 | operator console Community form and Settings > Preferences scanned with axe | zero serious issues; errors linked via aria-describedby; targets ≥ 44 px |
| TEST-PS-125-09.T17 | integration | PS-125-10.R01, PS-125-10.R02, PS-125-10.R03 | export vault with LocalSettings, import into fresh vault; restore relay from backup; roll back one release | LocalSettings round-trip; tenants restored with same IDs; old reader ignores new optional fields |
| TEST-PS-125-09.T18 | integration | PS-125-04.R03, PS-125-01.R03 | shrink allowedCurrencies with existing records in a removed currency | change accepted, event carries removedCurrencies, existing records untouched, new records in removed currency refused by consumers |

## Acceptance criteria

- All tests T01-T18 pass in CI.
- A relay can bootstrap from the CLI and host several tenants with separate currencies, locales and limits.
- Operator changes are validated, audited and visible to clients; the last operator can never be removed.
- LocalSettings never leave the device and no tenant concept exists in the vault.

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
