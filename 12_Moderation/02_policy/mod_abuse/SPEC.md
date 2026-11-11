# F12.S02.M03 — Abuse policy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S02](../SPEC.md). **Process IDs:** PS-095-01…PS-095-10. **Code:** `packages/moderation/src/policy/abuse`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A relay's community and hosting policy as versioned rules with stable IDs (for example POL-FRAUD-001). Moderator actions, statements of reasons and appeals cite rule ID and version, and only a version in force at the decision time can be cited. A relay operator drafts, publishes and retires rules; each version declares its change type (initial adoption, restrictive or non-restrictive), restrictive changes need 14 days' notice, and each published version is signed by the relay as a public policy statement that vaults can fetch, pin and compare, so users can see what a relay enforces before they choose it. Rules describe what the relay hosts and indexes; they are not law and not a global standard. Prohibited goods rules are owned by F18.S01.M02 and are referenced here by (publisherId, ruleKey), optionally pinned to one version by ruleId. Approved community decisions about platform policy (F18.S02.M01, targetType platform_policy) arrive on the relay as drafts for operator review and are never published by themselves.

## Responsibilities

- Own the PolicyRule record: stable rule ID, immutable versions, change type, locale texts, severity and allowed action ladder.
- Provide a seed set of 12 rule families that a relay can adopt, edit or replace before publishing, adopted as initial versions with a stated effective date.
- Publish each rule version as a relay-signed statement (classrup.moderation.policy/v1) and an index of current versions with their derived in-force state.
- Answer in-process whether a cited rule version was in force at a decision time (moderation.policyrule.check_citable) for F12.S02.M01 and F12.S01.M03.
- Keep retired and superseded versions readable forever so old statements of reasons remain understandable.
- Cross-reference prohibited-goods rules from F18.S01.M02 by (publisherId, ruleKey), with an optional ruleId naming one exact version, without copying their content.
- Turn relay-scope governance.policy_proposal.decided events of targetType platform_policy with outcome approved into draft PolicyRule versions for operator review, built from the carried proposedChange, and discard the unpublished drafts of a proposal whose outcome becomes conflicted.

## Not responsible for

- Applying rules to content (F12.S02.M01) and detecting violations (F12.S02.M02).
- Prohibited goods rule sets and jurisdiction logic (F18.S01.M02, F18.S01.M01).
- Community decision-making on policy changes (F18.S02.M01); this module records the published result.
- Relay signing key registry and rotation history (F16.S02.M02).
- Future: per-community rule overlays; machine-readable rule tests; translations beyond the operator's locales.

## User stories

- As a prospective member, I can read a relay's rules and their change history before I choose it.
- As a relay operator, I publish a revised rule with a changelog and an effective date at least 14 days ahead for restrictive changes, and a new relay can adopt its first rule set with a stated effective date.
- As a moderator, I pick a rule from a list with its full text and allowed actions when I decide a case, and only versions in force are offered.

## Edge cases

- A rule is edited after actions cited it; editing creates a new version and old actions keep citing the older version, which stays readable.
- Two operators publish different edits of one rule at once; the second returns CONFLICT_REVISION.
- A restrictive rule is published with an effective date less than 14 days away; refused with MODERATION_POLICY_NOTICE_TOO_SHORT except for rules marked imminent_harm.
- A fresh relay adopts the 12 seed families before its first in-force policy; they are initial versions and take effect at their stated effective date, which may be the publication time.
- An operator labels a version non_restrictive although it adds an allowed action; refused with VALIDATION_FAILED because non_restrictive requires a subset of the previous allowed actions and no higher severity.
- A moderator cites version 2 of a rule that is published but scheduled for next week; check_citable reports scheduled and the citation is refused by F12.S02.M01.
- A rule text exists only in English but the user's locale is German; the vault shows the English text labelled with its language.
- A rule references a prohibited-goods rule (publisherId, ruleKey) that the relay's applied F18.S01.M02 pack later retires; the reference shows 'retired', the rule is flagged for operator review and check_citable refuses it for new actions.
- Relay signing key rotates; older rule statements stay verifiable through the key registry history in F16.S02.M02.
- An approved platform_policy decision reaches the relay twice through relay_upload (scope relay) and once as a vault-scope copy; one draft per (decisionCid, ruleId) is created from the carried proposedChange, the vault copy is ignored, and nothing is published until an operator publishes the draft.
- A decision later becomes conflicted (equivocation detected by F18.S02.M01); the unpublished drafts built from it are discarded with reason governance_conflicted, and a version already published from it stays immutable and is flagged for operator review.
- A decided event whose changeDigest does not equal sha256-JCS(proposedChange), or that carries only proposedChangeCid while the proposal statement stored on this relay does not match it, creates no draft and is logged.
- A v1 rule row holds a plain F18 rule version id as prohibitedRuleRef; the expand step resolves it to (publisherId, ruleKey, ruleId) and flags the rule for review when the id cannot be resolved.

## UX and accessibility

- Public policy page: rule list grouped by family, each with ID, current version, change type, effective date, in-force state, short and full text, changelog.
- Operator rule editor: locale tabs, severity, allowed action ladder, change type (initial only before the first in-force policy), effective date, changelog, preview of how it appears in a statement of reasons.
- Moderator rule picker: searchable list of versions in force now, showing ID, one-line summary and allowed actions.

**States:** loading; draft; scheduled; in-force; superseded; retired; error

**Accessibility:** Policy page is a semantic heading hierarchy with a skip link to each family.; Version history is a list with dates in text form, not color-coded only.; Editor fields have labels, error messages linked by aria-describedby, and 44 by 44 px controls.

## Owned data

- `PolicyRule` (classrup.moderation.policyrule/v1, P0, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.policyrule.draft`, `moderation.policyrule.publish`, `moderation.policyrule.retire`
- Queries: `moderation.policyrule.list_public`, `moderation.policyrule.get_version`, `moderation.policyrule.check_citable`
- Emits: `moderation.policy.published`
- Consumes: `governance.policy_proposal.decided`, `governance.prohibited_rule.changed`

## Dependencies

F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-095-01 | [Domain schema](domain_schema.md) | 5 |
| PS-095-02 | [Validation rules](validation_rules.md) | 5 |
| PS-095-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-095-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-095-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-095-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-095-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-095-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-095-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-095-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 4 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/policy/abuse/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI.
- Published rule versions are immutable and every action's citation resolves to the exact text in force at decision time.
- Seed set of 12 rule families is available for adoption in a fresh relay, and restrictive changes always give 14 days' notice.
