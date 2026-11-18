# PS-009-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R05, R08), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-10.R01 | Owner export includes all variants of the listing, including archived ones, in schema 1.0.0 JSON. | MVP |
| PS-009-10.R02 | Public export and federation include active variants only. | MVP |
| PS-009-10.R03 | Import of variant records validates against the declared schema version; unknown MAJOR is rejected with SCH.UNKNOWN_VERSION. | MVP |
| PS-009-10.R04 | Backup restores variants with their `created_revision` and `archived_revision` unchanged. | MVP |
| PS-009-10.R05 | Rollback of this feature hides the UI and stops writes; it never deletes variant rows. Archive is the only data action. | MVP |

## Data / schema
Export object: `{variants: [variant record], schema_version: "1.0.0"}` nested under listing export. No new fields.

## Commands / queries / events
Import is replay of `listing.variant_added` and `listing.variant_archived` events in revision order (CTR-EVT-001 R02).

## States & transitions
Import does not create new states; imported `archived` variants stay archived.

## Validation & errors
Imported rows failing PS-009-02 are rejected per row; the batch reports row index and code, no values.

## Authorization
Export by owner (`lst.update` scope self) or by export request under CTR-CAP-001 `export` verb; federation export is by the node, not the listing owner.

## Failure, idempotency, concurrency, offline
Import is idempotent by (origin_node, event_id) (CTR-FED-001 R05). Restore is blocked while a listing revision gap exists (EVT.REVISION_GAP).

## Privacy, retention, abuse
Export of archived variants is owner-only (PS-009-05). Exports follow CTR-PRV-001 R11.

## Observability & budgets
Export size ≤ 8 KB per listing variant set (PS-009-01 budget).

## Tests
- TEST-PS-009-10-01 (contract): owner export validates against 1.0.0.
- TEST-PS-009-10-02 (integration): import then re-export is byte-stable for the variant section (canonical JSON).
- TEST-PS-009-10-03 (rollback): feature off leaves all rows readable in the database.

## Acceptance criteria
1. Export and import round trip preserves all variant fields.
2. Rollback test shows zero deleted variant rows.
3. Federation export excludes archived variants in 100% of fixtures.

## Assumptions & open decisions
- PENDING: feature flag ID for variants, from F15 mod_flags.
- PROVISIONAL (D01 default, unapproved): versioned signed envelopes for any federated export.
