# PS-148-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-09.R01 | No published figure has a cell below the threshold unless suppressed. | MVP |
| PS-148-09.R02 | Every published figure reconciles to its source job total. | MVP |

## Tests
- TEST-PS-148-09-01 (unit): cell of 9 items is suppressed; cell of 10 is not.
- TEST-PS-148-09-02 (unit): complementary suppression hides the second cell when a total would reveal the first.
- TEST-PS-148-09-03 (negative): region dimension with a point coordinate rejected with TRANSP.REGION_PRECISION_FORBIDDEN.
- TEST-PS-148-09-04 (integration): draft read by non-reviewer denied; reviewer read emits audit record.
- TEST-PS-148-09-05 (lint): TRANSP codes pass CTR-ERR-001 registry lint.

## Acceptance criteria
1. All TEST-PS-148-09-01 to -05 pass.
2. Reconciliation of published figures to source jobs passes for the test quarter.

## Assumptions & open decisions
- ASSUMPTION: test quarter uses synthetic aggregates.
- D05 default: PROVISIONAL (D05 default, unapproved).
