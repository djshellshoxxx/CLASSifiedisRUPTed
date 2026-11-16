# PS-027-09 — Contract and acceptance tests: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-027-09.R02** Plausibility thresholds are tested at their exact boundaries with integer arithmetic.
- **PS-027-09.R03** Cross-vault tests cover projection chains, flags and locks with an in-memory relay.

## Specification

See the module test table below (all processes).

**Fixtures:** Alice's items I1 (asking 12500 EUR), I2 (asking 12000 EUR), I3 (no reference), I4 (reference in USD); Bob and Carol as flaggers; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T01 | unit | PS-027-01.R01, PS-027-02.R01, PS-027-02.R03 | declare 12000 EUR on I1 | stored with ratio 960 permille, plausibility ok, signed projection seq 1 |
| TEST-PS-027-09.T02 | unit | PS-027-02.R01, PS-027-02.R02 | each rule V01..V08 violated in turn | documented error code and nothing signed |
| TEST-PS-027-09.T03 | unit | PS-027-02.R02 | ratio 199, 200, 5000, 5001 permille and missing or foreign-currency reference | low, ok, ok, high, unchecked |
| TEST-PS-027-09.T04 | property | PS-027-03.R01, PS-027-03.R02 | random declare, flag, acknowledge sequences | seq increments by exactly 1 per signed change; flagged items never reach matching or consent |
| TEST-PS-027-09.T05 | integration | PS-027-03.R03, PS-027-01.R03 | participant flags an item in a proposal, owner acknowledges | status flagged then acknowledged, flag history kept, item usable again |
| TEST-PS-027-09.T06 | integration | PS-027-03.R02, PS-027-05.R01 | item reserved by cycle.locked then owner tries to change value | MUTINY_VALUATION_LOCKED until mutiny.cycle.unlocked |
| TEST-PS-027-09.T07 | contract | PS-027-04.R01, PS-027-04.R02, PS-027-09.R02, PS-027-09.R03 | commands and events | statements and payloads validate against classrup.mutiny.item_valuation/v1, valuation_flag/v1 and registry |
| TEST-PS-027-09.T08 | integration | PS-027-04.R03, PS-027-06.R03 | listing edited and sell terms set events | reference and plausibility recomputed; automatic flag set or cleared |
| TEST-PS-027-09.T09 | abuse | PS-027-05.R01, PS-027-05.R02, PS-027-05.R03, PS-027-07.R02, PS-027-07.R03 | non-participant flags, 2nd flag within 30 days, forged projection, flags flood | rejected with documented codes |
| TEST-PS-027-09.T10 | integration | PS-027-06.R01, PS-027-06.R02 | replay declare; two devices change value concurrently | single record; resolve prompt, higher seq wins only after user confirmation |
| TEST-PS-027-09.T11 | integration | PS-027-07.R01, PS-027-07.R03 | value disclosure and relay indexing | disclosure shown before signing; relay sees only public projection fields; flags never leave as plaintext |
| TEST-PS-027-09.T12 | load | PS-027-08.R02, PS-027-08.R03 | declare and list_for_items(200) on emulated Moto G | within budgets |
| TEST-PS-027-09.T13 | unit | PS-027-08.R01, PS-027-09.R01 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-027 requirement maps to a passing test |
| TEST-PS-027-09.T14 | integration | PS-027-06.R03, PS-027-10.R01, PS-027-10.R02, PS-027-10.R03 | export, import into fresh vault, rollback | own valuations round-trip with signatures; imported peer projections re-verified; seq continues |
| TEST-PS-027-09.T15 | e2e | PS-027-01.R02, PS-027-07.R03 | mobile owner declares a value | disclosure and not-an-appraisal notice shown; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No module or screen presents a declared value as an appraisal or market price.
- A reserved item's value cannot change and flagged values block matching and consent until acknowledged or redeclared.

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
