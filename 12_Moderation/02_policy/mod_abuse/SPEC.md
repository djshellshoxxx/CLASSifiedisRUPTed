# F12.S02.M03 — Abuse policy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S02](../SPEC.md). **Process IDs:** PS-095-01…PS-095-10. **Code:** `packages/moderation/src/policy/abuse`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A relay's community and hosting policy as versioned rules with stable IDs (for example POL-FRAUD-001). Moderator actions, statements of reasons and appeals cite rule ID and version. A relay operator drafts, publishes and retires rules; each published rule version is signed by the relay as a public policy statement that vaults can fetch, pin and compare, so users can see what a relay enforces before they choose it. Rules describe what the relay hosts and indexes; they are not law and not a global standard. Prohibited goods rules are owned by F18 and are referenced here by ID.

## Responsibilities

- [object Object]
- Provide a seed set of 12 rule families that a relay can adopt, edit or replace before publishing.
- Publish each rule version as a relay-signed statement (classrup.moderation.policy/v1) and an index of current versions.
- Keep retired and superseded versions readable forever so old statements of reasons remain understandable.
- Cross-reference prohibited-goods rules from F18.S01.M02 by rule ID without copying their content.

## Not responsible for

- Applying rules to content (F12.S02.M01) and detecting violations (F12.S02.M02).
- Prohibited goods rule sets and jurisdiction logic (F18.S01.M02, F18.S01.M01).
- Community decision-making on policy changes (F18.S02.M01); this module records the published result.
- Future: per-community rule overlays; machine-readable rule tests; translations beyond the operator's locales.

## User stories

- As a prospective member, I can read a relay's rules and their change history before I choose it.
- As a relay operator, I publish a revised rule with a changelog and an effective date at least 14 days ahead for restrictive changes.
- As a moderator, I pick a rule from a list with its full text and allowed actions when I decide a case.

## Edge cases

- A rule is edited after actions cited it; editing creates a new version and old actions keep citing the older version, which stays readable.
- Two operators publish different edits of one rule at once; the second returns CONFLICT_REVISION.
- A restrictive rule is published with an effective date less than 14 days away; refused with MODERATION_POLICY_NOTICE_TOO_SHORT except for rules marked imminent_harm.
- A rule text exists only in English but the user's locale is German; the vault shows the English text labelled with its language.
- A rule references a prohibited-goods rule ID that F18 later retires; the reference shows 'retired' and moderators cannot cite the rule for new actions.
- Relay signing key rotates; older rule statements stay verifiable through the key registry history in F16.S02.M02.

## UX and accessibility

- Public policy page: rule list grouped by family, each with ID, current version, effective date, short and full text, changelog.
- Operator rule editor: locale tabs, severity, allowed action ladder, effective date, changelog, preview of how it appears in a statement of reasons.
- Moderator rule picker: searchable list showing ID, one-line summary and allowed actions.

**States:** loading; draft; scheduled; in-force; retired; error

**Accessibility:** Policy page is a semantic heading hierarchy with a skip link to each family.; Version history is a list with dates in text form, not color-coded only.; Editor fields have labels, error messages linked by aria-describedby, and 44 by 44 px controls.

## Owned data

- `PolicyRule` (classrup.moderation.policyrule/v1, P0, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.policyrule.draft`, `moderation.policyrule.publish`, `moderation.policyrule.retire`
- Queries: `moderation.policyrule.list_public`, `moderation.policyrule.get_version`
- Emits: `moderation.policy.published`
- Consumes: `governance.policy_proposal.decided`, `governance.prohibited_rule.changed`

## Dependencies

F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-095-01 | [Domain schema](domain_schema.md) | 3 |
| PS-095-02 | [Validation rules](validation_rules.md) | 3 |
| PS-095-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-095-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-095-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-095-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-095-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-095-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-095-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-095-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/policy/abuse/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Published rule versions are immutable and every action's citation resolves to the exact text in force at decision time.
- Seed set of 12 rule families is available for adoption in a fresh relay.
