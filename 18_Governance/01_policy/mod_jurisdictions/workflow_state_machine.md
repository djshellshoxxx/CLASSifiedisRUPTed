# PS-145-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-03.R01 | Rule states are exactly `proposed`, `published`, `withdrawn`. | MVP |
| PS-145-03.R02 | Only `published` rules with `effective_from` ≤ today apply to decisions. | MVP |
| PS-145-03.R03 | `withdrawn` is terminal for that version; a correction is a new version. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | ProposeJurisdictionRule | R01–R04 pass | proposed | emit `jurisdiction_rule.proposed` |
| proposed | PublishJurisdictionRule | approver ≠ proposer; prohibition link if needed | published | emit `jurisdiction_rule.published` |
| published | WithdrawJurisdictionRule | approver present | withdrawn | emit `jurisdiction_rule.withdrawn`; decisions keep pinned version |
| proposed | RejectProposal | none | (removed) | none |

## Validation & errors
Invalid pairs return `JURIS.INVALID_TRANSITION` (422). Published versions are never edited.

## Failure, idempotency, concurrency, offline
- Duplicate publish of the same version returns the existing version.
- Withdrawal during an open listing review: the listing review keeps the version that applied when it started.
- Offline clients receive the rule set at their last sync; submission-time checks run online.

## Assumptions & open decisions
- ASSUMPTION: time-zone of effective dates is UTC.
- No additional Dxx applies: PROVISIONAL, none applied.
