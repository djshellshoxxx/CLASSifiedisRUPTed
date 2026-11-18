# PS-147-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-03.R01 | Proposal states are `open`, `decided`, `withdrawn`. | MVP |
| PS-147-03.R02 | Only `open` proposals can be decided or withdrawn. | MVP |
| PS-147-03.R03 | A decided proposal yields exactly one approval ID, usable once. | MVP |
| PS-147-03.R04 | A published rule version is immutable; changes need a new proposal. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | OpenGovernanceProposal | base version current | open | emit `governance_proposal.opened` |
| open | DecideGovernanceProposal | quorum met; no self-approval | decided (approved) | issue approval ID; emit `governance_proposal.decided` |
| open | DecideGovernanceProposal | rejection by quorum | decided (rejected) | emit `governance_proposal.decided` |
| open | WithdrawProposal | proposer only | withdrawn | emit `governance_proposal.decided` with outcome withdrawn |
| decided (approved) | PublishCommunityRule | approval ID unused | published (rule version) | emit `community_rule.published`; approval ID consumed |

## Validation & errors
Invalid pairs return `GOVERN.INVALID_TRANSITION` (422).

## Failure, idempotency, concurrency, offline
- Double decision submission returns the first decision.
- Two approvers decide at once: `expected_revision`; the second gets `SYS.CONFLICT` and re-reads.
- Offline: votes need network; no offline state.

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
- TEST-PS-147-03-01 (unit): every row of the transition table passes; other pairs return GOVERN.INVALID_TRANSITION.
- TEST-PS-147-03-02 (integration): an undecided proposal closes after 14 days and becomes withdrawn.

## Acceptance criteria
1. TEST-PS-147-03-01, TEST-PS-147-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: proposals close after 14 days if undecided (ASSUMPTION), then become `withdrawn`.
- D07 default applies to closed proposals: PROVISIONAL (D07 default, unapproved).
