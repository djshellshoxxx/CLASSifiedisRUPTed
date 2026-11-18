# PS-148-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-148-04.R02 | Commands are `v1`. | MVP |
| PS-148-04.R03 | Draft figures are not visible to the public; only published reports are. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| DraftTransparencyReport | `(period_start, period_end, methodology_version)` | `period_start` + `period_end` + `methodology_version` | `transparency_report.drafted` | TRANSP.METHODOLOGY_UNAPPROVED, TRANSP.SOURCE_MISSING |
| ApproveTransparencyReport | `(report_id, expected_revision)` | `report_id` + revision | none | TRANSP.SMALL_CELL_NOT_SUPPRESSED, SYS.FORBIDDEN, SYS.CONFLICT |
| PublishTransparencyReport | `(report_id, expected_revision)` | `report_id` | `transparency_report.published` | TRANSP.PUBLISHED_IMMUTABLE, TRANSP.INVALID_TRANSITION |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetTransparencyReport | `report_id` or period | published figures with suppression markers | SYS.NOT_FOUND |
| ListTransparencyReports | cursor, limit ≤ 100 | published report summaries | SYS.REQUEST_MALFORMED |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| transparency_report.drafted | transparency_report | PUBLIC | report_id, period |
| transparency_report.published | transparency_report | PUBLIC | report_id, period, version |

## Assumptions & open decisions
- ASSUMPTION: notification to participants of publication goes through F13 by report ID.
- D05 default applies to region dimension: PROVISIONAL (D05 default, unapproved).
