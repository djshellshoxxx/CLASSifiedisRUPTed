# PS-027-03 — Workflow state machine: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-03.R01** A valuation is declared, may be flagged automatically or by participants, may be acknowledged by the owner, and is superseded when the owner redeclares.
- **PS-027-03.R02** Every change that alters the signed projection increments seq by exactly 1 and is only possible while no reservation holds the item.
- **PS-027-03.R03** An automatically flagged valuation blocks matching and consent for the item everywhere until acknowledged or superseded, a peer flag blocks only the flagger's subject, and an acknowledgement never hides the flag history.
- **PS-027-03.R04** Flag-triggered state changes are capped at one per item per 30 days so repeated flags cannot keep re-blocking an item.

## Specification

### ItemValuation lifecycle

Initial **declared**; terminal **superseded**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| declared -> flagged | plausibility low or high at declaration or after a reference price change (automatic flag only) | emits mutiny.valuation.flagged with scope global |
| declared -> declared | valid peer flag received for subject S (V06, V09) | flag recorded with scope subject S; emits mutiny.valuation.flagged with scope subject and subjectId S; the item stays usable in other subjects |
| declared -> superseded | mutiny.valuation.declare by owner for the same item | new record seq+1; old record kept as history |
| flagged -> acknowledged | mutiny.valuation.acknowledge by owner with justification for the automatic flag | re-signs projection seq+1 with ackNote; emits mutiny.valuation.declared |
| flagged -> superseded | owner redeclares a different value | new record seq+1; emits mutiny.valuation.declared |
| acknowledged -> flagged | a reference price change makes plausibility low or high again, at most one flag-triggered state change per item per 30 days | emits mutiny.valuation.flagged with scope global |
| acknowledged -> acknowledged | valid peer flag received for subject S (V06, V09) | flag recorded with scope subject S; emits mutiny.valuation.flagged with scope subject |
| acknowledged -> superseded | owner redeclares | new record seq+1; emits mutiny.valuation.declared |

```mermaid
stateDiagram-v2
  [*] --> declared
  declared --> flagged: plausibility low or high at declaration or after a reference price change (automatic flag only)
  declared --> declared: valid peer flag received for subject S (V06, V09)
  declared --> superseded: mutiny.valuation.declare by owner for the same item
  flagged --> acknowledged: mutiny.valuation.acknowledge by owner with justification for the automatic flag
  flagged --> superseded: owner redeclares a different value
  acknowledged --> flagged: a reference price change makes plausibility low or high again, at most one flag-triggered state change per item per 30 days
  acknowledged --> acknowledged: valid peer flag received for subject S (V06, V09)
  acknowledged --> superseded: owner redeclares
  superseded --> [*]
```

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T04 | property | PS-027-03.R01, PS-027-03.R02 | random declare, flag, acknowledge sequences | seq increments by exactly 1 per signed change; flagged items never reach matching or consent |
| TEST-PS-027-09.T05 | integration | PS-027-03.R03, PS-027-01.R03 | participant flags an item in a proposal in which the owner signed consent, owner acknowledges with a kind ack statement | flag scoped to that proposal and answered, flag history kept, item usable again; the same item stays usable in another subject throughout |
| TEST-PS-027-09.T06 | integration | PS-027-03.R02, PS-027-05.R01 | item reserved by own cycle.locked then owner tries to change value | MUTINY_VALUATION_LOCKED until mutiny.cycle.unlocked |
| TEST-PS-027-09.T17 | abuse | PS-027-03.R04, PS-027-07.R03, PS-027-02.R03 | two Sybil DIDs each send Alice a proposal naming her item and flag it; Bob flags in a subject where Alice signed consent; a second flag-triggered change within 30 days | Sybil flags refused (MUTINY_VALUATION_FLAG_NOT_ALLOWED); Bob's flag blocks only his subject; second change refused with RATE_LIMITED and counted |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
