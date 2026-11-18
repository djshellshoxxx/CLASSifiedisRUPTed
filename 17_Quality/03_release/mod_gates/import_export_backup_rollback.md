# PS-143-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-10.R01 | Gate definitions are imported from reviewed repository files validated against CTR-SCH-001. | MVP |
| PS-143-10.R02 | Export contains decisions, evidence IDs and waiver records for a release; no evidence bodies. | MVP |
| PS-143-10.R03 | Rollback of a gate definition is a new version; decisions made under the old version stay valid for that version. | MVP |
| PS-143-10.R04 | Backups restore records only; restore never re-evaluates gates or re-grants waivers. | MVP |

## Notes
- Import: reviewed file, schema check, then `DefineReleaseGate`.
- Export: JSON, for audit and release review.
- Rollback: new definition version; waivers revoked on rollback unless re-approved.

## Assumptions & open decisions
- ASSUMPTION: decision history is retained for audit for the release line plus 1 year.
- D07 (retention) affects backups: PROVISIONAL (D07 default, unapproved).
