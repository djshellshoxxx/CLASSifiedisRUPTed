# F01.S02.M02 — wanted

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role, F01). **Parent:** F01.S02 (listing_types).

## Purpose and business behavior
Wanted posts let a participant publish a request for an item or service: what they need, quantity, acceptable condition, an optional budget expectation, and a coarse region. Other participants respond through offers and private messages owned by other modules. This module owns the wanted-specific fields and lifecycle of the listing aggregate (`lst_`, `listing_type = wanted`): draft, published, paused, suspended, fulfilled, closed, expired and tombstoned. It also owns the owner and moderation commands that move a post between those states. It does not rank or match posts, move money, or create settlement records. "Fulfilled" is the owner's own statement.

## User stories
- As a buyer, I publish a wanted post with a coarse region and no home address, and I pause or close it when I no longer need it.
- As a seller, I find active wanted posts in my region through discovery and respond through offers, without publishing my contact details in the post.
- As a moderator, I suspend a post under a case reference and restore its prior state when the case closes.
- As an operator, I can turn off new wanted publishing with a feature flag without changing existing posts.

## Scope
- Ten process specifications, listed under the inventory below. Registry IDs PS-007-01 to PS-007-10 in `planning/SPEC_REGISTRY.md`.
- Out of scope: ranking and search (06_Discovery), offers and negotiation (04_pricing/mod_offers), messaging (08_Communications), moderation case handling (12_Moderation), payments and settlement (09_Commerce).

## Public interfaces
Commands: `wanted.create`, `update`, `publish`, `pause`, `resume`, `fulfill`, `close`, `renew`, `delete`; moderation `suspend`, `reinstate`, `remove`. Queries: `wanted.get`, `wanted.list_mine`. Events: `listing.*` with payload fragment `listing.wanted_fields` 1.0.0. Error codes: `WANTED.*`. Signatures, idempotency and versions in PS-007-04 and PS-007-02.

## Relationships, dependencies and integration
Upstream: F07 (`acc_` sessions, `prf_` pseudonyms), F10 (region cells, data classes, retention), F15 (IDs, events, idempotency), F16 (capabilities, decisions). Downstream: 06_Discovery index (projection), 04_pricing/mod_offers (targets of responses), F12 (case references and suspensions), F13 (generic notifications), F11 (federated export). Blocking dependency: PENDING CTR-LST-001 (common listing aggregate). Integration requires contract tests (PS-007-09) and explicit timeouts and retries (PS-007-06).

## Data ownership
This module owns wanted-type fields and their lifecycle on `lst_` records. It shares the `lst_` ID space with the F01 listing core. Identity credentials, messages, moderation cases, region registry and any payment evidence belong to their own features. Export and deletion follow PS-007-07 and PS-007-10.

## Risk considerations
A wanted post publicly declares buying intent and a region cell. Repeated posts can link a pseudonym by region and category (graph deanonymization). Scammers use wanted posts to ask for advance deposits or to collect contact details. Budget fields act as price anchors. Owner-declared fulfilment can be false and mislead other users. Duplicate and spam posts inflate response queues. Offline edits on two devices can conflict. Pseudonyms do not guarantee anonymity. This module holds no money and creates no payment evidence.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; PENDING CTR-LST-001 resolved; all `WANTED.*` codes in the CTR-ERR-001 registry; PS-007-09 traceability at 100%; privacy and security review scheduled (not yet performed).

## Required process specification inventory
- [x] `domain_schema.md` — PS-007-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-007-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-007-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-007-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-007-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-007-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-007-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-007-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-007-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-007-10, SPEC-DRAFT-COMPLETE
