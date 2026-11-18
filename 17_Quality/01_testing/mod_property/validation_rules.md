# PS-136-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-02.R01 | Reject a property with no `source_contract` and no ASSUMPTION label. | MVP |
| PS-136-02.R02 | Reject a generator whose output fails its contract schema, except in negative properties. | MVP |
| PS-136-02.R03 | Reject a property whose case budget is below 1,000 (PR) or 100,000 (nightly) (ASSUMPTION). | MVP |
| PS-136-02.R04 | Reject any generated money value that is a float or exceeds 39 digits (CTR-COM-001 R02). | MVP |
| PS-136-02.R05 | Reject any generated ID not matching CTR-ID-001 R01 except in explicit negative fixtures. | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applied on property registration and on every run.

## States & transitions
Validation failure prevents the run; no `outcome` is recorded.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| PROPERTY.SOURCE_MISSING | validation (400) | false | err.property.source_missing |
| PROPERTY.GENERATOR_INVALID | validation (400) | false | err.property.generator_invalid |
| PROPERTY.BUDGET_TOO_LOW | validation (400) | false | err.property.budget_too_low |
| PROPERTY.MONEY_FORMAT_INVALID | validation (400) | false | err.property.money_format_invalid |
| PROPERTY.ID_FORMAT_INVALID | validation (400) | false | err.property.id_format_invalid |

## Authorization
Registration requires module owner or QA Lead.

## Failure, idempotency, concurrency, offline
Deterministic for same registry state.

## Privacy, retention, abuse
Error output shows property ID and rule only.

## Observability & budgets
Counter `property_validation_fail_total{rule}`.

## Tests
- TEST-PS-136-02-01: unit, one fixture per rule.
- TEST-PS-136-02-02: negative fixture, deliberate invalid ID accepted only in negative mode.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. Negative mode cannot be enabled for positive properties.

## Assumptions & open decisions
- ASSUMPTION: case budgets above.
- D02 (cycle optimizer properties): PROVISIONAL (D02 default, unapproved).
