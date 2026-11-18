# PS-145-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-02.R01 | Reject any region code that is not on the approved list. | MVP |
| PS-145-02.R02 | Reject a rule without `source_ref` or with `effective_to` before `effective_from`. | MVP |
| PS-145-02.R03 | Reject `effect` = `prohibited` unless a `prohibited` rule ID from mod_prohibited is linked. | MVP |
| PS-145-02.R04 | Reject any field matching a coordinate, postal-code or address pattern. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| JURIS.REGION_UNKNOWN | false | validation / 400 | err.juris.region_unknown | none (value not echoed) |
| JURIS.SOURCE_MISSING | false | validation / 400 | err.juris.source_missing | field name |
| JURIS.DATE_RANGE_INVALID | false | validation / 400 | err.juris.date_range_invalid | none |
| JURIS.PROHIBITION_LINK_MISSING | false | precondition_failed / 412 | err.juris.prohibition_link_missing | rule key |
| JURIS.PRECISION_FIELD_FORBIDDEN | false | validation / 400 | err.juris.precision_field_forbidden | field name only |
| JURIS.INVALID_TRANSITION | false | unprocessable_state / 422 | err.juris.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

## Assumptions & open decisions
- ASSUMPTION: approved region list is maintained by Governance Lead.
- D05 (geoprivacy) governs region granularity: PROVISIONAL (D05 default, unapproved).
