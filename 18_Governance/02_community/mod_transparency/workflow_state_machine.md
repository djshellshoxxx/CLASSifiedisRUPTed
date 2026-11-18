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

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-148-03-01 (unit): every row of the transition table passes; other pairs return TRANSP.INVALID_TRANSITION.
- TEST-PS-148-03-02 (integration): publishing a draft whose aggregate jobs are incomplete is blocked.

## Acceptance criteria
1. TEST-PS-148-03-01, TEST-PS-148-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: publication deadline is 30 days after period end (ASSUMPTION).
- No additional Dxx applies: PROVISIONAL, none applied.
