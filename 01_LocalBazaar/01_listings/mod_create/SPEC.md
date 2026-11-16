# F01.S01.M01 — create

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** [F01.S01 listings](../SPEC.md).

## Purpose and business behavior
Lets an authenticated account save a new listing as a private draft (`lst_`, state `draft`, revision 1) for one of three listing types: `sell`, `giveaway`, `wanted`. A draft is visible only to its owner. Create does not publish, reserve, price-match or transact. It records the owner's own statement of what is offered or wanted. Create accepts only a registered region cell, never exact coordinates or an address, and takes the owner from the session, never from the body. Each create is idempotent, so retries and offline replays cannot produce duplicate drafts.

User stories:
- As a seller, I save a draft with a title, category and asking price, and get the listing ID at once, even if my connection drops and returns.
- As someone giving an item away, I post a giveaway with no price, and the form tells me which fields it needs.
- As a participant, I never see another person's draft, and my draft does not show my home address.
- As an operator, I can switch off one listing type without disabling create for the others.

## Scope
Ten process specifications, each listed in the inventory below. Edit, publish, archive and listing-type rules belong to sibling modules and are referenced by ID only.

## Public interfaces
- Command `listing.create` (idempotent, CTR-EVT-001 R03). Spec: PS-002-04.
- Event `listing.created` (revision 1; payload has no title, description or price). Spec: PS-002-04.
- Capability `lst.create` (scope `self`, CTR-CAP-001). Spec: PS-002-05.
- Module error codes: `LST.FIELD_INVALID` (400), `LST.TYPE_DISABLED` (422), `LST.ACCOUNT_NOT_ELIGIBLE` (403), `LST.DRAFT_LIMIT_REACHED` (422). All non-retryable. Module token `LST` is used because CTR-ERR-001 R02 requires an uppercase module token; the slug `mod_create` is not valid there (ASSUMPTION).
- Shared codes reused: `SYS.*`, `EVT.*`, `ID.MALFORMED`, `SCH.UNKNOWN_VERSION`, `PRV.PRECISE_LOCATION_FORBIDDEN` (PENDING F10 confirmation on this path).

## Relationships, dependencies and integration
Upstream: F07 account state (eligibility), F16 decisions (CTR-CAP-001), F10 region cells and data classes (CTR-PRV-001), F15 envelope, ID, schema and error registries (CTR-EVT-001, CTR-ID-001, CTR-SCH-001, CTR-ERR-001), 02_listing_types (type rules), category taxonomy (owner OPEN).
Downstream: mod_edit (reads and updates drafts), mod_publish (draft to published), mod_archive (discard), F12 aggregate signals (mod_spam, mod_risk), observability.
Integration: contract tests in PS-002-09; 5 s commit deadline; clients retry with the same idempotency key.

## Data ownership
Owns `listing.draft` records created by this module and the create idempotency rows (7-day retention). Does not own account identity, region-cell definitions, currency registry or taxonomy. `owner_ref` is a reference to an F07 `acc_` record.

## Risk considerations
- Draft content leaking through `listing.created`, logs or error bodies (PS-002-04, PS-002-07, PS-002-08).
- Personal data typed into title or description; create cannot guarantee detection (residual, PS-002-07).
- Location exposure through coordinates or addresses in the body, or through a wrongly derived cell (PS-002-02 R04, R12).
- Spam drafts and fake giveaway or wanted posts (quotas and aggregate signals, PS-002-07).
- Duplicate drafts from offline replay or lost responses; key reuse (PS-002-06).
- Draft visibility misread as public (owner-only field visibility, PS-002-05).
- Accessibility regressions in form error messages (PS-002-09).
No platform custody of money: `asking_price` is a stated figure, not a payment. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten process specifications reach SPEC-DRAFT-COMPLETE and pass owner review. D03, D05, D07 and D08 are resolved or accepted by their owners. F10, F15 and F16 review the contracts this module uses. Implementation, tests and privacy and security review pass in later phases.

## Required process specification inventory
- [x] `domain_schema.md` — PS-002-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-002-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-002-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-002-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-002-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-002-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-002-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-002-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-002-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-002-10 — SPEC-DRAFT-COMPLETE (pending approval)
