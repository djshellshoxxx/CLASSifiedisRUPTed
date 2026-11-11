# F18.S02.M01 — Community governance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S02](../SPEC.md). **Process IDs:** PS-147-01…PS-147-10. **Code:** `packages/governance/src/community/governance`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Operator-run policy change proposals with a public comment period, a recorded decision and a changelog. A publisher (typically a relay operator, or the project for the bundled packs) drafts a proposal in its own vault, signs and publishes it as classrup.governance.policy_proposal/v1, collects signed comments from members through its relay, and later signs a decision statement (classrup.governance.policy_decision/v1). Other modules and vaults verify an approved decision before applying restricted-flag, prohibited-rule or jurisdiction-profile changes. This is not a vote and not a global authority: a proposal binds only the vaults and relays that choose to trust that publisher.

## Responsibilities

- [object Object]
- Collect and display signed member comments (PolicyComment) with relay-side hiding for abuse, up to 5 comments of 2 000 code points per member per proposal.
- Sign and publish the decision with rationale and changelog entry; require a decider key different from the proposer key.
- Provide verification of a decision (governance.policy_proposal.verify) valid for 30 days for the exact targets it names.
- Publish a public changelog of approved proposals per publisher.

## Not responsible for

- Applying the approved change (F18.S01.M01 profiles, F18.S01.M02 rules, F18.S01.M03 categories); they verify the decision and apply it themselves.
- Voting, reputation-weighted decisions or any claim of global legitimacy.
- Moderation of listings or users (F12); only comment hiding on the publisher's own relay.
- Legal review of proposals; content is configuration, not legal advice.
- Future: delegated decider groups with threshold signatures and member polls.

## User stories

- As a relay operator, I propose adding a prohibited keyword set, give members two weeks to comment, and publish my decision with reasons.
- As a member, I read open proposals of the relay I use and post a signed comment under my pseudonym.
- As a user, I can see the changelog of policy decisions of the publishers I trust and verify they are signed.

## Edge cases

- Proposer tries to decide their own proposal; GOVERNANCE_PROPOSAL_SELF_DECISION is returned.
- Comment period is shorter than 72 hours without the expedited flag and two co-signers; rejected with GOVERNANCE_PROPOSAL_PERIOD_INVALID.
- A member posts a sixth comment on one proposal; GOVERNANCE_COMMENT_LIMIT is returned.
- A comment signature is valid but the key is not registered on the publisher's relay; the relay refuses it under its policy and the member sees the reason.
- A decision is published twice with different outcomes (equivocation); receivers keep both statements, mark the proposal conflicted for that publisher and refuse to verify either.
- The approved decision is older than 30 days when a consumer tries to use it; verify returns valid false with reason expired.
- Publisher vault is offline when the comment period ends; the proposal stays open_for_comment locally until the next unlock, and the public page shows the planned end time as a claim.

## UX and accessibility

- Proposals list per publisher: status chips, comment period end, target type; changelog tab of approved decisions.
- Proposal detail: summary, proposed change (structured diff), comments with relay-hidden marker, decision and rationale, signature fingerprint of publisher and decider.
- Operator composer: draft, preview, period selector (72 h to 30 d), expedited switch with reason, publish and decide actions with confirmation.

**States:** loading; empty; draft; open-for-comment; decision-pending; approved; rejected; withdrawn; conflicted; offline-cached

**Accessibility:** Status is conveyed by text and icon; the comment form has a visible label, character counter announced politely and 44x44 px submit button.; Diff view is a table with headers; signature fingerprints are available as text.; Dates use Intl.DateTimeFormat with timezone shown.

## Owned data

- `PolicyProposal` (classrup.governance.policy_proposal/v1, P0, RET-EVIDENCE)
- `PolicyComment` (classrup.governance.policy_comment/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `governance.policy_proposal.draft`, `governance.policy_proposal.open`, `governance.policy_proposal.decide`, `governance.policy_proposal.withdraw`, `governance.policy_proposal.receive`, `governance.policy_comment.post`, `governance.policy_comment.accept`, `governance.policy_comment.hide`
- Queries: `governance.policy_proposal.get`, `governance.policy_proposal.list`, `governance.policy_proposal.changelog`, `governance.policy_proposal.verify`, `governance.policy_comment.list`
- Emits: `governance.policy_proposal.decided`, `governance.policy_proposal.opened`
- Consumes: none

## Dependencies

F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-147-01 | [Domain schema](domain_schema.md) | 3 |
| PS-147-02 | [Validation rules](validation_rules.md) | 3 |
| PS-147-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-147-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-147-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-147-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-147-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-147-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-147-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-147-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/community/governance/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No policy change is applied by a consuming module without a verified, unexpired, exact-target approved decision signed by a key different from the proposer.
- The UI never presents a proposal decision as binding beyond the publishers a user trusts, and times from other parties are labelled as claims.
