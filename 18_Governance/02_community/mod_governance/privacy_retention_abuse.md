# PS-147-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-07.R01 | Vote choices are visible only to stewards after close and to members as aggregate tallies. | MVP |
| PS-147-07.R02 | Reasons are catalogue keys; no free text, no names. | MVP |
| PS-147-07.R03 | Closed proposals are kept 2 years (D07 default, PROVISIONAL), then tallies only. | MVP |

## Abuse controls
- **Sock-puppet voting:** one vote per `acc_`; account-level identity controls are owned by F07.
- **Proposal flooding:** max 3 open proposals per member (ASSUMPTION).
- **Steward collusion:** quorum and no-self-decision rules (PS-147-02).

## Assumptions & open decisions
- ASSUMPTION: aggregate tallies with fewer than 5 voters are not published (ASSUMPTION).
- D07 default: PROVISIONAL (D07 default, unapproved).
