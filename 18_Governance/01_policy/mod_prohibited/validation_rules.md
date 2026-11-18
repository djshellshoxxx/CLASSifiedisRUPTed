# PS-146-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-02.R01 | Reject a rule containing a regex, keyword list or any field longer than 200 characters. | MVP |
| PS-146-02.R02 | Reject a `prohibited` rule without a `source_ref` and at least one linked category or jurisdiction reference. | MVP |
| PS-146-02.R03 | Reject a decision request that includes listing text, image bytes or more than 0 free-text fields. | MVP |
| PS-146-02.R04 | Reject a `reason_key` not in the approved message catalogue. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| PROHIB.DETECTION_FIELD_FORBIDDEN | false | validation / 400 | err.prohib.detection_field_forbidden | field name only |
| PROHIB.SOURCE_MISSING | false | validation / 400 | err.prohib.source_missing | rule key |
| PROHIB.CONTENT_NOT_ALLOWED | false | validation / 400 | err.prohib.content_not_allowed | field name only |
| PROHIB.REASON_UNKNOWN | false | validation / 400 | err.prohib.reason_unknown | none |
| PROHIB.RULE_NOT_PUBLISHED | false | precondition_failed / 412 | err.prohib.rule_not_published | rule key |
| PROHIB.INVALID_TRANSITION | false | unprocessable_state / 422 | err.prohib.invalid_transition | from and event names |
| SYS.UNAVAILABLE | true | unavailable / 503 | err.sys.unavailable | dependency name |

## Assumptions & open decisions
- ASSUMPTION: 200-character field limit is a default.
- No Dxx governs catalogue validation directly: PROVISIONAL, none applied.
