# F18.S01.M02 — prohibited (prohibited-goods and content rule catalogue)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Governance Lead (F18). **Parent:** [F18.S01 policy](../SPEC.md).

## Purpose and business behavior
Maintain the catalogue of prohibited and restricted goods and content classes, and the classification decision that applies it to a listing draft: `permitted`, `restricted` (routed for review), or `prohibited` (blocked, with a reason key). The catalogue is written as categories, attributes and reason keys, not as detection signals, so it can be published without helping abusers evade detection. Moderation cases are handled by F12; this module supplies the rule basis.

## User stories
- As a listing author, I see a clear reason key and next step when my draft is blocked or routed for review.
- As a moderator, I see which catalogue rule a case relies on.
- As a policy editor, I can add or retire a class with a source reference.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-146-01 to PS-146-10.

## Public interfaces
Commands `ProposeProhibitionRule`, `PublishProhibitionRule`, `RetireProhibitionRule`, `ClassifyListingDraft`. Queries `GetProhibitionRules`, `GetClassificationDecision`. Events `prohibition_rule.published`, `prohibition_rule.retired`, `classification.recorded`.

## Relationships, dependencies and integration
Upstream: [mod_goods](../mod_goods/SPEC.md) category keys, [mod_jurisdictions](../mod_jurisdictions/SPEC.md) rule IDs, [mod_governance](../../02_community/mod_governance/SPEC.md) approvals, CTR-CAP-001, CTR-ERR-001. Downstream: F01 listing submission, F12 moderation cases (referenced by `cas_` ID).

## Data ownership
Owns rule catalogue entries and classification decisions (outcome, reason key, rule IDs). Does not own listing content, moderation case records or user reports.

## Risk considerations
Over-blocking legitimate goods; under-blocking restricted goods; catalogue leaking detection logic to abusers; decisions that store listing text; inconsistent results for identical drafts across regions; reason keys that reveal protected attributes.

## Completion criteria
Catalogue v1 approved by Governance Lead, Trust and Safety Lead (F12) and Privacy Lead; classification decisions reproducible from pinned rule versions in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-146-01 drafted
- [x] `validation_rules.md` — PS-146-02 drafted
- [x] `workflow_state_machine.md` — PS-146-03 drafted
- [x] `commands_queries_events.md` — PS-146-04 drafted
- [x] `authorization_capabilities.md` — PS-146-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-146-06 drafted
- [x] `privacy_retention_abuse.md` — PS-146-07 drafted
- [x] `observability_performance.md` — PS-146-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-146-09 drafted
- [x] `import_export_backup_rollback.md` — PS-146-10 drafted

## Assumptions and open decisions
- ASSUMPTION: classification is rule-based in MVP; no automated machine-learning classifier is in scope.
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
