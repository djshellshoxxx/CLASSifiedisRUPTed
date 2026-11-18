# PS-135-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-02.R01 | Reject a scenario whose `contracts` list names an ID not present in planning/contracts. | MVP |
| PS-135-02.R02 | Reject fixtures containing values matching personal-data patterns (email, phone, IPv4/IPv6, lat/long pairs with more than 2 decimal places). | MVP |
| PS-135-02.R03 | Reject a scenario that asserts an error code not in CTR-ERR-001 registry. | MVP |
| PS-135-02.R04 | Reject any fixture whose digest does not match the stored SHA-256. | MVP |
| PS-135-02.R05 | Reject a scenario with no `modules` entry that resolves to a SPEC.md. | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md) and fixture files.

## Commands / queries / events
Lint runs on pull request and blocks merge.

## States & transitions
Lint failure marks the change as not mergeable; no run record is written for lint failures.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| INTEGR.CONTRACT_UNKNOWN | validation (400) | false | err.integr.contract_unknown |
| INTEGR.PERSONAL_DATA_IN_FIXTURE | validation (400) | false | err.integr.personal_data_in_fixture |
| INTEGR.ERROR_CODE_UNKNOWN | validation (400) | false | err.integr.error_code_unknown |
| INTEGR.FIXTURE_DIGEST_MISMATCH | validation (400) | false | err.integr.fixture_digest_mismatch |
| INTEGR.MODULE_UNRESOLVED | validation (400) | false | err.integr.module_unresolved |

Module code `INTEGR` is used because CTR-ERR-001 caps module codes at 8 letters.

## Authorization
Lint is run by CI principal `sys_`; overrides are not permitted.

## Failure, idempotency, concurrency, offline
Deterministic. Same tree, same result.

## Privacy, retention, abuse
Lint output reports file and rule, never the matched value.

## Observability & budgets
Lint runtime ≤ 60 s per PR (ASSUMPTION).

## Tests
- TEST-PS-135-02-01: unit, one fixture per rule.
- TEST-PS-135-02-02: unit, lint output contains no matched personal value.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. Lint never prints a matched value.

## Assumptions & open decisions
- ASSUMPTION: regex set reviewed by F10.
- D05 (coarse geo fixtures): PROVISIONAL (D05 default, unapproved).
