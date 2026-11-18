# PS-147-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-02.R01 | Reject a proposal whose `base_version` is not the current published version. | MVP |
| PS-147-02.R02 | Reject a decision with fewer approvers than the rule's quorum (`min_approvers`, ASSUMPTION: 2). | MVP |
| PS-147-02.R03 | Reject a decision where an approver equals the proposer. | MVP |
| PS-147-02.R04 | Reject a `reason_key` not in the catalogue; free-text reasons are not stored. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| GOVERN.BASE_VERSION_STALE | false | conflict / 409 | err.govern.base_version_stale | current version |
| GOVERN.QUORUM_NOT_MET | false | precondition_failed / 412 | err.govern.quorum_not_met | approver count |
| GOVERN.SELF_APPROVAL_FORBIDDEN | false | forbidden / 403 | err.govern.self_approval_forbidden | none |
| GOVERN.REASON_UNKNOWN | false | validation / 400 | err.govern.reason_unknown | none |
| GOVERN.APPROVAL_ALREADY_USED | false | conflict / 409 | err.govern.approval_already_used | none |
| GOVERN.INVALID_TRANSITION | false | unprocessable_state / 422 | err.govern.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

## Assumptions & open decisions
- ASSUMPTION: quorum of 2 approvers is a default; Governance Lead decides.
- D01 applies only to exchanged decisions: PROVISIONAL (D01 default, unapproved).
