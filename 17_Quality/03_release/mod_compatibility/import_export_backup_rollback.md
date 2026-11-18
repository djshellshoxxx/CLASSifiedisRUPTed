# PS-142-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-10.R01 | Matrix definitions are imported from reviewed repository files and validated against CTR-SCH-001. | MVP |
| PS-142-10.R02 | Export contains the published matrix and results for a release; no device identifiers. | MVP |
| PS-142-10.R03 | Rollback publishes the prior matrix content as a new version; history is kept. | MVP |
| PS-142-10.R04 | Backups restore records only; no tests are re-run on restore. | MVP |

## Notes
- Import: reviewed file, schema check, then `PublishCompatMatrix`.
- Export: JSON for release review.
- Rollback: a new matrix version with prior rows; results for the rolled-back version stay readable.

## Assumptions & open decisions
- ASSUMPTION: matrix history is kept for the life of the release line.
- D07 (retention) affects backups: PROVISIONAL (D07 default, unapproved).
