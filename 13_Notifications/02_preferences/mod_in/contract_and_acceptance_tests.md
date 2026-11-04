# PS-106-09 — Contract and acceptance tests: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-106-09.R02** Contract tests check commands, mirror statements and event payloads against the schema registry.
- **PS-106-09.R03** The default matrix is verified against a golden table.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U with default matrix version 1, relay R holding push consent for U, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01 | create a new vault and read the matrix | 7 records equal the golden default table; security inApp true and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V07 violated in turn including security in-app off | documented error code returned and nothing changed |
| TEST-PS-106-09.T03 | unit | PS-106-03.R01, PS-106-03.R02 | edit cells across categories and channels | edits in place with revision increments; no cell deleted; security lock held |
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged in order, never ahead |
| TEST-PS-106-09.T05 | contract | PS-106-04.R01, PS-106-04.R02, PS-106-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-106-09.T06 | integration | PS-106-04.R03 | channel opted in and opted out events delivered | channel shown active or inactive; relay snapshot sent on opt-in |
| TEST-PS-106-09.T07 | abuse | PS-106-05.R01, PS-106-05.R02, PS-106-05.R03 | forged mirror from another key; mirror without relay consent; third party read | rejected; operator cannot read in-app column |
| TEST-PS-106-09.T08 | integration | PS-106-06.R02, PS-106-06.R03 | replay mirror seq 5 after seq 7; two devices edit different cells | stale replay ignored; merged cells preserved |
| TEST-PS-106-09.T09 | abuse | PS-106-07.R01, PS-106-07.R02, PS-106-07.R03 | inspect mirror statement and relay storage; app update with a new category | only 7 booleans per channel present; user choices preserved |
| TEST-PS-106-09.T10 | abuse | PS-106-07.R03, PS-106-02.R03 | 61st edit in an hour | RATE_LIMITED |
| TEST-PS-106-09.T11 | load | PS-106-08.R01, PS-106-08.R02, PS-106-08.R03 | 50 mirror per second for 2 minutes and 100 000 resolve calls | budgets met |
| TEST-PS-106-09.T12 | unit | PS-106-09.R01, PS-106-09.R03 | traceability tool run | every PS-106 requirement maps to a passing test |
| TEST-PS-106-09.T13 | integration | PS-106-10.R01, PS-106-10.R02, PS-106-10.R03 | export, import into fresh vault, restore relay from backup | matrix round trips; unknown categories kept with defaults |
| TEST-PS-106-09.T14 | a11y | PS-106-04.R01 | matrix with screen reader and keyboard | table semantics, locked switch explained, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- The security category in-app flag can never be false through any command, import or merge.
- Relay storage and traffic captures contain no in-app column and no content.

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
