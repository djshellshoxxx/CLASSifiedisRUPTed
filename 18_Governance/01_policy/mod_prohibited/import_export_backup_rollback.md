# PS-146-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-10.R01 | Catalogue import is proposal-only and schema-validated. | MVP |
| PS-146-10.R02 | Export of the published catalogue excludes any detection field (none exists) and any decision data. | MVP |
| PS-146-10.R03 | Rollback retires the new rule and republishes the prior version; decisions keep the version applied. | MVP |
| PS-146-10.R04 | Backups restore records; restore re-classifies no drafts. | MVP |

## Assumptions & open decisions
- ASSUMPTION: decision export is limited to F12 case review.
- D07 default: PROVISIONAL (D07 default, unapproved).
