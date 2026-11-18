# PS-143-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-02.R01 | A gate definition that removes a required evidence type from a released gate is rejected unless a Governance Lead approval ID is supplied. | MVP |
| PS-143-02.R02 | An evidence reference whose `commit_sha` differs from the decision's `commit_sha` is rejected as stale. | MVP |
| PS-143-02.R03 | A waiver whose `approved_by` equals `requested_by` is rejected. | MVP |
| PS-143-02.R04 | A waiver lacking `reason_key` or with `expires_at` beyond the limit is rejected. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| GATES.EVIDENCE_STALE | false | unprocessable_state / 422 | err.gates.evidence_stale | evidence_type and commit mismatch flag |
| GATES.EVIDENCE_MISSING | false | precondition_failed / 412 | err.gates.evidence_missing | evidence_type |
| GATES.SELF_APPROVAL_FORBIDDEN | false | forbidden / 403 | err.gates.self_approval_forbidden | none |
| GATES.WAIVER_TOO_LONG | false | validation / 400 | err.gates.waiver_too_long | limit days |
| GATES.INVALID_TRANSITION | false | unprocessable_state / 422 | err.gates.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

## Assumptions & open decisions
- ASSUMPTION: 14-day waiver ceiling is provisional; Governance Lead confirms.
- D07 (retention) does not change validation: PROVISIONAL (D07 default, unapproved).
