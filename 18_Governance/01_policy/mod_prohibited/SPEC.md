# F18.S01.M02 — Prohibited items

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S01](../SPEC.md). **Process IDs:** PS-146-01…PS-146-10. **Code:** `packages/governance/src/policy/prohibited`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A versioned set of prohibited-item rules (categories and keyword phrases) evaluated when a listing is published or edited. Each rule has an action: block, review (the owner must read a notice and confirm), or allow_with_notice. Rules are authored by a publisher (the project's bundled pack or a relay operator), released as signed rule packs (classrup.governance.rule_pack/v1) that declare the taxonomy they are scoped to and embed the decisions approving newly activated rules, and evaluated locally in the user's vault, so publishing works offline. Receiving vaults verify decisions only for rules that are new or changed for them, at the time the rule was first activated, so long-approved rules in full snapshots keep applying. A relay applies its operator's pack to what it hosts. A pack change never removes a user's publications by itself: the owner decides. Rules are configuration, not a legal determination, and evasion is possible; the evaluation is a safeguard, not a guarantee.

## Responsibilities

- [object Object]
- Evaluate listing text, tags and category against all applied packs deterministically, with a result that names rule keys with their publishers, reason keys and the evaluated packs, but not the matched text.
- Author, version and release rule packs in a publisher vault; an emergency review-level rule may be active for at most 7 days in any 30-day window without a proposal, and everything else needs a verified approved decision from F18.S02.M01.
- Verify and store rule packs in any vault, enforce emergency limits from stored pack history, and re-announce changes so active publications can be re-evaluated.
- Apply the relay operator's pack as the relay's hosting policy through relay_upload and serve it unchanged.

## Not responsible for

- Deciding what is legal or illegal in a place; rules are configuration (see F18.S01.M01 disclaimers).
- Enforcement against users, takedowns or suspensions (relay moderation F12 and local filtering); this module returns verdicts only, and F01.S01.M03 holds affected publications for their owner.
- Image and file inspection; only text, tags and category are evaluated.
- Taxonomy (F18.S01.M03), policy proposals (F18.S02.M01) and the trusted-publisher list and pending inbox (F18.S02.M01).
- Future: image hash lists from trusted publishers and per-rule appeal workflows.

## User stories

- As a seller, if my text matches a blocking rule I see which policy reason applies and can edit my listing.
- As a seller, if my item needs a notice, I read it and confirm before publishing.
- As a seller, if a new rule pack blocks one of my live listings, I am told and decide myself whether to edit or unpublish it.
- As a relay operator, I publish a rule pack for my community after a comment period and can add a temporary review-level rule against a new scam.

## Edge cases

- Text uses look-alike characters or zero-width characters to dodge a keyword; evaluation normalizes NFKC, case-folds, strips zero-width and diacritics and maps common look-alikes before matching.
- A harmless word matches a phrase inside another word (the Scunthorpe problem); whole-word matching is the default and phrase matching needs explicit mode.
- Two rules match with different actions; the strictest action wins (block over review over allow_with_notice over allow) and all matched rule keys are reported up to 10.
- An emergency rule reaches its effective expiry without ratification; it is retired automatically and the retirement is announced.
- A rule pack is applied while publications are active; the changed event triggers re-evaluation, and a new block verdict holds the publication for its owner (policy_attention in F01.S01.M03, owner notified, renewals and edits that keep the blocked content stop); it is unpublished and tombstoned only after the owner confirms.
- A pack with 2 001 active rules or a phrase longer than 60 code points is rejected before evaluation can be slowed.
- The pack publisher is not trusted by this vault; the pack waits in the F18.S02.M01 pending inbox and the previous pack stays in force.
- Evaluation input is 100 000 code points; it is rejected with VALIDATION_FAILED before matching starts.
- A publisher re-issues the same emergency rule key every week or future-dates its activation; receivers cap it at 7 days from first sight and refuse a second emergency activation within 30 days with GOVERNANCE_RULE_EMERGENCY_INVALID.
- A new user, or a vault offline for 45 days, applies a full snapshot whose rules were approved long ago; each rule's decision is checked at the anchored time its version was first activated, so the pack applies.
- The pack's rules are scoped to a taxonomy the vault does not hold; those rules are stored scope_unresolved and use the fallback (exact category id match, keyword match capped at review).

## UX and accessibility

- Policy result sheet at publish: verdict, list of reason texts (localized from reason keys) with the publisher of each rule, notice text, Fix and Confirm actions; no matched text is shown.
- Rule pack settings: applied packs per publisher, fingerprint, version, age, scope_unresolved rules, pending packs with diff summary.
- Operator editor: rule list with action, scope, keywords, sensitive toggle (the signed pack carries only salted hashes; the editor states that this hides the terms from casual reading but not from dictionary search), emergency toggle with expiry, proposal reference, release button.

**States:** loading; empty; pending-trust; pack-applied; verdict-allow; verdict-notice; verdict-review; verdict-block; policy-attention; offline-cached

**Accessibility:** Verdicts are expressed in text and icon; reasons are plain sentences.; Confirm and Fix buttons are at least 44x44 px; the result sheet is a dialog with focus trap and announced heading.; Operator rule table has headers and row actions with accessible names.

## Owned data

- `ProhibitedRule` (classrup.governance.prohibited_rule/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `governance.prohibited_rule.draft`, `governance.prohibited_rule.retire`, `governance.prohibited_rule.release_pack`, `governance.prohibited_rule.apply_pack`, `governance.prohibited_rule.relay_upload`
- Queries: `governance.prohibited_rule.evaluate`, `governance.prohibited_rule.get`, `governance.prohibited_rule.list_active`, `governance.prohibited_rule.relay_latest`
- Emits: `governance.prohibited_rule.changed`
- Consumes: `governance.category.changed`, `governance.policy_proposal.decided`

## Dependencies

F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-146-01 | [Domain schema](domain_schema.md) | 5 |
| PS-146-02 | [Validation rules](validation_rules.md) | 5 |
| PS-146-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-146-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-146-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-146-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-146-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-146-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-146-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-146-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/policy/prohibited/index.ts`.

## Acceptance criteria

- All tests T01-T24 pass in CI.
- Blocking and review rules are never activated in any vault without a verified approved decision for that publisher and content, except emergency review rules within their 7-day window and the 30-day emergency limit.
- Evaluation is deterministic, bounded to 20 ms p95 (30 ms with sensitive rules), offline capable, never stores or logs listing text, and a pack change never unpublishes a listing without its owner's confirmation.
