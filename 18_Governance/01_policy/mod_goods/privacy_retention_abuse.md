# PS-144-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-07.R01 | Taxonomy holds no personal data; approver and proposer IDs are `acc_` references only. | MVP |
| PS-144-07.R02 | Category use counts exposed publicly are aggregated over at least 10 listings (ASSUMPTION). | MVP |

## Abuse controls
- **Category shopping:** placing restricted goods in a benign category is detected by listing reports, routed to mod_prohibited review (F12).
- **Proposal spam:** max 5 open proposals per proposer (ASSUMPTION).

## Retention
Published versions kept indefinitely for audit (ASSUMPTION); proposals rejected are deleted after 90 days (D07 default, PROVISIONAL).

## Assumptions & open decisions
- ASSUMPTION: no user-generated category names.
- D07 default: PROVISIONAL (D07 default, unapproved).
