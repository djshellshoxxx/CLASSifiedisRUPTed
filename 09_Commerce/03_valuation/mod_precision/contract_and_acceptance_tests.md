# PS-074-09 — Contract and acceptance tests: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-09.R01** Every requirement is covered by at least one automated test.
- **PS-074-09.R02** Property tests run at least 10 000 cases per property with a recorded seed.
- **PS-074-09.R03** Golden vectors are shared between implementations and checked in CI.

## Specification

See the module test table below (all processes).

**Fixtures:** packages/commerce/test/vectors/money.json with at least 300 vectors: half-way cases, negative amounts, zero-decimal, 18-decimal, 40-digit rates, allocation ties.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T01 | unit | PS-074-01.R01, PS-074-01.R02, PS-074-02.R01 | parse valid and invalid strings including '+1', '01', '1.0', '1e3', '-0' and a 39-digit value | valid values round-trip; each invalid input returns COMMERCE_MONEY_INVALID or COMMERCE_MONEY_OVERFLOW |
| TEST-PS-074-09.T02 | unit | PS-074-02.R02, PS-074-02.R03, PS-074-01.R03 | invalid rate, empty weights, all-zero weights, mixed currencies | documented error returned or programmer error thrown |
| TEST-PS-074-09.T03 | property | PS-074-03.R02, PS-074-04.R02 | 10 000 random (amount, rate, exponents) conversions compared with an independent oracle using exact fractions | results identical and rounding applied exactly once |
| TEST-PS-074-09.T04 | property | PS-074-03.R02 | conversion round trip A to B to A with the same quote | absolute error ≤ floor(1/(2r) + 1/2) minor units where r is the effective minor-unit rate |
| TEST-PS-074-09.T05 | property | PS-074-03.R03 | 10 000 random allocations over random weights | parts sum exactly to total, each part within 1 minor unit of the ideal share, ties resolved to lowest index |
| TEST-PS-074-09.T06 | property | PS-074-03.R02 | HALF_EVEN symmetry | round(-x) equals -round(x) and half-way values go to the even neighbour |
| TEST-PS-074-09.T07 | unit | PS-074-03.R01, PS-074-06.R01, PS-074-06.R02 | same input executed twice, inputs frozen and compared after the call | identical outputs, inputs unmodified |
| TEST-PS-074-09.T08 | contract | PS-074-04.R01, PS-074-04.R03, PS-074-09.R03 | run the 300 JSON vectors in TypeScript and in the reference Python checker | all outputs identical |
| TEST-PS-074-09.T09 | unit | PS-074-04.R02 | trigger each error path | code and HTTP mapping match the errors table |
| TEST-PS-074-09.T10 | unit | PS-074-05.R01, PS-074-05.R02, PS-074-07.R01 | static analysis of the package imports and call graph | no fetch, fs, Date or Math.random usage and no logging calls |
| TEST-PS-074-09.T11 | property | PS-074-06.R03, PS-074-07.R02, PS-074-07.R03 | oversized inputs of 5 000 digits and 100 000 weights | rejected within 1 ms with documented error and no amounts in the message |
| TEST-PS-074-09.T12 | load | PS-074-08.R02, PS-074-05.R03 | 1 000 weights allocation and bundle size check | p99 ≤ 2 ms and gzip size ≤ 12 KiB |
| TEST-PS-074-09.T13 | unit | PS-074-08.R01, PS-074-08.R03, PS-074-09.R01 | CI report generation | vector count and seeds are present in the CI artifact; traceability tool maps every requirement to a passing test |
| TEST-PS-074-09.T14 | unit | PS-074-01.R01, PS-074-09.R02 | lint rule run on a file using parseFloat | lint fails the build |
| TEST-PS-074-09.T15 | unit | PS-074-10.R01, PS-074-10.R02, PS-074-10.R03 | publish vectors file and load it from a fresh checkout and the previous major | vectors load, versions are recorded and backward compatible |

## Acceptance criteria

- Every property test passes with at least 10 000 cases and the shared vectors give identical results in all implementations.
- Allocation never produces parts that fail to sum to the total in any generated case.
- No floating point type, function or literal is present in the package (lint and static analysis).

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
