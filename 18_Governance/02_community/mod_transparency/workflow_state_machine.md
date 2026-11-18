# PS-148-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-03.R01 | Report states are exactly `draft`, `approved`, `published`. | MVP |
| PS-148-03.R02 | Approval requires two principals, neither of whom drafted the report. | MVP |
| PS-148-03.R03 | `published` is terminal; corrections create a new report. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | DraftTransparencyReport | period closed; methodology approved | draft | emit `transparency_report.drafted` |
| draft | ApproveTransparencyReport | approver ≠ drafter; R01 suppression applied | approved | none |
| approved | PublishTransparencyReport | not already published | published | emit `transparency_report.published` |
| draft | DraftTransparencyReport (refresh) | aggregate jobs changed | draft | new draft revision |

## Validation & errors
Invalid pairs return `TRANSP.INVALID_TRANSITION` (422). Publishing an already-published report returns `TRANSP.PUBLISHED_IMMUTABLE`.

## Failure, idempotency, concurrency, offline
- Aggregate job incomplete at draft time: draft cannot be approved until all `source_job_id` values are complete.
- Duplicate publish: same report ID returns original publish result.
- Offline: no effect; publication is server-side.

## Assumptions & open decisions
- ASSUMPTION: publication deadline is 30 days after period end (ASSUMPTION).
- No additional Dxx applies: PROVISIONAL, none applied.
