# PS-144-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-10.R01 | Taxonomy import is from a reviewed file validated against CTR-SCH-001 and applied as a proposal, never directly published. | MVP |
| PS-144-10.R02 | Export of a taxonomy version is public (`PUBLIC`) and contains no listing data. | MVP |
| PS-144-10.R03 | Rollback publishes an earlier tree as a new version; keys are not reused. | MVP |
| PS-144-10.R04 | Backups restore records only; restore runs no migration. | MVP |

## Notes
- Import: file review, schema check, `ProposeGoodsCategory` per entry, then publish under governance approval.
- Export: JSON per version.

## Assumptions & open decisions
- ASSUMPTION: taxonomy history kept indefinitely.
- D07 default: PROVISIONAL (D07 default, unapproved).
