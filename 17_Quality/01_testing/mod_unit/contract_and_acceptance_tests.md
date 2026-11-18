# PS-137-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-09.R01 | Each process spec of mod_unit (PS-137-01..10) has at least one test mapped in the manifest | MVP |
| PS-137-09.R02 | Event payloads emitted by mod_unit validate against the CTR-EVT-001 envelope in CI | MVP |
| PS-137-09.R03 | Error codes in PS-137-02 and PS-137-05 are listed in the CTR-ERR-001 registry; unlisted code fails CI | MVP |
| PS-137-09.R04 | Acceptance checklist for mod_unit is complete before SPEC status moves past SPEC-DRAFT-COMPLETE | MVP |

## Data / schema
Test-catalogue entry: `{test_id, ps_id, layer, file, status}`. Layers used by this module: unit, property (PS-136 owner), contract.

## Commands / queries / events
Contract check runs as `unit.CheckManifest` (PS-137-04). No new events.

## States & transitions
Not applicable.

## Validation & errors
Contract mismatch returns UNIT.CONTRACT_MISMATCH (non-retryable) with schema path only.

## Authorization
Contract test suite run by CI identity; contract changes need QA Lead and the owner of the affected CTR.

## Failure, idempotency, concurrency, offline
A contract test failing on a CTR owned elsewhere is reported as upstream drift, not patched locally.

## Privacy, retention, abuse
Contract fixtures use synthetic identifiers only (PS-137-07).

## Observability & budgets
Count of contract checks per run and failures per CTR; contract suite <= 2 min (ASSUMPTION).

## Tests
- TEST-PS-137-09-01 (contract): `unit.TestMapped` v1 validates against CTR-EVT-001 envelope.
- TEST-PS-137-09-02 (contract): all UNIT.* codes present in CTR-ERR-001 registry.
- TEST-PS-137-09-03 (integration): PS-137-01..10 each has a mapped test row.

## Acceptance criteria
1. Contract tests pass on main branch.
2. Coverage of PS-137 process specs by manifest rows is 100%.
3. Acceptance checklist in module PROCESS_CHECKLIST.md reviewed by QA Lead.

## Assumptions & open decisions
- ASSUMPTION: CTR-ERR-001 registry exists as a machine-readable list; currently DRAFT, so check is PENDING.
- PENDING CTR-EVT-001 and CTR-ERR-001 approval before these tests are binding.
