# PS-074-03 — Workflow state machine: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-03.R01** The library is stateless and pure; every function returns the same output for the same input with no clock, random or I/O access.
- **PS-074-03.R02** Rounding happens exactly once, at the end of a conversion or percentage computation, never between intermediate steps (MNY-3).
- **PS-074-03.R03** Operations never mutate their inputs; Money values are immutable.

## Specification

**Note:** Pure functions only; no lifecycle. Behavior is specified by the property tests in process 09.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T03 | property | PS-074-03.R02, PS-074-04.R02 | 10 000 random (amount, rate, exponents) conversions compared with an independent oracle using exact fractions | results identical and rounding applied exactly once |
| TEST-PS-074-09.T04 | property | PS-074-03.R02 | conversion round trip A to B to A with the same quote | absolute error ≤ floor(1/(2r) + 1/2) minor units where r is the effective minor-unit rate |
| TEST-PS-074-09.T05 | property | PS-074-03.R03 | 10 000 random allocations over random weights | parts sum exactly to total, each part within 1 minor unit of the ideal share, ties resolved to lowest index |
| TEST-PS-074-09.T06 | property | PS-074-03.R02 | HALF_EVEN symmetry | round(-x) equals -round(x) and half-way values go to the even neighbour |
| TEST-PS-074-09.T07 | unit | PS-074-03.R01, PS-074-06.R01, PS-074-06.R02 | same input executed twice, inputs frozen and compared after the call | identical outputs, inputs unmodified |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
