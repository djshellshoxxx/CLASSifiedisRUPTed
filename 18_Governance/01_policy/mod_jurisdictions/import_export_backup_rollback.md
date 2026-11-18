# PS-145-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-10.R01 | Bulk import of rules is proposal-only and validated against CTR-SCH-001. | MVP |
| PS-145-10.R02 | Export of the register is public and contains no user data. | MVP |
| PS-145-10.R03 | Rollback is a withdrawal plus a new published version; history is kept. | MVP |
| PS-145-10.R04 | Backups restore records only; restore re-applies no rule to past decisions. | MVP |

## Assumptions & open decisions
- ASSUMPTION: register history is kept for the life of the platform.
- D07 default: PROVISIONAL (D07 default, unapproved).
