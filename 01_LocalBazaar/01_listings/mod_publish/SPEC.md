# F01.S01.M03 — publish

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** F01.S01 ([listings SPEC](../SPEC.md)).

## Purpose and business behavior
Move a listing from `draft` to `published` (publicly discoverable; federated only with owner opt-in) or to `held_review` (not discoverable until moderation clears it). Publishing is an explicit owner command with a revision check, server-side validation and one `listing.published` event. Publishing is not a sale, reservation, price agreement or completed transaction. It creates no obligation between parties and holds no funds.

## User stories
- As a seller using a pseudonym, I publish a complete draft and see its state and expiry date. My home address does not appear in the listing.
- As a seller whose listing is held, I see a plain reason ("under review: possible personal data") and my next step. I do not see moderator identities or case details.
- As a moderator with a case grant, I clear or reject a held publication. The decision is recorded and the seller sees only the outcome category.
- As an operator, I disable publishing with a feature flag. Drafts and events stay intact.

## Scope
In scope: owner publish command; automated hold outcome (PII pattern match, risk verdict, duplicate listing); moderator release or rejection of a hold; publish-state query.

Out of scope (owned elsewhere): draft creation and content edits (mod_create, mod_edit); archive, expiry and restore (mod_archive); listing kinds (02_listing_types); discovery indexing (06_Discovery); media scanning (owner PENDING); paid-listing entitlements (F09, Future).

Process specifications (all SPEC-DRAFT-COMPLETE):
- [domain_schema.md](domain_schema.md)
- [validation_rules.md](validation_rules.md)
- [workflow_state_machine.md](workflow_state_machine.md)
- [commands_queries_events.md](commands_queries_events.md)
- [authorization_capabilities.md](authorization_capabilities.md)
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md)
- [privacy_retention_abuse.md](privacy_retention_abuse.md)
- [observability_performance.md](observability_performance.md)
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md)
- [import_export_backup_rollback.md](import_export_backup_rollback.md)

## Public interfaces
- Command: `lst.publish` (v1.0.0), idempotency key required, `expected_revision` required.
- Query: `lst.get_publish_state`.
- Events: `listing.published`, `listing.publish_held`, `listing.publish_rejected` (CTR-EVT-001 envelope; CTR-SCH-001 payloads).
- Consumed events: `cas.cleared`, `cas.rejected` (PENDING CTR-MOD-001).
- Errors: `PUB.*` (eight codes, see validation_rules.md) plus shared `SYS.*`, `EVT.*`, `ID.*`.

## Relationships, dependencies and integration
Upstream: mod_create and mod_edit (draft content, `revision`); F07 identity (`acc_`, account restriction); F12 risk verdict and moderation cases (PENDING CTR-MOD-001); F06 region-cell registry (PENDING CTR-REG-001). Downstream: discovery index (F06, outbox, at-least-once); federation export (F11, CTR-FED-001, opt-in only); notifications (F13, generic text only); audit (F16). Shared contracts are referenced by ID only: CTR-ID-001, CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001. Timeouts: risk verdict 300 ms, then fail closed to hold.

## Data ownership
Owns the publish fields on the `lst_` aggregate (`state`, `published_at`, `expires_at`, `duration_days`, `hold`) and the three publish event types. Does not own listing content (mod_create, mod_edit), moderation cases and reports (F12, `cas_`/`rpt_`), account state (F07), or the region registry (F06/F10). Export and deletion follow CTR-PRV-001 retention and legal-hold rules.

## Risk considerations
Home-address or contact details typed into a title or description and published, which the PII pattern scan may miss. Region triangulation through repeated publish probes. Sybil accounts flooding listings. Offline replay of a publish made before a moderation hold. A stale revision overriding a hold placed in parallel. Federated re-publication of held or rejected content. Discovery lag after a committed publish. Accessibility regressions in state messaging. No platform custody of money; pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specs are SPEC-DRAFT-COMPLETE with TEST-PS-004-* IDs. PENDING CTR-LST-001, CTR-MOD-001 and CTR-REG-001 are resolved or accepted by their owners. OPEN-1 (`price` data class) and D03, D05, D07, D08, D10 defaults are reviewed by the named owners. Privacy and security review pass is a future gate; it is not claimed here.

## Required process specification inventory
- [x] `domain_schema.md` — PS-004-01 — SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-004-02 — SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-004-03 — SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-004-04 — SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-004-05 — SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-004-06 — SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-004-07 — SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-004-08 — SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-004-09 — SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-004-10 — SPEC-DRAFT-COMPLETE
