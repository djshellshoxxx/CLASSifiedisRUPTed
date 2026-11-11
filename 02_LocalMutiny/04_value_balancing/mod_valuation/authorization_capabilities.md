# PS-027-05 — Authorization and capabilities: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-05.R01** Vault policy lets only the unlocked local principal declare or acknowledge values of items it owns and flag values only as a participant of an active subject.
- **PS-027-05.R02** Incoming projections and flags are accepted only when signed by the owner (projections) or by a participant of the named subject (flags).
- **PS-027-05.R03** Relays may index public valuation projections under their hosting policy but have no capability to change or remove them except by refusing to host.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.valuation.declare | principal | vault unlocked; principal owns the item; item not reserved |
| mutiny.valuation.flag | principal | principal is a participant of a non-terminal subject containing the item in which the owner already signed consent or the reservation |
| mutiny.valuation.acknowledge | principal | principal is the owner; valuation flagged; item not reserved |
| mutiny.valuation.ingest | principal | projection signed by the owner, flag signed by a participant of a subject in which the owner signed, or ack signed by the owner, each with a non-revoked key |
| mutiny.valuation.read | principal | declared values are public projections; flags readable by the owner and the flagger only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T06 | integration | PS-027-03.R02, PS-027-05.R01 | item reserved by own cycle.locked then owner tries to change value | MUTINY_VALUATION_LOCKED until mutiny.cycle.unlocked |
| TEST-PS-027-09.T09 | abuse | PS-027-05.R01, PS-027-05.R02, PS-027-05.R03, PS-027-07.R03 | non-participant flags, 2nd flag within 30 days, forged projection, flags flood | rejected with documented codes |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
