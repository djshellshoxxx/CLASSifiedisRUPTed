# PS-141-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-09.R01 | Every CIPIPE code passes registry lint (CTR-ERR-001 R02). | MVP |
| PS-141-09.R02 | The required-check list matches the test suites that exist in the repository (no orphan check). | MVP |
| PS-141-09.R03 | Pipeline definitions validate against the CTR-SCH-001 schema. | MVP |

## Tests
- TEST-PS-141-09-01 (lint): CIPIPE codes unique; category and retryable fixed; message keys derivable.
- TEST-PS-141-09-02 (schema): valid and invalid `ci_pipeline` and `ci_run` examples pass or fail as specified.
- TEST-PS-141-09-03 (negative): fork-PR run cannot read a secret or write a cache (PS-141-07 R02).
- TEST-PS-141-09-04 (integration): superseded PR run emits `ci_run.completed` with status `superseded`.
- TEST-PS-141-09-05 (security): planted secret pattern in job output is masked and the job fails with CIPIPE.SECRET_PATTERN_FOUND.
- TEST-PS-141-09-06 (contract): event types match CTR-EVT-001 regex.

## Acceptance criteria
1. All TEST-PS-141-09-01 to -06 pass in CI.
2. Every required check maps to one existing suite (R02).
3. Pipeline definition changes without a second approver are rejected in test.

## Assumptions & open decisions
- ASSUMPTION: a CI provider-neutral fixture set is used for contract tests.
- D01 applies only if run records are federated: PROVISIONAL (D01 default, unapproved).
