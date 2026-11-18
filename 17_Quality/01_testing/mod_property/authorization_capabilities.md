# PS-136-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-05.R01 | Registering a property requires module owner role for `owning_module` or QA Lead. | MVP |
| PS-136-05.R02 | Running properties requires CI `sys_` principal or QA Lead. | MVP |
| PS-136-05.R03 | Replay of counterexamples is limited to engineers with read access to the owning module. | MVP |
| PS-136-05.R04 | No property run may use production data as generator input. | MVP |

## Data / schema
Capability IDs: `property.register`, `property.run`, `property.replay`.

## Commands / queries / events
Decision records on denial.

## States & transitions
N/A.

## Validation & errors
| Actor | Action | Result |
|---|---|---|
| owner of module X | register property for X | allow |
| owner of module Y | register property for X | DENY, SYS.FORBIDDEN |
| CI sys | run | allow |
| engineer | run (not CI, not QA Lead) | DENY, SYS.FORBIDDEN |

## Authorization
Grants reviewed quarterly (ASSUMPTION).

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
Denials carry no property content.

## Observability & budgets
Counter `property_authz_denied_total{rule}`.

## Tests
- TEST-PS-136-05-01: unit, decision table.
- TEST-PS-136-05-02: negative, cross-module registration denied.

## Acceptance criteria
1. Cross-module registration denied in fixtures.
2. Production-data generator input rejected in lint.

## Assumptions & open decisions
- ASSUMPTION: quarterly grant review.
- D10: PROVISIONAL (D10 default, unapproved) not applicable to test credentials.
