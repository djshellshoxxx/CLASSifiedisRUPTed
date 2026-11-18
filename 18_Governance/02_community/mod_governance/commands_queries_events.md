# PS-147-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-147-04.R02 | Commands are `v1`. | MVP |
| PS-147-04.R03 | Queries never return individual vote choices before a decision closes. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| OpenGovernanceProposal | `(target_rule_key, base_version, proposed_text_hash, reason_key)` | `target_rule_key` + `base_version` + `proposed_text_hash` | `governance_proposal.opened` | GOVERN.BASE_VERSION_STALE, GOVERN.REASON_UNKNOWN |
| DecideGovernanceProposal | `(proposal_id, outcome, approver_refs[], expected_revision)` | `proposal_id` | `governance_proposal.decided` | GOVERN.QUORUM_NOT_MET, GOVERN.SELF_APPROVAL_FORBIDDEN, SYS.CONFLICT |
| PublishCommunityRule | `(approval_id, rule_key, text_hash)` | `approval_id` | `community_rule.published` | GOVERN.APPROVAL_ALREADY_USED, SYS.FORBIDDEN |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetCommunityRule | `rule_key`, `version?` | rule text reference and hash | SYS.NOT_FOUND |
| GetGovernanceProposal | `proposal_id` | status, outcome, tally after close | SYS.NOT_FOUND |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| governance_proposal.opened | governance_proposal | PUBLIC | proposal_id, target_rule_key |
| governance_proposal.decided | governance_proposal | PUBLIC | proposal_id, outcome |
| community_rule.published | community_rule | PUBLIC | rule_key, version, text_hash |

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-147-04-01 (contract): DecideGovernanceProposal is idempotent on proposal_id.
- TEST-PS-147-04-02 (contract): governance events validate against the CTR-EVT-001 envelope schema.

## Acceptance criteria
1. TEST-PS-147-04-01, TEST-PS-147-04-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: policy modules subscribe to `community_rule.published` and read approval IDs through the command response, not events.
- No Dxx applies directly beyond D01 default if exchanged: PROVISIONAL (D01 default, unapproved).
