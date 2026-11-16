# PS-009-09 — Contract and acceptance tests: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-09.R01** Every requirement is covered by at least one automated test.
- **PS-009-09.R02** Contract tests validate commands, events and the Variant schema against the registry.
- **PS-009-09.R03** Limits and atomic rollback are tested with fault injection.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with draft sell listing L (EUR 25.00), 49 variants preloaded in a second listing M, inventory module in memory, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T01 | unit | PS-009-01.R01, PS-009-01.R03, PS-009-02.R01, PS-009-02.R02 | add a valid variant with quantity 3 | Variant stored, inventory item onHand 3, 50-variant and 5-attribute limits enforced |
| TEST-PS-009-09.T02 | unit | PS-009-01.R02, PS-009-07.R01 | read projection and events | variants only in projection; no quantities in event or projection beyond in-stock flag |
| TEST-PS-009-09.T03 | unit | PS-009-02.R03 | violate each rule V01-V09 | documented error code returned and nothing stored |
| TEST-PS-009-09.T04 | property | PS-009-03.R01, PS-009-03.R02, PS-009-03.R03 | random commands | only declared transitions; retire blocked while holds exist; reactivation rechecks limits |
| TEST-PS-009-09.T05 | contract | PS-009-04.R01, PS-009-04.R03, PS-009-09.R02 | each command runs | outputs and bazaar.variant.changed payloads validate against registry |
| TEST-PS-009-09.T06 | integration | PS-009-04.R02, PS-009-06.R02 | update variant price on published listing | listing revision recorded as material in the same transaction; event emitted once |
| TEST-PS-009-09.T07 | abuse | PS-009-05.R01, PS-009-05.R02, PS-009-05.R03 | other principal or UI-less caller attempts commands | FORBIDDEN or NOT_FOUND; no relay call |
| TEST-PS-009-09.T08 | integration | PS-009-06.R01, PS-009-06.R03 | replay add with same key; edit offline | one variant; unsent changes shown until projection re-sent |
| TEST-PS-009-09.T09 | chaos | PS-009-06.R02, PS-009-06.R03 | inventory set_quantity fails below reserved | variant change rolled back, inventory error returned unchanged |
| TEST-PS-009-09.T10 | integration | PS-009-06.R02 | two tabs add the 50th variant | one succeeds, other BAZAAR_VARIANT_LIMIT |
| TEST-PS-009-09.T11 | abuse | PS-009-07.R02, PS-009-07.R03 | variant attribute with prohibited keyword at publish | publication blocked by policy; retention shows RET-STANDARD |
| TEST-PS-009-09.T12 | abuse | PS-009-07.R01, PS-009-07.R03 | 101 commands in an hour; 11 price changes in a day | RATE_LIMITED on the 101st and 11th |
| TEST-PS-009-09.T13 | load | PS-009-08.R01, PS-009-08.R02, PS-009-08.R03 | 50 variants on Moto G profile | add p95 <= 80 ms, list p95 <= 100 ms, no telemetry |
| TEST-PS-009-09.T14 | unit | PS-009-09.R01, PS-009-09.R03 | traceability tool run | every PS-009 requirement maps to a passing test; failures print seeds |
| TEST-PS-009-09.T15 | integration | PS-009-10.R01, PS-009-10.R02, PS-009-10.R03 | export, import to fresh vault, import duplicate attributes | round-trip identical; duplicate rejected in dry-run |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A variant price change always creates a material listing revision and a bazaar.variant.changed event with priceChanged true.
- Variants with active holds or open offers can never be retired or removed.

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
