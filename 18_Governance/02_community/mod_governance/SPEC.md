# F18.S02.M01 — governance (community rule records and approvals)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Governance Lead (F18). **Parent:** [F18.S02 community](../SPEC.md).

## Purpose and business behavior
Hold the versioned community rules that apply on the platform, the proposals that change them, and the approval records other policy modules cite. This module is the source of `governance_approval_id` values used by [mod_goods](../../01_policy/mod_goods/SPEC.md), [mod_jurisdictions](../../01_policy/mod_jurisdictions/SPEC.md) and [mod_prohibited](../../01_policy/mod_prohibited/SPEC.md). It records who proposed, who decided and under which rule text version. It does not enforce rules against individuals; F12 does that.

## User stories
- As a community member, I can read the rule version in force and see when it changed.
- As a steward, I can open a proposal to change a rule and record the decision with a stated reason.
- As an auditor, I can trace any policy approval back to a decided proposal.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-147-01 to PS-147-10.

## Public interfaces
Commands `OpenGovernanceProposal`, `DecideGovernanceProposal`, `PublishCommunityRule`. Queries `GetCommunityRule`, `GetGovernanceProposal`. Events `governance_proposal.opened`, `governance_proposal.decided`, `community_rule.published`.

## Relationships, dependencies and integration
Upstream: CTR-CAP-001 (steward roles), CTR-ERR-001, CTR-EVT-001. Downstream: mod_goods, mod_jurisdictions, mod_prohibited (approval IDs), mod_transparency (decision counts). Community members are identified by `acc_` ID only.

## Data ownership
Owns community rule versions, proposals, votes and decisions. Does not own legal rules (mod_jurisdictions), prohibited-item rules (mod_prohibited) or enforcement cases (F12).

## Risk considerations
Capture of decisions by a small group; votes that reveal individual choices; unauthorized rule changes; rule edits that alter the meaning of past decisions; approval IDs reused across unrelated changes.

## Completion criteria
Decision procedure approved by Governance Lead and Privacy Lead; approval IDs single-use; rule versions reproducible in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-147-01 drafted
- [x] `validation_rules.md` — PS-147-02 drafted
- [x] `workflow_state_machine.md` — PS-147-03 drafted
- [x] `commands_queries_events.md` — PS-147-04 drafted
- [x] `authorization_capabilities.md` — PS-147-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-147-06 drafted
- [x] `privacy_retention_abuse.md` — PS-147-07 drafted
- [x] `observability_performance.md` — PS-147-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-147-09 drafted
- [x] `import_export_backup_rollback.md` — PS-147-10 drafted

## Assumptions and open decisions
- ASSUMPTION: community governance is steward-based in MVP; a member vote is a Future feature.
- D01 (federated record protocol), default "versioned signed envelopes and explicit opt-in": PROVISIONAL (D01 default, unapproved), relevant only if decisions are exchanged with peers.
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
