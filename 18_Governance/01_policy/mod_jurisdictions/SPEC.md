# F18.S01.M01 — jurisdictions (legal-rule register by region)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Governance Lead (F18). **Parent:** [F18.S01 policy](../SPEC.md).

## Purpose and business behavior
Hold the versioned register of jurisdiction rules: for each coarse region, which goods categories, listing types and service types are permitted, restricted, subject to disclosure, or prohibited, and which rule text version applies. Consumers ([mod_prohibited](../mod_prohibited/SPEC.md), listing validation in F01) read the register to apply the rule for a listing's region. This module records what a rule says and who approved it; it is not legal advice and does not decide any individual case.

## User stories
- As a policy editor, I publish a rule for a region with its source reference and approval.
- As a participant, I see which disclosures apply to my listing's region before I publish.
- As an auditor, I can see which rule version applied to a past decision.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-145-01 to PS-145-10.

## Public interfaces
Commands `ProposeJurisdictionRule`, `PublishJurisdictionRule`, `WithdrawJurisdictionRule`. Queries `GetJurisdictionRules`, `ListJurisdictionRuleVersions`. Events `jurisdiction_rule.proposed`, `jurisdiction_rule.published`, `jurisdiction_rule.withdrawn`.

## Relationships, dependencies and integration
Upstream: [mod_goods](../mod_goods/SPEC.md) category keys; [mod_governance](../../02_community/mod_governance/SPEC.md) approvals; CTR-PRV-001 (region precision class LOCATION_COARSE); CTR-CAP-001. Downstream: mod_prohibited, F01 listing validation, F12 moderation references.

## Data ownership
Owns rule records, region codes and rule-version history. Does not own user location (F10 and D05 govern it), listings or individual enforcement decisions.

## Risk considerations
Wrong or outdated legal mapping applied to listings; rule text presented as legal advice; region inference that exposes a user's location; withdrawn rules still applied to old decisions; approval without a linked source reference.

## Completion criteria
Register structure approved by Governance Lead and Privacy Lead; every published rule has a source reference and approver; rule-version lookup reproducible for past decisions in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-145-01 drafted
- [x] `validation_rules.md` — PS-145-02 drafted
- [x] `workflow_state_machine.md` — PS-145-03 drafted
- [x] `commands_queries_events.md` — PS-145-04 drafted
- [x] `authorization_capabilities.md` — PS-145-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-145-06 drafted
- [x] `privacy_retention_abuse.md` — PS-145-07 drafted
- [x] `observability_performance.md` — PS-145-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-145-09 drafted
- [x] `import_export_backup_rollback.md` — PS-145-10 drafted

## Assumptions and open decisions
- ASSUMPTION: rule content is supplied by qualified reviewers outside this repository; this module stores their output.
- D05 (geoprivacy), default "coarse public regions and user-initiated precision disclosure": PROVISIONAL (D05 default, unapproved).
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
