# PS-074-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Tests 01, 06, 09), CTR-SCH-001 (R09). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-09.R01 | At least 500 golden vectors covering grammar, scaling, HALF_EVEN ties, overflow and cross-currency conversion. | MVP |
| PS-074-09.R02 | Vectors pass in two independent implementations (ASSUMPTION). | MVP |
| PS-074-09.R03 | CTR-COM-001 tests 06 and 09 pass using this library. | MVP |
| PS-074-09.R04 | No accessibility surface (library); UI formatting is tested by F14 under PS-074-03 consumer tests. | MVP |

## Data / schema
Vector file: JSON lines with `input`, `expected`, `rules_version`.

## Commands / queries / events
Not applicable.

## States & transitions
Pipeline tests per PS-074-03.

## Validation & errors
Per PS-074-02.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Per PS-074-06.

## Privacy, retention, abuse
Per PS-074-07.

## Observability & budgets
Per PS-074-08.

## Tests
- TEST-PS-074-09-01 (golden): 500 vectors.
- TEST-PS-074-09-02 (golden): cross-implementation parity.
- TEST-PS-074-09-03 (contract): CTR-COM-001 tests 06 and 09 green.
- TEST-PS-074-09-04 (lint): float prohibition across commerce packages.

## Acceptance criteria
1. Vectors pass in both implementations.
2. CTR-COM-001 tests 06 and 09 pass.
3. Float lint clean.

## Assumptions & open decisions
- D03 (PROVISIONAL, unapproved).
