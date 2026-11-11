# F18.S02.M01 — Community governance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S02](../SPEC.md). **Process IDs:** PS-147-01…PS-147-10. **Code:** `packages/governance/src/community/governance`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Operator-run policy change proposals with a public comment period, a recorded decision and a changelog. A publisher (typically a relay operator, or the project for the bundled packs) drafts a proposal in its own vault, signs and publishes it as classrup.governance.policy_proposal/v1, collects signed comments from members through its relay, and a decider key that the publisher delegated in its signed authority list (classrup.governance.authority_list/v1) later signs a decision statement (classrup.governance.policy_decision/v1) in the decider's own vault. The comment period is anchored to the relay-signed receipt of the proposal, not to publisher or decider clocks. Other modules and vaults verify an approved decision against the publisher, the exact approved content and the activation time before applying restricted-flag, prohibited-rule or jurisdiction-profile changes. Contradicting signed statements from different vaults are detected and marked conflicted, never ordered by a claimed transaction. The module also holds the vault's trusted-publisher list and the pending-statement inbox used by every F18 module. This is not a vote and not a global authority: a proposal binds only the vaults and relays that choose to trust that publisher.

## Responsibilities

- [object Object]
- Collect, ingest and display signed member comments (PolicyComment) with relay-side hiding for abuse, up to 5 comments of 2 000 code points per member per proposal, author withdrawal by tombstone and block filtering.
- Let the decider sign and publish the decision in its own vault, bound to the proposal statement cid and the digest of the approved change; require a decider key delegated in the publisher's authority list and different from the publisher.
- Provide verification of a decision (governance.policy_proposal.verify) for a named publisher, exact targets, the content digest actually activated and the anchored activation time, within 30 days of the decision.
- Publish a public changelog of approved proposals and authority-list changes per publisher.
- Own the vault's trusted-publisher list (scopes taxonomy, rules, profiles, proposals, transparency) and the pending-statement inbox, both changed only by explicit owner actions.

## Not responsible for

- Applying the approved change (F18.S01.M01 profiles, F18.S01.M02 rules, F18.S01.M03 categories); they verify the decision and apply it themselves.
- Voting, reputation-weighted decisions or any claim of global legitimacy.
- Moderation of listings or users (F12); only comment hiding on the publisher's own relay.
- Legal review of proposals; content is configuration, not legal advice.
- Relay receipts (F15.S02.M01), rate limits (F12.S03.M03) and the statement registry (F11.S01.M01); this module uses them.
- Future: delegated decider groups with threshold signatures and member polls.

## User stories

- As a relay operator, I propose adding a prohibited keyword set, give members two weeks to comment, and a colleague whose key I delegated publishes the decision with reasons.
- As a member, I read open proposals of the relay I use and post a signed comment under my pseudonym, and I can withdraw it later.
- As a user, I can see the changelog of policy decisions of the publishers I trust and verify they are signed by keys those publishers delegated.
- As a user, I decide myself which publishers I trust, and packs from anyone else wait in a pending inbox until I apply or refuse them.

## Edge cases

- Proposer tries to decide their own proposal; GOVERNANCE_PROPOSAL_SELF_DECISION is returned.
- Comment period is shorter than 72 hours without the expedited flag and a verified co-signature by a co-signer; rejected with GOVERNANCE_PROPOSAL_PERIOD_INVALID.
- A member posts a sixth comment on one proposal; GOVERNANCE_COMMENT_LIMIT is returned.
- A comment signature is valid but the key is not registered on the publisher's relay; the relay refuses it under its policy and the member sees the reason.
- A decision is published twice with different outcomes (equivocation); receivers keep both statements, mark the proposal conflicted for that publisher and refuse to verify either.
- A consumer activates a change more than 30 days after the decision's anchored time, measured at the activation's relay receipt and not at the receiver's clock; verify returns valid false with reason expired. A vault that applies the same snapshot a year later does not re-verify carried-forward content.
- Publisher vault is offline when the comment period ends; the anchored end (proposal relay receipt plus the period) still applies in every vault, and the public page labels planned times as claims.
- The publisher withdraws while the decider, offline, signs an approval; both statements are valid, so every vault that sees both marks the proposal conflicted, verify returns conflicted and a new proposal is required.
- A publisher backdates openedAt or a decider's clock is set forward; receivers use the relay receipt times, so a decision received 1 hour after the proposal's receipt gives period_not_elapsed.
- 200 freshly created keys from one /24 network comment on one proposal; at most 25 are accepted under the prefix and new-key caps and the rest get RATE_LIMITED.
- A pack arrives from a publisher the user does not trust; it waits in the pending inbox for 30 days and is discarded unless the user trusts the publisher or applies it.

## UX and accessibility

- Proposals list per publisher: status chips, anchored comment period end, target type; changelog tab of approved decisions and authority-list changes.
- Proposal detail: summary, proposed change (structured diff), comments with relay-hidden marker, decision and rationale, signature fingerprints of publisher, co-signer and decider with the text 'a different key, not proof of a different person'.
- Operator composer: draft, preview, period selector (72 h to 30 d), expedited switch with reason and co-signer, publish and decide actions with confirmation; authority-list editor.
- Trusted publishers: list with fingerprint, scopes, pinned and paused state; Trust dialog shows the fingerprint and requires confirmation; pending inbox with Apply and Refuse.

**States:** loading; empty; draft; awaiting-cosign; open-for-comment; decision-pending; approved; rejected; withdrawn; conflicted; pending-trust; offline-cached

**Accessibility:** Status is conveyed by text and icon; the comment form has a visible label, character counter announced politely and 44x44 px submit button.; Diff view is a table with headers; signature fingerprints are available as text.; Dates use Intl.DateTimeFormat with timezone shown, and times from other parties carry the label "claim" or "relay time".

## Owned data

- `PolicyProposal` (classrup.governance.policy_proposal/v1, P0, RET-EVIDENCE)
- `PolicyComment` (classrup.governance.policy_comment/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `governance.policy_proposal.draft`, `governance.policy_proposal.request_cosign`, `governance.policy_proposal.cosign`, `governance.policy_proposal.open`, `governance.policy_proposal.decide`, `governance.policy_proposal.withdraw`, `governance.policy_proposal.receive`, `governance.policy_proposal.relay_upload`, `governance.authority_list.draft`, `governance.authority_list.release`, `governance.authority_list.receive`, `governance.policy_comment.post`, `governance.policy_comment.withdraw`, `governance.policy_comment.receive`, `governance.policy_comment.accept`, `governance.policy_comment.relay_withdraw`, `governance.policy_comment.hide`, `governance.trusted_publisher.add`, `governance.trusted_publisher.remove`, `governance.trusted_publisher.pause`, `governance.trusted_publisher.resume`, `governance.pending_statement.hold`, `governance.pending_statement.apply`, `governance.pending_statement.refuse`
- Queries: `governance.policy_proposal.get`, `governance.policy_proposal.list`, `governance.policy_proposal.changelog`, `governance.policy_proposal.verify`, `governance.policy_proposal.relay_get`, `governance.policy_comment.list`, `governance.policy_comment.relay_list`, `governance.trusted_publisher.list`, `governance.trusted_publisher.check`, `governance.pending_statement.list`
- Emits: `governance.policy_proposal.decided`, `governance.policy_proposal.opened`
- Consumes: `privacy.deletion.requested`, `privacy.deletion.cancelled`

## Dependencies

F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-147-01 | [Domain schema](domain_schema.md) | 5 |
| PS-147-02 | [Validation rules](validation_rules.md) | 4 |
| PS-147-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-147-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-147-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-147-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-147-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-147-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-147-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-147-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/community/governance/index.ts`.

## Acceptance criteria

- All tests T01-T23 pass in CI.
- No policy change is applied by a consuming module without a verified approved decision from a delegated key different from the publisher, for that publisher, those targets and that exact content, at an anchored activation time inside the 30-day window.
- The UI never presents a proposal decision as binding beyond the publishers a user trusts, times from other parties are labelled as claims, and contradicting statements are shown as conflicted.
