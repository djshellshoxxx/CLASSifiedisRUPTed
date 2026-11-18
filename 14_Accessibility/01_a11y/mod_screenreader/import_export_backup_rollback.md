# PS-110-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-10.R01 | Templates are exported as versioned catalog files for translation review; no user data is exported. | MVP |
| PS-110-10.R02 | Template rollback restores the previous published revision within one release. | MVP |
| PS-110-10.R03 | Backups include the template catalog; restore does not republish deprecated templates. | MVP |

## Data / schema
Catalog file: `{"catalog_version":"1.0.0","templates":[{template_id, revision, event_key, text_key, politeness}]}`.

## Commands / queries / events
Rollback performed by `scr.template.publish` of the earlier revision, with the same two-person control.

## States & transitions
Rollback creates a new revision; history is append-only.

## Validation & errors
Imported catalog files validated by [PS-110-02](validation_rules.md).

## Authorization
Export by QA and a11y roles; rollback per [PS-110-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Import is idempotent by (template_id, revision). Partial import rolls back as a unit.

## Privacy, retention, abuse
Catalog contains PUBLIC data only.

## Observability & budgets
Import and rollback counts emitted.

## Tests
- TEST-PS-110-10-01 integration: export then import yields identical catalog.
- TEST-PS-110-10-02 rollback: revision 2 rolled back to 1; announcements change accordingly.
- TEST-PS-110-10-03 negative: catalog file with a forbidden placeholder is rejected as a whole.

## Acceptance criteria
1. Export round trip is byte-identical after canonical ordering.
2. Rollback takes effect in the next release in test.
3. Partial import never leaves a mixed catalog.

## Assumptions & open decisions
- ASSUMPTION: catalog file is canonical JSON with sorted keys.
- No Dxx decision directly affects this process.
