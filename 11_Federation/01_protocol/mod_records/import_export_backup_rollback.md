# PS-084-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R10), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-10.R01 | Registry export is public JSON with digest; no item data. | MVP |
| PS-084-10.R02 | Registry import creates `proposed` rows only; activation requires PS-084-03 guard. | MVP |
| PS-084-10.R03 | Rollback of a registry change re-activates the prior row version; no row deleted. | MVP |

## Data / schema
Export `record_type.export@1.0.0` (PENDING registration). Fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
`registry.export`, `registry.import`, `registry.rollback`.

## States & transitions
Rollback target must be `active` or `deprecated`.

## Validation & errors
| Code | When |
|---|---|
| RECORDS.IMPORT_UNSIGNED | import without digest |
| RECORDS.ROLLBACK_TARGET_INVALID | target not active or deprecated |

## Authorization
Export: any authenticated reader. Import and rollback: Platform Lead with Privacy Lead for class changes.

## Failure, idempotency, concurrency, offline
Import idempotent per digest. Rollback idempotent per target.

## Privacy, retention, abuse
Item flags are not exported with the registry.

## Observability & budgets
`records_rollbacks_total`.

## Tests
- TEST-PS-084-10-01 (import): import cannot activate directly.
- TEST-PS-084-10-02 (rollback): prior row restored, history intact.
- TEST-PS-084-10-03 (export): exported registry verifies by digest.

## Acceptance criteria
1. Import never activates.
2. Rollback keeps history.

## Assumptions & open decisions
- ASSUMPTION: registry export is public.
