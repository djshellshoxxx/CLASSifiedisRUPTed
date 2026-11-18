# PS-083-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R08, R09), CTR-SCH-001 (R07, R08), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-10.R01 | Export is the only supported format: signed bundle (PS-083-01). No ad hoc file export from this module. | MVP |
| PS-083-10.R02 | Importing a bundle never overwrites a local aggregate; it appends events with `origin_node` provenance (CTR-FED-001 R08). | MVP |
| PS-083-10.R03 | Bundle migration to a new schema MAJOR keeps original signed bytes (CTR-SCH-001 R08). | MVP |
| PS-083-10.R04 | Rollback of an import is a tombstone-based compensation by origin, not row deletion. | MVP |

## Data / schema
Bundle as in [domain_schema.md](domain_schema.md). Backup of imported events follows platform backup policy.

## Commands / queries / events
`portable.create_bundle`, `portable.import_bundle`. Rollback uses `<aggregate>.tombstoned` per CTR-FED-001 R07.

## States & transitions
Rollback path not in [workflow_state_machine.md](workflow_state_machine.md) main table; compensation only.

## Validation & errors
| Code | When |
|---|---|
| PORTABLE.ROLLBACK_NOT_ORIGIN | rollback requested by non-origin |

## Authorization
Rollback: origin node or its moderator key (CTR-FED-001 R07).

## Failure, idempotency, concurrency, offline
Import idempotent by (origin_node, event_id). Rollback idempotent per target event.

## Privacy, retention, abuse
Tombstones keep IDs only (CTR-FED-001 R07).

## Observability & budgets
Metric `portable_compensations_total`.

## Tests
- TEST-PS-083-10-01 (import): re-import does not overwrite local revisions.
- TEST-PS-083-10-02 (rollback): tombstone applied; payload dropped.
- TEST-PS-083-10-03 (schema): MAJOR migration keeps original bytes.

## Acceptance criteria
1. Import never overwrites.
2. Rollback uses tombstones.
3. Original bytes retained.

## Assumptions & open decisions
- ASSUMPTION: compensation via tombstone only.
- B-06: profile export owned by `07_Identity/02_profiles/mod_portable` (PROVISIONAL); this module owns federated bundles only.
