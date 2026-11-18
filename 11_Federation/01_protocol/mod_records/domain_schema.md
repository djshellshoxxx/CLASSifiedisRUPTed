# PS-084-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R02), CTR-SCH-001 (R01, R10), CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-01.R01 | Registry row per federable record type: `schema_id` (equals event_type prefix), `aggregate_type`, `max_class`, `federate_mode`. | MVP |
| PS-084-01.R02 | `federate_mode` ∈ `never`, `public_auto`, `opt_in`, `cell`. `never` for PRIVATE_PERSONAL, LOCATION_PRECISE, SECRET, FINANCIAL_EVIDENCE (CTR-FED-001 R03). | MVP |
| PS-084-01.R03 | Each item has `federate` (boolean, default false) and `federate_opt_in_at` (null unless true). | MVP |
| PS-084-01.R04 | Changing a registry row's `max_class` to a more sensitive class is MAJOR and requires F10 review (CTR-SCH-001 R10). | MVP |

## Data / schema
| Entity | Fields | Constraint |
|---|---|---|
| registry row | `record_type`, `aggregate_type`, `max_class`, `federate_mode`, `schema_version`, `owner_module` | `owner_module` is a full module path |
| item flag | `aggregate_id`, `federate`, `federate_opt_in_at`, `federate_revoked_at` | IDs only |

Registry row for `listing` (F01) is seeded as `federate_mode = opt_in`, max class PSEUDONYMOUS (PROVISIONAL, D01 default).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Flag change uses `expected_revision` on the item aggregate. Offline clients queue the flag change (D08) but federation applies it only at server acknowledgement.

## Privacy, retention, abuse
Registry is public metadata. Flags are PSEUDONYMOUS. Retention in file 07.

## Observability & budgets
Coverage of registry types in file 08.

## Tests
- TEST-PS-084-01-01 (schema): registry row with `federate_mode = opt_in` for LOCATION_PRECISE fails.
- TEST-PS-084-01-02 (default): new item has `federate` false.
- TEST-PS-084-01-03 (MAJOR): raising `max_class` without F10 review fails CI.

## Acceptance criteria
1. Registry validates against schema.
2. Default `federate` false verified.
3. Class-raising change blocked without review.

## Assumptions & open decisions
- ASSUMPTION: registry seeded only with types that exist in code.
- PROVISIONAL (D01 default, unapproved): explicit opt-in.
