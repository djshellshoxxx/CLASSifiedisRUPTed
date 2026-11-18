# PS-148-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-10.R01 | Figures are imported only from aggregate job outputs that have passed suppression; no row-level import. | MVP |
| PS-148-10.R02 | Export of published reports is public (CSV or JSON); no draft export by default. | MVP |
| PS-148-10.R03 | Rollback is a superseding report; the rolled-back report remains readable. | MVP |
| PS-148-10.R04 | Backups restore records; restore re-publishes nothing. | MVP |

## Assumptions & open decisions
- ASSUMPTION: report history is kept indefinitely.
- D07 default: PROVISIONAL (D07 default, unapproved).
