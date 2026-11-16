# PS-072-09 — Contract and acceptance tests: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-09.R01** Every requirement is covered by at least one automated test.
- **PS-072-09.R02** Each of the ten mismatch kinds has a fixture that triggers it and a fixture that does not.
- **PS-072-09.R03** The read-only guarantee is verified by a write-spy test on other modules' stores.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded vault with 12 Deals, 15 claims, 4 observations, 9 receipts crafted to trigger M01 to M10 individually; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T01 | unit | PS-072-01.R01, PS-072-01.R02, PS-072-02.R01 | run on the seeded vault | report has counts and keys for M01 to M10 as expected, scope validated |
| TEST-PS-072-09.T02 | unit | PS-072-02.R02, PS-072-03.R02 | each kind fixture and its clean twin | mismatch present only for the triggering fixture |
| TEST-PS-072-09.T03 | unit | PS-072-02.R03, PS-072-02.R01 | dismiss with valid and invalid key and over-long note | valid stored; invalid return NOT_FOUND or VALIDATION_FAILED |
| TEST-PS-072-09.T04 | unit | PS-072-01.R03, PS-072-03.R01, PS-072-03.R03 | interrupt a run at 40 percent and rerun | first report failed with no partial list; second identical to a fresh run |
| TEST-PS-072-09.T05 | integration | PS-072-03.R01 | complete a run twice with no changes | second run emits no new events; report keys identical |
| TEST-PS-072-09.T06 | contract | PS-072-04.R01, PS-072-04.R02, PS-072-09.R02 | execute commands and queries | outputs and event payloads validate against registry schemas |
| TEST-PS-072-09.T07 | integration | PS-072-04.R03 | deliver deal completed and receipt issued events within 10 s | one coalesced incremental run starts after 30 s |
| TEST-PS-072-09.T08 | abuse | PS-072-05.R01, PS-072-05.R02, PS-072-05.R03 | write-spy on Deal, PaymentClaim, ChainObservation and Receipt stores during a run; relay traffic check | zero writes; no network traffic |
| TEST-PS-072-09.T09 | integration | PS-072-06.R01, PS-072-06.R02, PS-072-06.R03 | two tabs run simultaneously | single report; second tab joins |
| TEST-PS-072-09.T10 | abuse | PS-072-07.R03, PS-072-02.R02 | 2 manual runs within 5 minutes | second returns RATE_LIMITED |
| TEST-PS-072-09.T11 | integration | PS-072-07.R01, PS-072-07.R02 | inspect report contents and age 31 days | IDs and kinds only; report purged after 30 days |
| TEST-PS-072-09.T12 | load | PS-072-08.R01, PS-072-08.R02, PS-072-08.R03 | 20 000 claims | duration ≤ 10 s; longest main-thread block ≤ 50 ms; no telemetry |
| TEST-PS-072-09.T13 | unit | PS-072-09.R01, PS-072-09.R03 | traceability tool run | every PS-072 requirement maps to a passing test |
| TEST-PS-072-09.T14 | integration | PS-072-10.R01, PS-072-10.R02, PS-072-10.R03 | export, import to a fresh vault, roll back one release | latest report exports; import marks it imported and triggers a fresh run |
| TEST-PS-072-09.T15 | e2e | PS-072-01.R03, PS-072-09.R03 | open the Deals screen with issues | card lists action items with accessible severity text; axe zero serious issues |

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- The module never writes to another module's records (write-spy test).
- Each mismatch kind is detected exactly when its rule holds.

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
