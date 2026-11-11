# F01.S01.M02 — Listing editing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S01](../SPEC.md). **Process IDs:** PS-003-01…PS-003-10. **Code:** `packages/bazaar/src/listings/edit`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets the owner revise a draft or published listing in the local vault with optimistic concurrency, records an immutable ListingRevision for every non-draft change, and detects material changes (price, condition, category). A material change on a published listing is announced by event so offers and negotiations can flag their assumptions, and the owner is offered a re-publish that sends a new signed projection (F01.S01.M03). Material edits are refused while an auction on the listing has bids (N11). The module never changes what other parties already hold; their copies change only when they accept the new statement.

## Responsibilities

- Apply owner edits to Listing through bazaar.listing.apply_edit with expectedRevision and no silent merging.
- Own ListingRevision, an immutable snapshot of public fields per non-draft change, up to 100 per listing.
- Detect material changes (price, condition, category) and set the material flag and changedFields on bazaar.listing.edited.
- Provide the system command bazaar.listing_revision.record so F01.S02.M01 (price), F01.S02.M02 (want spec) and F01.S03.M02 (variant price) report their changes as listing revisions inside their own transaction.
- Re-run local prohibited-item rules on edits of published listings.
- Refuse material edits while an auction on the listing has at least one bid, tracked from consumed auction events (N11).
- Keep revisions cited by offers, negotiations or deals for the evidence window when the listing is purged.

## Not responsible for

- Creating listings and the Listing status field (F01.S01.M01).
- Signing and sending the updated public projection (F01.S01.M03); this module only marks the listing as having unsent changes.
- Notifying offerers; offers (F01.S04.M01) and negotiations (F01.S04.M02) consume bazaar.listing.edited and notify through F13.
- Auction bidding and close (F04); this module only reads their events in the seller's vault.
- Future: three-way merge of concurrent edits from two devices.

## User stories

- As a seller, I can fix a typo in my published listing and see that it is not treated as a price change.
- As a seller, I am told before I save that changing the price or condition will mark open offers as based on an older version.
- As a seller, I can see the history of changes to my listing and which ones were material.
- As a bidder, I can rely on the condition and category of an auctioned item not changing after I bid.

## Edge cases

- Edit with a stale expectedRevision (second tab) returns CONFLICT_REVISION and the draft form keeps the user's text for manual resolution.
- A price change is recorded by the sell-terms module and a title edit lands in the same second; both revisions are recorded in order and each emits its own event.
- An edit to a published listing introduces a blocked keyword; it is refused with BAZAAR_EDIT_POLICY_BLOCKED and the listing keeps its last good revision.
- Category changes to one that the active policy pack marks restricted; the edit is refused with BAZAAR_EDIT_POLICY_BLOCKED and params.verdict set.
- The listing reaches 100 revisions; the next edit returns BAZAAR_EDIT_REVISION_LIMIT and suggests archiving and relisting.
- An edit arrives for an expired, closed or archived listing; CONFLICT_STATE is returned.
- The owner edits a published listing offline; the edit is committed locally and the UI shows that other parties still see the earlier version until the new projection is sent.
- An auction on the listing has one bid and the seller changes the condition; BAZAAR_EDIT_AUCTION_HAS_BIDS is returned while a title typo fix is still allowed.
- The listing is purged 90 days after archive while a two-year-old accepted offer cites revision 4; revision 4 and later rows are kept as evidence, the rest of the listing content is purged.

## UX and accessibility

- Edit listing form: same fields as creation, diff summary before save with a Material change badge for price, condition and category.
- History view: list of revisions with date, changed field names and material marker; tap shows the saved snapshot.
- Unsent changes banner: Your edit is saved on this device. Others still see the previous version until you update the listing.

**States:** loading; saving-local; saved-local; unsent-changes; conflict; policy-blocked; revision-limit; auction-has-bids

**Accessibility:** Material change badges have text, not colour alone.; Diff summary is a table with row and column headers readable by screen readers.; Conflict dialog is announced assertively and focus moves to its first action.

## Owned data

- `ListingRevision` (classrup.bazaar.listing_revision/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.listing.edit`, `bazaar.listing_revision.record`
- Queries: `bazaar.listing_revision.list`, `bazaar.listing_revision.get`
- Emits: `bazaar.listing.edited`
- Consumes: `bazaar.listing.published`, `bazaar.publication.renewed`, `bazaar.listing.deleted`, `auctions.auction.scheduled`, `auctions.bid.placed`, `auctions.auction.cancelled`, `auctions.auction.unsold`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F18.S01.M02, F18.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-003-01 | [Domain schema](domain_schema.md) | 4 |
| PS-003-02 | [Validation rules](validation_rules.md) | 4 |
| PS-003-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-003-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-003-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-003-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-003-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-003-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-003-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-003-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listings/edit/index.ts`.

## Acceptance criteria

- All tests T01-T19 pass in CI.
- A material change always produces bazaar.listing.edited with material true and never carries field values.
- No edit path changes Listing.status or bypasses expectedRevision, and no material edit succeeds while an auction on the listing has bids.
