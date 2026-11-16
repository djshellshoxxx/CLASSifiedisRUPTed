# F06.S01.M01 — Search index

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S01](../SPEC.md). **Process IDs:** PS-045-01…PS-045-10. **Code:** `packages/discovery/src/search/index`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Builds a full-text (SQLite FTS5) search index over signed public projections of listings, service offerings, auctions and rentals. The same code runs in two places: a local index inside the user's browser vault over projections the user published, fetched from relays or imported, and an optional relay index over projections published to that relay. Only P0 fields and a location cell no finer than geohash precision 5 (L2) are indexed, and only after the author's Ed25519 signature over the projection verifies. The index is derived data: it is rebuilt from retained signed projections, and a signed tombstone or an unpublish removes the text at once.

## Responsibilities

- Own SearchDocument rows and the discovery_fts FTS5 table, in the vault (local index) and on a relay (relay index), with identical schema and rules.
- Admit a projection only when its author signature verifies (CTR-FED-001 FED-2), its type is a known public schema, and its cell is L2 or coarser; otherwise refuse and leave the previous document untouched.
- Apply publication, edit, expiry, archive, tombstone and deletion events idempotently, ignoring events whose source revision is not newer.
- Rank-time hygiene - store the local first-seen time of each document and use it, not the author's claimed time, as the recency anchor.
- Provide a rebuild that swaps in a freshly built index atomically, and enforce local storage caps (5 000 retained documents in the vault, 200 per author on a relay).

## Not responsible for

- Parsing user queries, cursors and saved searches (F06.S01.M02).
- Filter semantics and SQL compilation (F06.S01.M03).
- Scoring and re-ranking (F06.S03.M01, F06.S03.M02).
- Producing or signing listing projections (F01) and transporting them between relays (F11).
- Future: semantic or vector search, typo-tolerant trigram fallback, private-set matching of saved searches against a relay without revealing the query.

## User stories

- As a buyer, I can search listings I have retained or imported while offline, because the index lives in my vault.
- As a seller using a relay, my published listing becomes searchable on that relay within 5 seconds, and disappears from its index within 5 seconds of my signed tombstone.
- As a relay operator, I can rebuild the relay index after a tokenizer change without search downtime.
- As a privacy-conscious seller, I am never findable by anything more precise than my listing's approximate area (about 5 km).

## Edge cases

- A projection arrives with an invalid or mismatched signature; it is quarantined by the kernel with reason signature_invalid and never indexed.
- Events for the same source arrive out of order (edit before publish); the sourceRevision guard ignores the stale one and the stored projection is read at its latest revision.
- A projection carries a 6-character geohash; indexing is refused with DISCOVERY_CELL_TOO_PRECISE and nothing is stored.
- The author's claimed publishedAt is in the future or 3 years in the past; recency uses min(claim, firstSeenAt), so backdating or post-dating gains nothing.
- A tombstone arrives before the projection it targets; the tombstone is kept for 180 days and the later projection is refused as tombstoned.
- The vault reaches its 5 000 document cap; least-recently-viewed documents not referenced by a saved search, favourite or conversation are evicted first.
- The relay is stopped; the vault's local index keeps working and results from it are labelled with their last-seen time.
- A rebuild runs while new events arrive; events are applied to both live and shadow index until the swap.

## UX and accessibility

- Settings > Search data: local index size, document count, last rebuild, a Rebuild button, and the list of relays this vault fetches from.
- Result cards show provenance badge: 'From this device', 'From <relay name>' or 'Imported', plus 'last seen' time.

**States:** loading; empty; offline-local-only; rebuilding; error

**Accessibility:** Rebuild progress is a progress element with a text percentage announced through an aria-live polite region.; Provenance badges are text, not colour only, and the Rebuild button is at least 44 by 44 px.

## Owned data

- `SearchDocument` (classrup.discovery.search_document/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `discovery.index.rebuild`
- Queries: `discovery.index.stats`
- Emits: `discovery.index.updated`
- Consumes: `bazaar.listing.published`, `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.archived`, `bazaar.listing.restored`, `bazaar.sell_terms.set`, `bazaar.variant.changed`, `bazaar.inventory.depleted`, `services.offering.published`, `services.offering.withdrawn`, `auctions.auction.opened`, `auctions.auction.extended`, `auctions.auction.closed`, `federation.tombstone.applied`, `moderation.action.applied`, `privacy.deletion.completed`

## Dependencies

F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-045-01 | [Domain schema](domain_schema.md) | 3 |
| PS-045-02 | [Validation rules](validation_rules.md) | 3 |
| PS-045-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-045-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-045-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-045-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-045-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-045-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-045-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-045-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/search/index/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI.
- A newly published listing is searchable on a relay within 5 seconds p95 and a tombstoned one is gone within 5 seconds p95.
- No indexed row contains a geohash longer than 5 characters, an unsigned projection or any P1-P4 field (privacy suite).
