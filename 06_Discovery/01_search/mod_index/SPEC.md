# F06.S01.M01 — Search index

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S01](../SPEC.md). **Process IDs:** PS-045-01…PS-045-10. **Code:** `packages/discovery/src/search/index`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Builds a full-text (SQLite FTS5) search index over signed public projections of listings, enriched by the signed service-offering, rental-offering and auction statements that refer to the same listing. The same code runs in two places: a local index inside the user's browser vault over the user's own published listings and over projections the vault fetched from relays or imported (received as federation.record.accepted after F11 verification), and an optional relay index over projections ingested by that relay through F11 federation.record.ingest. Only P0 fields and a location cell of at most geohash precision 5 (L0 none, L1 four characters, L2 five characters) are indexed, and only after the author's Ed25519 signature over the projection verifies. The index is derived data: it is rebuilt from retained signed projections, and a signed tombstone or an unpublish removes the text at once. Relay-side decisions (hosting policy, relay_removal advisories, relay-sold promotion, tenant limits) affect only that relay's index or, in a vault, only the copies received from that relay; no relay decision reaches a user's own listings.

## Responsibilities

- Own SearchDocument rows and the discovery_fts FTS5 table, in the vault (local index) and on a relay (relay index), with identical schema and rules; exactly one document per listing (sourceKind listing), enriched by offering, rental and auction statements keyed by listingId.
- Admit a projection only when its author signature verifies (CTR-FED-001 FED-2, F11.S01.M03), its signer holds the author role for its type (F11.S01.M01 roleFor), its type is a known public schema, and its cell passes F06.S02.M01 assertPublicCell (0, 4 or 5 characters, N8); otherwise refuse and leave the previous document untouched.
- Apply publication, edit, renewal, inventory, expiry, archive, auction, tombstone, moderation and deletion events idempotently, ignoring events whose source revision is not newer, and keep removals for hosting policy and tombstones sticky against republishing.
- Rank-time hygiene - store the local first-seen time of each document and of each author, and use the author's claimed time clamped by it (min(claim, firstSeenAt)) as the recency anchor, so post-dating gains nothing; preserve both across rebuild and restore.
- Provide a rebuild that swaps in a freshly built index atomically, enforce storage caps (5 000 retained documents in the vault; on a relay the tenant limit maxIndexedListingsPerPublisher active documents per author, read through F15.S04.M03 TenantPort.limits(tenantId), default 100 matching the F01.S01.M03 relay quota of 100 projections per key), and on a relay serve the public L1 cell feed used by vault pulls.
- On a relay only, set and clear relay-sold promotion (promotedUntil) from an operator command bound to a final or operator-acknowledged payment claim (FLOW-01 steps 3 and 4).
- On a relay only, refuse a projection any of whose currency codes is outside the tenant allowedCurrencies (F15.S04.M03 TenantPort, the same code set F11.S01.M02 V19 checks at intake), and serve with each cell-feed item the ReceiptPort.issue receipt that F11.S01.M02 federation.record.ingest returned for that envelope; the index signs no receipt, index acceptance or acknowledgement of its own.
- Index barterAcceptable, inStock and want.minCondition from the verified listing projection as typed filter columns, and keep the highest offering version per offeringId (services payload seq, FED-3; rentals payload revision) for enrichment.

## Not responsible for

- Parsing user queries, cursors, saved searches and the schedule and scope of vault pulls (F06.S01.M02).
- Filter semantics and SQL compilation (F06.S01.M03).
- Scoring and re-ranking (F06.S03.M01, F06.S03.M02).
- Producing or signing listing projections (F01), offering projections (F03, F05), auction statements (F04) and transporting, verifying and storing envelopes between vaults and relays (F11.S01.M02).
- Local hides and advisory-feed hides in a vault (F12.S01.M01); they are applied at query time by F06.S01.M02 through the F12.S01.M01 local hide read port and never remove index documents.
- Payment claims and their finality (F09.S01.M01, F09.S01.M03); this module only reads the claim state.
- Future: semantic or vector search, typo-tolerant trigram fallback, private-set matching of saved searches against a relay without revealing the query.

## User stories

- As a buyer, I can search listings I have retained, fetched or imported while offline, because the index lives in my vault.
- As a seller using a relay, my published listing becomes searchable on that relay within 5 seconds, and disappears from its index within 5 seconds of my signed tombstone.
- As a relay operator, I can rebuild the relay index after a tokenizer change without search downtime, and mark a listing Promoted only after its payment claim is final or acknowledged.
- As a privacy-conscious seller, I am never findable by anything more precise than the area I chose to publish (L1 about 39 km or L2 about 5 km), and choosing L1 keeps my listing searchable.
- As a seller, a relay's hosting decision about my listing never removes it from my own vault or from relays that did not make that decision.

## Edge cases

- A projection arrives with an invalid or mismatched signature or a signer without the author role; it is quarantined by F11.S01.M02 and, if it reaches this module, refused with DISCOVERY_PROJECTION_INVALID and never indexed.
- Events for the same source arrive out of order (edit before publish); the sourceRevision guard ignores the stale one and the stored projection is read at its latest revision.
- A projection carries a 6-character geohash; assertPublicCell refuses it with DISCOVERY_PRECISION_FORBIDDEN and nothing is stored; a 4-character (L1) cell is accepted and indexed with geoCell4 equal to it.
- The author's claimed publishedAt is in the future or 3 years in the past; the recency anchor is the claim clamped by firstSeenAt (min(claim, firstSeenAt)), so backdating or post-dating gains nothing.
- An author-signed tombstone arrives before the projection it targets; the 180-day stub refuses the later projection as tombstoned.
- Relay A issues a relay_removal advisory (federation.tombstone.applied with kind relay_removal, issuerKind origin_relay, advisory true) for a listing that the vault also fetched from relay B and that the user published; only relay A's provenance is dropped, the document stays active and no refusal is recorded for other sources.
- An author edits a listing after relay R removed it under its hosting policy; the newer revision does not reactivate it on R until the moderation action is reverted or expires.
- An accepted offer places an inventory hold (bazaar.inventory.depleted with reason held); the document is removed with reason held and returns when the hold is released or stock is restocked.
- The vault reaches its 5 000 document cap; fetched documents with the oldest last view in the separate P3 view table are evicted first; own and imported documents are never evicted.
- An author publishes a 101st active listing on a relay whose tenant keeps the default maxIndexedListingsPerPublisher of 100; the newest projection is refused and recorded as a stub with reason author_cap and older listings stay searchable; an operator who later lowers the limit removes nothing already indexed and only refuses further new listings of that author.
- The relay is stopped; the vault's local index keeps working and results from it are labelled with their last-seen time.
- A rebuild runs while new events arrive; events are applied to both live and shadow index until the swap, and firstSeenAt values are copied from the live table.
- A peer relay forwards a listing priced in CHF to a relay whose tenant allows only EUR; the relay index refuses it with FEDERATION_CURRENCY_NOT_ALLOWED, and documents indexed before a currency was removed from allowedCurrencies keep their currency.
- services.offering.published with seq 3 arrives before a delayed one with seq 2, and a key re-sign later republishes the same content as seq 4; seq 2 is ignored as stale and seq 4 only replaces projectionCid and version in offeringRef.
- A remote seller's projection says inStock false; the document stays searchable with inStock false and a filter inStock true excludes it, while a wanted listing's want.minCondition is indexed so sellers can filter the wants their item's condition satisfies.
- bazaar.listing.closed arrives with payload { listingId, ownerId, closeReason } and no closedWithRef; the index reads only listingId and ownerId and relies on the preceding bazaar.listing.unpublished for the removal.

## UX and accessibility

- Settings > Search data: local index size, document count, last rebuild, a Rebuild button, the list of relays this vault fetches from, and the area cells (L1) used for relay pulls.
- Result cards show provenance badge: 'From this device', 'From <relay name>' or 'Imported', plus 'last seen' time.
- Relay operator console: promotion list with claim reference, claim state and promotedUntil, and Set and Clear actions.

**States:** loading; empty; offline-local-only; rebuilding; error

**Accessibility:** Rebuild progress is a progress element with a text percentage announced through an aria-live polite region.; Provenance badges are text, not colour only, and the Rebuild button is at least 44 by 44 px.

## Owned data

- `SearchDocument` (classrup.discovery.search_document/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `discovery.search_document.rebuild`, `discovery.search_document.set_promotion`, `discovery.search_document.clear_promotion`
- Queries: `discovery.search_document.stats`, `discovery.search_document.list_by_cell`
- Emits: `discovery.index.updated`
- Consumes: `bazaar.listing.published`, `federation.record.accepted`, `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.archived`, `bazaar.listing.closed`, `bazaar.listing.restored`, `bazaar.publication.renewed`, `bazaar.sell_terms.set`, `bazaar.variant.changed`, `bazaar.inventory.depleted`, `bazaar.inventory.released`, `bazaar.inventory.restocked`, `services.offering.published`, `services.offering.withdrawn`, `rentals.offering.published`, `auctions.auction.scheduled`, `auctions.auction.opened`, `auctions.auction.extended`, `auctions.auction.closed`, `auctions.auction.cancelled`, `federation.tombstone.applied`, `moderation.action.applied`, `moderation.action.reverted`, `commerce.payment.reorged`, `commerce.payment.expired`, `privacy.deletion.completed`

## Dependencies

F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F15.S04.M03, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-045-01 | [Domain schema](domain_schema.md) | 7 |
| PS-045-02 | [Validation rules](validation_rules.md) | 4 |
| PS-045-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-045-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-045-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-045-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-045-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-045-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-045-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-045-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 4 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/search/index/index.ts`.

## Acceptance criteria

- All tests T01-T35 pass in CI.
- A newly published listing is searchable on a relay within 5 seconds p95 and a tombstoned one is gone within 5 seconds p95.
- No indexed row contains a geohash longer than 5 characters, an unsigned projection or any P1-P4 field (privacy suite).
- A relay decision never removes an own or imported document from a vault (abuse suite).
