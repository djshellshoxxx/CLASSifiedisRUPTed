# PS-146-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-146-04.R02 | Commands are `v1`. | MVP |
| PS-146-04.R03 | Queries never return detection logic (none is stored) and never return other users' decisions. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| ProposeProhibitionRule | `(rule: prohibition_rule)` | `rule_key` + `version` | `prohibition_rule.proposed` | PROHIB.DETECTION_FIELD_FORBIDDEN, PROHIB.SOURCE_MISSING |
| PublishProhibitionRule | `(rule_key, version, approver_ref, expected_revision)` | `rule_key` + `version` | `prohibition_rule.published` | PROHIB.RULE_NOT_PUBLISHED, SYS.FORBIDDEN, SYS.CONFLICT |
| RetireProhibitionRule | `(rule_key, reason_key, expected_revision)` | `rule_key` + `reason_key` | `prohibition_rule.retired` | PROHIB.INVALID_TRANSITION, SYS.CONFLICT |
| ClassifyListingDraft | `(draft_ref, draft_version, region_code)` | `draft_ref` + `draft_version` + `region_code` | `classification.recorded` | PROHIB.CONTENT_NOT_ALLOWED, SYS.UNAVAILABLE |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetProhibitionRules | `class_key?`, `status?`, cursor | rule summaries (no detection fields) | SYS.REQUEST_MALFORMED |
| GetClassificationDecision | `decision_id` | outcome, reason keys | SYS.NOT_FOUND |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| prohibition_rule.published | prohibition_rule | PUBLIC | rule_key, version |
| prohibition_rule.retired | prohibition_rule | PUBLIC | rule_key, version |
| classification.recorded | classification_decision | PSEUDONYMOUS | decision_id, outcome, case_ref |

## Assumptions & open decisions
- ASSUMPTION: F12 subscribes to `classification.recorded` where outcome is `restricted`.
- No Dxx applies directly: PROVISIONAL, none applied.
