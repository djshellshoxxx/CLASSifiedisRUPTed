# F18.S01.M02 — Prohibited items

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S01](../SPEC.md). **Process IDs:** PS-146-01…PS-146-10. **Code:** `packages/governance/src/policy/prohibited`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A versioned set of prohibited-item rules (categories and keyword phrases) evaluated when a listing is published or edited. Each rule has an action: block, review (the owner must read a notice and confirm), or allow_with_notice. Rules are authored by a publisher (the project's bundled pack or a relay operator), released as signed rule packs (classrup.governance.rule_pack/v1), and evaluated locally in the user's vault, so publishing works offline. A relay applies its own rule pack to what it hosts. Rules are configuration, not a legal determination, and evasion is possible; the evaluation is a safeguard, not a guarantee.

## Responsibilities

- [object Object]
- Evaluate listing text, tags and category against the active rule pack deterministically, with a result that names rule keys and reason keys but not the matched text.
- Author, version and release rule packs in a publisher vault; an emergency review-level rule may be active for at most 7 days without a proposal, and everything else needs a verified approved decision from F18.S02.M01.
- Verify and store rule packs in any vault and re-announce changes so active publications can be re-evaluated.

## Not responsible for

- Deciding what is legal or illegal in a place; rules are configuration (see F18.S01.M01 disclaimers).
- Enforcement against users, takedowns or suspensions (relay moderation F12 and local filtering); this module returns verdicts only.
- Image and file inspection; only text, tags and category are evaluated.
- Taxonomy (F18.S01.M03) and policy proposals (F18.S02.M01).
- Future: image hash lists from trusted publishers and per-rule appeal workflows.

## User stories

- As a seller, if my text matches a blocking rule I see which policy reason applies and can edit my listing.
- As a seller, if my item needs a notice, I read it and confirm before publishing.
- As a relay operator, I publish a rule pack for my community after a comment period and can add a temporary review-level rule against a new scam.

## Edge cases

- Text uses look-alike characters or zero-width characters to dodge a keyword; evaluation normalizes NFKC, case-folds, strips zero-width and diacritics and maps common look-alikes before matching.
- A harmless word matches a phrase inside another word (the Scunthorpe problem); whole-word matching is the default and phrase matching needs explicit mode.
- Two rules match with different actions; the strictest action wins (block over review over allow_with_notice over allow) and all matched rule keys are reported up to 10.
- An emergency rule reaches its 7-day limit without ratification; it is retired automatically and the retirement is announced.
- A rule pack is applied while publications are active; the changed event triggers re-evaluation and a new block verdict ends the publication in F01.S01.M03.
- A pack with 10 001 rules or a phrase longer than 60 code points is rejected before evaluation can be slowed.
- The pack publisher is not trusted by this vault; the pack stays pending and the previous pack stays in force.
- Evaluation input is 100 000 code points; it is rejected with VALIDATION_FAILED before matching starts.

## UX and accessibility

- Policy result sheet at publish: verdict, list of reason texts (localized from reason keys), notice text, Fix and Confirm actions; no matched text is shown.
- Rule pack settings: current pack, publisher fingerprint, version, age, pending packs with diff summary.
- Operator editor: rule list with action, scope, keywords (masked in the public view of the pack when marked sensitive), emergency toggle with expiry, release button.

**States:** loading; empty; pending-trust; pack-applied; verdict-allow; verdict-notice; verdict-review; verdict-block; offline-cached

**Accessibility:** Verdicts are expressed in text and icon; reasons are plain sentences.; Confirm and Fix buttons are at least 44x44 px; the result sheet is a dialog with focus trap and announced heading.; Operator rule table has headers and row actions with accessible names.

## Owned data

- `ProhibitedRule` (classrup.governance.prohibited_rule/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `governance.prohibited_rule.draft`, `governance.prohibited_rule.retire`, `governance.prohibited_rule.release_pack`, `governance.prohibited_rule.apply_pack`
- Queries: `governance.prohibited_rule.evaluate`, `governance.prohibited_rule.get`, `governance.prohibited_rule.list_active`
- Emits: `governance.prohibited_rule.changed`
- Consumes: `governance.category.changed`

## Dependencies

F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-146-01 | [Domain schema](domain_schema.md) | 3 |
| PS-146-02 | [Validation rules](validation_rules.md) | 3 |
| PS-146-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-146-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-146-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-146-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-146-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-146-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-146-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-146-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/policy/prohibited/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Blocking and review rules are never activated without a verified approved decision; emergency rules are review-level and expire within 7 days.
- Evaluation is deterministic, bounded to 20 ms p95, offline capable, and never stores or logs listing text.
