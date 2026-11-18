# PS-090-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R06, R08, R10), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-02.R01 | Reject a `schema` migration that is a MAJOR step with no registered migration hook: `MIGRATE.HOOK_MISSING` (422). | MVP |
| PS-090-02.R02 | Reject any migration of signed evidence (CTR-COM-001 claims, CTR-FED-001 envelopes) that is lossy: `MIGRATE.LOSSY_FORBIDDEN` (422). | MVP |
| PS-090-02.R03 | Reject a migration that raises a field's data class without an F10 review record: `SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW` (422). | MVP |
| PS-090-02.R04 | Reject `scope` `*` or empty scope with `MIGRATE.SCOPE_INVALID` (400). | MVP |
| PS-090-02.R05 | Reject a `to_version` that is a retired version with `SCH.RETIRED` (410). | MVP |

## Data / schema
Rules apply to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `migration.plan`, `migration.execute`.

## States & transitions
Validation runs at plan (dry run) and again at execute.

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| MIGRATE.HOOK_MISSING | false | unprocessable_state / 422 |
| MIGRATE.LOSSY_FORBIDDEN | false | unprocessable_state / 422 |
| MIGRATE.SCOPE_INVALID | false | validation / 400 |
| SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW | false | unprocessable_state / 422 |
| SCH.RETIRED | false | gone / 410 |

## Authorization
Shape validation first; unreadable scope objects yield `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Deterministic. Re-validation at execute catches changes since plan (digest mismatch → `MIGRATE.PLAN_STALE`, 409).

## Privacy, retention, abuse
Errors name version and rule only.

## Observability & budgets
Counter `migrate_validation_failures_total{code}`.

## Tests
- TEST-PS-090-02-01 (unit): R01–R05 codes.
- TEST-PS-090-02-02 (lossy): migration of a signed claim fixture rejected.
- TEST-PS-090-02-03 (stale): changed scope after plan blocks execute.

## Acceptance criteria
1. All codes tested.
2. Signed evidence never migrated lossily.

## Assumptions & open decisions
- ASSUMPTION: plan-to-execute staleness via digest.
