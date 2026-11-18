# F18.S01.M03 — goods (controlled goods taxonomy)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Governance Lead (F18). **Parent:** [F18.S01 policy](../SPEC.md).

## Purpose and business behavior
Maintain the controlled taxonomy of goods categories and per-category attributes (condition, quantity unit, safety flags, restriction flags) that listings must use. Restriction flags are inputs to [mod_prohibited](../mod_prohibited/SPEC.md) and [mod_jurisdictions](../mod_jurisdictions/SPEC.md); this module classifies goods but does not decide legality or prohibition.

## User stories
- As a listing author, I pick a category whose name and attributes match what I am offering.
- As a policy reviewer, I see which categories carry restriction flags and which rule versions they reference.
- As a participant searching, I find items in the category they expect.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-144-01 to PS-144-10.

## Public interfaces
Commands `ProposeGoodsCategory`, `PublishGoodsCategory`, `DeprecateGoodsCategory`. Queries `GetGoodsTaxonomyVersion`, `ListGoodsCategories`. Events `goods_category.proposed`, `goods_category.published`, `goods_category.deprecated`.

## Relationships, dependencies and integration
Upstream: governance approval via [mod_governance](../../02_community/mod_governance/SPEC.md); CTR-CAP-001, CTR-ERR-001. Downstream: listing creation and validation in F01, prohibited checks in mod_prohibited, jurisdiction rules in mod_jurisdictions. Consumers reference category keys and taxonomy versions only.

## Data ownership
Owns the taxonomy tree, attribute definitions and their version history. Does not own listings (F01) or legal rules (mod_jurisdictions) or prohibition rules (mod_prohibited).

## Risk considerations
Taxonomy drift between versions that breaks saved listings; ambiguous categories that hide restricted goods; restriction flags set without a linked rule; unreviewed category additions; search bias from category placement.

## Completion criteria
Taxonomy v1 approved by Governance Lead; every restriction flag resolves to a rule ID; migration rules for deprecated categories tested in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-144-01 drafted
- [x] `validation_rules.md` — PS-144-02 drafted
- [x] `workflow_state_machine.md` — PS-144-03 drafted
- [x] `commands_queries_events.md` — PS-144-04 drafted
- [x] `authorization_capabilities.md` — PS-144-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-144-06 drafted
- [x] `privacy_retention_abuse.md` — PS-144-07 drafted
- [x] `observability_performance.md` — PS-144-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-144-09 drafted
- [x] `import_export_backup_rollback.md` — PS-144-10 drafted

## Assumptions and open decisions
- ASSUMPTION: taxonomy is maintained in-platform, not imported from an external standard, for MVP.
- D07 (retention) default: PROVISIONAL (D07 default, unapproved). No other Dxx directly governs taxonomy. See [DECISIONS](../../../DECISIONS.md).
