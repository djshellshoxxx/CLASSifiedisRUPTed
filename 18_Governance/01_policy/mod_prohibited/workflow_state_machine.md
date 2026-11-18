# PS-146-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-03.R01 | Rule states are `proposed`, `published`, `retired`. | MVP |
| PS-146-03.R02 | Classification outcomes are exactly `permitted`, `restricted`, `prohibited`. | MVP |
| PS-146-03.R03 | A `prohibited` outcome blocks submission; a `restricted` outcome routes the draft to review and does not publish it. | MVP |
| PS-146-03.R04 | Classification order: `prohibited` rules are checked first, then `restricted`, then default `permitted`. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | ProposeProhibitionRule | R01–R04 of PS-146-02 pass | proposed | emit event |
| proposed | PublishProhibitionRule | approver ≠ proposer; source present | published | emit `prohibition_rule.published` |
| published | RetireProhibitionRule | replacement or reason key present | retired | emit `prohibition_rule.retired`; past decisions keep version |
| (draft) | ClassifyListingDraft | rules published for region | prohibited / restricted / permitted | emit `classification.recorded` |

## Validation & errors
Invalid pairs return `PROHIB.INVALID_TRANSITION` (422). Decisions are immutable.

## Failure, idempotency, concurrency, offline
- Duplicate classification request for the same draft version returns the same decision.
- Rule service down: classification fails closed with `SYS.UNAVAILABLE`; the draft is not treated as permitted.
- Offline clients see a "check pending" state; they cannot submit a classified-restricted draft without an online decision.

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
- TEST-PS-146-03-01 (unit): a draft matching both prohibited and restricted rules is classified prohibited.
- TEST-PS-146-03-02 (integration): a restricted outcome routes the draft to the F12 queue, not to publication.

## Acceptance criteria
1. TEST-PS-146-03-01, TEST-PS-146-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: restricted routing goes to F12 review queue, not automatic removal.
- No additional Dxx applies: PROVISIONAL, none applied.
