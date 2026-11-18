# PS-147-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-03. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-03.R01: Business outcome, actors and exclusions. The state machine makes every charter, role and proposal change explicit and attributable. A proposal reaching `adopted` does not change anything until execution succeeds. Exclusions: no funds, no escrow, no enforcement against individuals (F12 owns sanctions).
- PS-147-03.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases are listed per transition below.
- PS-147-03.R03: Accessibility and localization: each state has a localized label key and a screen-reader sentence (`state_label_key`). Members see state changes at the next refresh, not via silent background changes. State names in this file are stable identifiers, not display text.
- PS-147-03.R04: Transition table below is the only source of allowed transitions. Any other transition is rejected with `GOVERNANCE_PROPOSAL_STATE_INVALID` (or the matching guard code).
- PS-147-03.R05: Timers are defined here: draft expiry, voting close, execution retries. Timers use server clock and are idempotent.
- PS-147-03.R06: Offline behavior: a client may show a vote as pending; it is not a state. Pending state is local until server acknowledgment (D08).

## Proposal states
| State | Entry event | Terminal | Meaning |
|---|---|---|---|
| draft | `governance.proposal.drafted.v1` | no | Editable by proposer; no voting |
| open | `governance.proposal.opened.v1` | no | Voting window running; eligibility fixed |
| closed | `governance.proposal.closed.v1` | no (transient) | Window ended; tally being computed under row lock |
| adopted | `governance.decision.recorded.v1` (outcome adopted) | no | Passed; awaiting execution |
| rejected | `governance.decision.recorded.v1` (outcome rejected) | yes | Voted down or tie |
| no_quorum | `governance.decision.recorded.v1` (outcome no_quorum) | yes | Quorum not met |
| withdrawn | `governance.proposal.withdrawn.v1` | yes | Withdrawn by proposer, or draft expired |
| executed | `governance.proposal.executed.v1` | yes | Adopted change applied |
| execution_failed | `governance.proposal.execution_failed.v1` | no (operator action needed after 5 automatic attempts) | Execution attempt failed; decision retained |

## Transitions
| # | From | To | Command or timer | Guard (all must hold) | Postcondition |
|---|---|---|---|---|---|
| T1 | (none) | draft | CreateProposal | Caller is active steward; community active; proposer under draft/open limit | draft_expires_at = now + 30 days |
| T2 | draft | draft | UpdateProposal | Caller is proposer; still active steward; revision matches | revision + 1 |
| T3 | draft | open | OpenProposal | Caller is proposer and active steward; payload guards from [validation](validation_rules.md) pass at open; eligible_count >= 3; open-per-community limit not reached | Eligibility snapshot written; voting window set; draft_expires_at cleared |
| T4 | draft | withdrawn | WithdrawProposal | Caller is proposer | Terminal |
| T5 | draft | withdrawn | ExpireDrafts (timer, daily) | now >= draft_expires_at | reason `draft_expired`. Also applied when proposer is no longer an active steward (reason `proposer_no_longer_steward`) |
| T6 | open | open | CastVote | Voter in eligibility snapshot; now < voting_closes_at; community active | Vote upserted (A-governance-06); event carries no choice |
| T7 | open | withdrawn | WithdrawProposal | Caller is proposer; now < voting_closes_at | Votes kept for audit, excluded from tally |
| T8 | open | closed | TallyProposal (timer, every 30 s) | now >= voting_closes_at; row lock acquired | Tally computed; transition is in the same transaction as T9 |
| T9 | closed | adopted | TallyProposal | quorum met AND approve × 10000 > threshold × (approve + reject) | governance_decision inserted (I5) |
| T10 | closed | rejected | TallyProposal | quorum met AND NOT T9 condition | governance_decision inserted |
| T11 | closed | no_quorum | TallyProposal | quorum not met | governance_decision inserted |
| T12 | adopted | executed | ExecuteDecision (system) | Re-check guards: charter draft still valid, target still eligible/active, steward cap and last-steward rule hold | Effects applied (charter activated, role granted or revoked) |
| T13 | adopted | execution_failed | ExecuteDecision | Any guard fails at execution or a dependency error after retries | execution_attempts + 1; reason code stored in audit |
| T14 | execution_failed | executed | RetryExecution (operator) or ExecuteDecision (timer) | Same as T12 | Effects applied |
| T15 | execution_failed | execution_failed | ExecuteDecision | Attempt fails again | execution_attempts + 1 |

Notes:
- T9 and T10 and T11 are separate outcomes of one tally transaction. They are not separate user actions.
- T12 and T13 run in their own transaction, after the decision has committed. A failed execution never rolls back the decision (see [failure recovery](failure_recovery_idempotency.md)).
- A proposal in `adopted` or `execution_failed` stays there if the community is frozen. Execution resumes when the community returns to `active`.

## Community lifecycle
| From | To | Command | Guard |
|---|---|---|---|
| active | frozen | SetCommunityStatus (operator) | reason code required |
| frozen | active | SetCommunityStatus (operator) | reason code required |
| active or frozen | archived | SetCommunityStatus (operator) | No open proposals; archived is terminal |

Frozen: no proposal creation, voting, charter edits or role changes. Reads and export still work.

## Charter lifecycle
| From | To | Trigger |
|---|---|---|
| draft | active | Execution of an adopted `charter_amend` (T12) |
| active | superseded | Activation of a newer charter_version (same transaction as above) |
| draft | draft (no transition) | Unreferenced draft with no update for 90 days is removed by the retention job; status enum is unchanged (A-governance-10) |

## Role lifecycle
`active` (granted_at set, revoked_at null) to `revoked` (revoked_at set) when a `steward_revoke` executes or erasure runs. Revoked is terminal. A later grant creates a new role_assignment row.

## Timers
- ExpireDrafts: daily, at 02:00 UTC for each community.
- TallyProposal: scans open proposals every 30 seconds with `voting_closes_at <= now`. Lock is `FOR UPDATE SKIP LOCKED`.
- ExecuteDecision: runs immediately after T9 commits, retried per [failure recovery](failure_recovery_idempotency.md).

## Open decisions
- A-governance-06: vote changes allowed until close; latest vote replaces the earlier one. Default adopted.
- A-governance-16: MVP proposal types only. Other types need a new transition table.
- A-governance-23: draft expiry 30 days. Default adopted.
