# PS-147-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-05. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-05.R01: Business outcome, actors and exclusions. Every command and query is checked against one capability, for one actor and one resource. Exclusions: identity proof and credential issuance (F07), operator staffing, and the capability catalogue itself (owned by CTR-CAP-001, F16 with F07).
- PS-147-05.R02: Denied, expired, revoked and duplicate-grant cases are defined in the revocation rules below. Concurrent revocation takes effect for the next command.
- PS-147-05.R03: Authorization decisions produce no personal data in error bodies. Visibility of individual votes is restricted, not just hidden in the UI. Localization is not applicable to authorization logic; denial text is `GOVERNANCE_NOT_AUTHORIZED` only.
- PS-147-05.R04: Capability names follow `governance.<resource>.<action>`. Each capability maps to exactly one actor set below.
- PS-147-05.R05: Deny by default. A role not in the matrix has no access.

## Actors
- `visitor`: unauthenticated caller.
- `participant`: authenticated pseudonymous participant with standing in the community (A-governance-03).
- `steward`: participant with an active steward role.
- `proposer`: steward who created the proposal in question. Evaluated per resource.
- `operator`: platform operator staff with `governance.operations` grant (A-governance-20).
- `system`: scheduler identity. Holds only the internal capabilities marked below.

## Capability matrix
`Y` allowed, `N` denied, `own` only for the caller's own record, `scoped` restricted as noted.

| Capability | Resource | visitor | participant | steward | proposer | operator | system |
|---|---|---|---|---|---|---|---|
| governance.community.read_public | community, active charter | Y | Y | Y | Y | Y | N |
| governance.community.read_members | proposals, decisions, role list, charter history | N | Y | Y | Y | Y | N |
| governance.community.create | community | N | N | N | N | Y | N |
| governance.community.status.set | community status | N | N | N | N | Y | N |
| governance.charter.draft.write | charter_version (draft) | N | N | Y | N | N | N |
| governance.proposal.create | governance_proposal | N | N | Y | N | N | N |
| governance.proposal.update | governance_proposal (draft) | N | N | N | Y | N | N |
| governance.proposal.open | governance_proposal (draft) | N | N | N | Y | N | N |
| governance.proposal.withdraw | governance_proposal (draft or open) | N | N | N | Y | N | Y (T5 only) |
| governance.vote.cast | vote | N | scoped: eligible only, own vote | Y (if eligible) | Y (if eligible) | N | N |
| governance.vote.read_own | vote | N | own | own | own | N | N |
| governance.decision.tally | governance_decision | N | N | N | N | N | Y |
| governance.decision.execute | governance_decision | N | N | N | N | N | Y |
| governance.proposal.retry_execution | governance_proposal (execution_failed) | N | N | N | N | Y | N |
| governance.role.read | role_assignment | N | Y | Y | Y | Y | N |
| governance.audit.read | audit_entry | N | N | Y | Y | Y | N |
| governance.export.request | export job | N | N | Y | N | N | N |
| governance.operations.read | operational aggregates, no personal IDs | N | N | N | N | Y | N |

Notes on the matrix:
- Individual vote choices are readable by the voter only (`vote.read_own`). Stewards and operators never read other members' choices. The tally is available after close (see Q5 and Q8 in [commands](commands_queries_events.md)).
- `proposer` is a per-resource relation, not a role. A steward who did not create a proposal cannot update, open or withdraw it.
- `audit.read` returns hash-chain fields and event types. It never returns `payload_json` of vote events, which contains no choice in any case.
- `system` is allowed only the internal capabilities listed. It has no access to export, to audit reads or to any write outside the scheduler commands.

## Revocation and effective-time rules
- Steward role revoked (by executed decision or erasure): every steward capability ends at the next command, because capabilities are checked against current role state. Maximum staleness for any cached authorization decision is 30 seconds (A-governance-20 is the operator rule; this staleness budget is set here and must match CTR-CAP-001 when decided).
- A revoked steward's `draft` proposals are withdrawn by ExpireDrafts with reason `proposer_no_longer_steward`. Their `open` proposals continue to tally, because removing a steward must not stall other members' votes.
- Vote eligibility is fixed at open. A participant who loses standing after open keeps their vote record, and their pending vote can still be cast until close unless the community is frozen. Participants who lose standing are not removed from the snapshot (A-governance-03).
- Community `frozen` or `archived`: all write capabilities deny with `GOVERNANCE_COMMUNITY_NOT_ACTIVE` regardless of role, except operator `status.set`.

## Operator and system controls
- Community creation and status changes require operator grant. Operator actions are audit entries with `actor_ref` HMAC of the operator ID (A-governance-20).
- Operators cannot cast votes, create proposals or read individual votes. Operators can only freeze, retry execution and read aggregates.
- The system identity cannot be assumed by a human. Scheduler credentials are scoped to the timers in [workflow](workflow_state_machine.md).

## Test IDs
- TEST-PS-147-05-T01: For each row of the matrix, one allowed and one denied actor case passes. Any mismatch fails the test.
- TEST-PS-147-05-T02: A participant reads another participant's vote through every query returns `GOVERNANCE_NOT_AUTHORIZED` or a response without a choice field. Any choice value in any response fails.
- TEST-PS-147-05-T03: Revoke a steward, then send a steward command 1 second and again 31 seconds after the revocation commit. Pass: both return `GOVERNANCE_NOT_AUTHORIZED`. Fail: either succeeds.

## Open decisions
- A-governance-05: secret ballot. Individual choices visible to the voter only. Tallies released at close. Default adopted; ties to D06 (no receipts that prove a choice to third parties).
- A-governance-20: community creation and status changes are operator-only in MVP. Community self-service is deferred.
- Related decision: D10 (auth and portability). Capability catalogue pending CTR-CAP-001.
