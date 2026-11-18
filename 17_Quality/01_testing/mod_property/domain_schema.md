# PS-136-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-EVT-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-01.R01 | Each property has one `property` record: ID, invariant statement, owning module, generator ID, case budget, source contract. | MVP |
| PS-136-01.R02 | Each failing run persists a `counterexample` with seed, shrunk input (synthetic), and property ID. | MVP |
| PS-136-01.R03 | Generators produce only values valid under the contract schema, plus a separate set of deliberately invalid values for negative properties. | MVP |
| PS-136-01.R04 | Seeds are recorded for every run; a run is reproducible from `(property_id, seed, build_sha)`. | MVP |

## Data / schema
```json
{
  "property_id": "PROP-<MODULE>-<nn>, e.g. PROP-ID-01",
  "invariant": "string, one sentence",
  "owning_module": "full module ID",
  "source_contract": "CTR-... or ASSUMPTION",
  "generator_id": "string",
  "case_budget": {"pr": 1000, "nightly": 100000},
  "seed": "uint64",
  "build_sha": "40 hex",
  "outcome": "pass | fail | error",
  "counterexample_id": "string | null",
  "data_class": "PUBLIC"
}
```
- `counterexample_id` prefix is PENDING CTR-ID-001 (proposed `cex`, class opaque). Shrunk inputs are synthetic and lint-checked (see [privacy_retention_abuse.md](privacy_retention_abuse.md)).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Runs are reproducible from seed. Re-run with same seed yields the same first counterexample.

## Privacy, retention, abuse
Generated values are synthetic. Counterexamples inherit lint rules from `mod_integration`.

## Observability & budgets
Gauge `property_cases_total{property}`.

## Tests
- TEST-PS-136-01-01: unit, `property` record schema.
- TEST-PS-136-01-02: reproducibility, same seed gives same counterexample.

## Acceptance criteria
1. Every property has a `source_contract` or an explicit ASSUMPTION label.
2. Reproducibility holds in 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: `cex` prefix proposal, PENDING CTR-ID-001.
- D03 (integer minor units, pinned quotes): PROVISIONAL (D03 default, unapproved).
