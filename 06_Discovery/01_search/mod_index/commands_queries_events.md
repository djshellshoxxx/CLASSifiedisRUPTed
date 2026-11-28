# PS-045-04 — Commands, queries and events: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-04.R01** Commands are rebuild (a vault-local command on a device, a relay command for the relay operator) and, on a relay only, set_promotion and clear_promotion for the relay operator; none produces a signed statement.
- **PS-045-04.R02** Normal indexing is driven by consumed events - own-vault events for the principal's listings and federation.record.accepted for projections that F11.S01.M02 verified in a vault (fetched or imported) or ingested on a relay through federation.record.ingest; the vault index makes no network call and writes no outbox entry.
- **PS-045-04.R03** Each applied change emits exactly one discovery.index.updated event in the same local transaction as the document change.
- **PS-045-04.R04** Relay-sold promotion is set only by the relay operator's set_promotion bound to a final or operator-acknowledged payment claim, and is cleared by clear_promotion, by commerce.payment.reorged or commerce.payment.expired for that claim, or by the expiry sweep.
- **PS-045-04.R05** On a relay, the public cell feed list_by_cell returns signed projection envelopes by L1 cell only, so vault pulls never carry query text, filters or saved-search identifiers.
- **PS-045-04.R06** On a relay, index writes arrive only through F11.S01.M02 federation.record.ingest, whose response carries one F15.S02.M01 ReceiptPort.issue receipt (classrup.platform.relay_receipt/v1) per stored envelope; the index serves that receipt as relayReceipt in list_by_cell items and signs no receipt, index acceptance or peer acknowledgement of its own, because the statement registry gives classrup.bazaar.listing/v1 acknowledger none and F15.S01.M01 completes such entries on the verified receipt.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.search_document.rebuild` | discovery.search_document.rebuild | { scope: all\|sell\|wanted\|giveaway\|service\|rental\|auction } | { rebuildId, startedAt, status: started } | DISCOVERY_REBUILD_IN_PROGRESS, FORBIDDEN, UNAUTHENTICATED | discovery.index.updated | yes (Idempotency-Key) |
| `discovery.search_document.set_promotion` | discovery.search_document.promote | [relay command, operator] { sourceKey: { authorDid, sourceId }, until, claimRef: { claimId, dealId } } | { documentId, promotedUntil, revision } | NOT_FOUND, VALIDATION_FAILED, DISCOVERY_PROMOTION_CLAIM_NOT_FINAL, CONFLICT_STATE, FORBIDDEN | discovery.index.updated | yes (Idempotency-Key) |
| `discovery.search_document.clear_promotion` | discovery.search_document.promote | [relay command, operator] { sourceKey: { authorDid, sourceId }, reason: operator\|claim_disputed } | { documentId, revision } | NOT_FOUND, FORBIDDEN | discovery.index.updated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.search_document.stats` | discovery.search_document.read_stats | { scope?: all\|sell\|wanted\|giveaway\|service\|rental\|auction } | { activeCount, removedCount, stubCount, oldestPendingEventAgeMs, lastRebuildAt?, byListingKind: {sell, wanted, giveaway, service, rental, auction}, byOrigin: {own, fetched, imported, relay_published} } | FORBIDDEN, UNAUTHENTICATED |
| `discovery.search_document.list_by_cell` | discovery.search_document.read_cell_feed | [relay query, public] { cells4: string[1..8] of exactly 4 characters, sinceCursor?, limit? (1..100, default 50) } | { items: [{ projectionCid, sourceRevision, envelope: signed projection (classrup.bazaar.listing/v1, classrup.services.offering/v1 or classrup.rentals.offering/v1), relayReceipt }], nextCursor? } | VALIDATION_FAILED, RATE_LIMITED, EXPIRED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.index.updated` | P0 | { documentId, sourceKind, sourceId, op: upsert\|remove\|rebuilt, listingKind?, categoryId?, geoCell?, authorDid?, origin?, firstSeenAt?, claimedPublishedAt?, priceMinor?, currency?, condition?, barterAcceptable?, inStock?, wantMinCondition?, promoted? } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.published` | vault, own listings only: load the principal's own signed projection by statementCid, check it (V01-V05) and upsert with origin own; on a relay this event never occurs because relay ingestion arrives as federation.record.accepted |
| `federation.record.accepted` | types classrup.bazaar.listing/v1, classrup.services.offering/v1 and classrup.rentals.offering/v1 only: load the MirrorView by cid through F11.S01.M02 federation.record.get, re-check the signer with F11.S01.M01 roleFor and the signature with F11.S01.M03 (V03), then upsert the listing document with barterAcceptable, inStock and want.minCondition (V15), or enrich it from an offering projection keyed by listingId (V11, V13, V14); origin and provenance come from the payload sourceKind and receivedFromRelay only - in a vault sourceKind import gives origin imported, and peer_relay, mailbox or direct give origin fetched with receivedFromRelay, when present, added to provenanceRelays; on a relay sourceKind hosted_device or peer_relay gives origin relay_published after the tenant checks (V07, V12) and, for listing projections, the in-process operator pack evaluation (V16); records with sourceKind local or local true are skipped because bazaar.listing.published indexes them; a newer version of a mirrored record (recordKey, version, supersededRecordId) replaces the document only when it is newer (V04) |
| `bazaar.listing.edited` | own listing: reload the own projection and update the document if the source revision is newer |
| `bazaar.listing.unpublished` | own listing: remove the document with reason unpublished |
| `bazaar.listing.expired` | own listing: remove the document with reason expired |
| `bazaar.listing.archived` | own listing: remove the document with reason archived |
| `bazaar.listing.closed` | own listing, payload { listingId, ownerId, closeReason } only (no closedWithRef is read or expected): if the document is still active because the preceding bazaar.listing.unpublished has not been applied, remove it with reason unpublished; otherwise acknowledge with no change; closeReason is not stored |
| `bazaar.listing.restored` | own listing: reload projection and re-add the document only if the listing is published again |
| `bazaar.publication.renewed` | own listing: set expiresAt to the renewed expiry (total life up to 120 days per F01.S01.M03); remote renewals arrive as a newer projection |
| `bazaar.sell_terms.set` | update priceMinor, currency and barterAcceptable from the verified own projection |
| `bazaar.variant.changed` | update the lowest variant price in priceMinor |
| `bazaar.inventory.depleted` | own listing: reason sold removes the document with reason sold_out; reason held removes it with reason held |
| `bazaar.inventory.released` | own listing removed with reason held or sold_out and quantity available again: reload the retained projection and reactivate |
| `bazaar.inventory.restocked` | own listing removed with reason held or sold_out and available > 0: reload the retained projection and reactivate |
| `services.offering.published` | own offering, emitted on the first publish, on every published revision and on every key re-sign with payload { offeringId, providerId, listingId, skillCodes, rateType, rate, serviceAreaCell, providerTimeZone, remoteCapable, projectionCid, seq, publishedAt }: load and verify the provider's signed projection by projectionCid (V03); apply it only when seq is greater than offeringRef.version (V13, FED-3), then enrich the service listing document keyed by listingId with skill codes, rate (as priceMinor and currency when no sell terms exist) and serviceAreaCell (exactly 5 characters, V14) as geoCell, and store offeringId, projectionCid, seq as version and publishedAt in offeringRef; a key re-sign with unchanged content only replaces projectionCid and version; providerTimeZone is not indexed; never a second document. services.offering.revised is not consumed because every published revision arrives here with a higher seq and draft revisions are never indexed |
| `services.offering.withdrawn` | remove the service listing document with reason withdrawn |
| `rentals.offering.published` | verify the offering projection by projectionCid (V03), apply it only when its payload revision is greater than offeringRef.version (V13), and enrich the rental listing document keyed by listingId with rate and pickup area cell (assertPublicCell) |
| `auctions.auction.scheduled` | record the auctionId link on the listing document (sourceKind listing, listingId) and set auctionPhase scheduled and endsAt = scheduledEndsAt from the host-signed statement |
| `auctions.auction.opened` | resolve the document through the auctionId link and set auctionPhase open and endsAt = currentEndsAt |
| `auctions.auction.extended` | resolve the document through the auctionId link and set endsAt to the host-signed newEndsAt |
| `auctions.auction.closed` | resolve through the auctionId link and remove the document with reason auction_closed |
| `auctions.auction.cancelled` | resolve through the auctionId link and remove the document with reason auction_cancelled |
| `federation.tombstone.applied` | branch on the payload kind, issuerKind and advisory (signerKey and relayId name the signer) - kind tombstone with issuerKind author and advisory false: remove the document everywhere with reason tombstoned and keep a 180-day stub refusing that cid and record key; kind relay_removal with issuerKind origin_relay and advisory true (the origin_relay branch) on a relay: when relayId is this relay remove the document from this relay's index with reason hosting_policy, otherwise change nothing (F11.S01.M02 queues it for this operator's review, and a later moderation.action.applied may remove it); the origin_relay branch in a vault: drop that relay from provenanceRelays and remove the document with reason hosting_policy only when no provenance remains and origin is fetched, never touching own or imported documents and adding no refusal for other sources; an author tombstone whose target is an enrichment projection (offeringRef.projectionCid or the offeringId record key) removes the service or rental listing document with reason withdrawn, which is the rental withdrawal path |
| `moderation.action.applied` | relay only and kind remove_from_index only (warn, restrict_feature and suspend_relay_access are ignored): remove the targetRef document, or every document of subjectKey when no targetRef is given, with reason hosting_policy, recording removedByActionId and removedUntil = expiresAt |
| `moderation.action.reverted` | relay only: reactivate documents removed by that actionId from the retained signed projection, or delete their stubs so a resubmission is admitted |
| `commerce.payment.reorged` | relay only: clear promotedUntil on the document whose promotionClaimId equals claimId and emit op upsert |
| `commerce.payment.expired` | relay only: clear promotedUntil on the document whose promotionClaimId equals claimId and emit op upsert |
| `privacy.deletion.completed` | no evidence is held to pseudonymize; drop the deleted principal's discovery_author_seen anchor and view rows; the principal's own documents were already removed with reason deleted by the registered DeletionPort plan during execution |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_PROJECTION_INVALID | 422 | no | projection signature, signer role, schema, expiry, tombstone or enrichment check failed |
| DISCOVERY_SOURCE_STALE | 409 | no | event revision is not newer than the indexed revision |
| DISCOVERY_REBUILD_IN_PROGRESS | 409 | no | a rebuild is already running |
| DISCOVERY_INDEX_CAP | 409 | no | document cap reached; vault eviction applied, or on a relay the newest projection beyond the tenant maxIndexedListingsPerPublisher refused as author_cap |
| DISCOVERY_SOURCE_REMOVED | 409 | no | the source was removed for a reason a republish cannot undo (tombstoned, deleted, author_cap, or hosting_policy before reversal) |
| DISCOVERY_PROMOTION_CLAIM_NOT_FINAL | 409 | no | the linked payment claim is not final or not acknowledged by this relay's operator |
| DISCOVERY_POLICY_BLOCKED | 422 | no | on a relay, the operator's prohibited-item rule pack (F18.S01.M02 evaluate) returned verdict block for the listing projection; the previous document stays unchanged |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): rebuild and stats run in the vault for the unlocked principal and on a relay for its operator; set_promotion, clear_promotion and list_by_cell exist only on a relay and are relay-local policy. discovery.index.rebuild and discovery.index.stats remain accepted aliases of the renamed operations for one release. Projections are never taken from a relay response at face value: a vault indexes only what F11.S01.M02 accepted (federation.record.receive) and re-checks here (V03). The index consumes but produces no signed statement; the withdrawal kind (tombstone or relay_removal), issuerKind, advisory flag, signerKey and relayId are read from the federation.tombstone.applied payload, and provenance from the sourceKind and receivedFromRelay of federation.record.accepted (FED-11: display only, no canonical origin relay).

### Example

```
event federation.record.accepted { recordId: "0192f3a9-…", cid: "sha256-Qm…", type: "classrup.bazaar.listing/v1", author: "did:key:z6Mk…", seq: 3, sourceKind: "peer_relay", receivedFromRelay: "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk", local: false }
-> federation.record.get { cid } -> MirrorView, roleFor ok, signature verifies, geoCell "u4pr" (L1), price 45000 EUR, inStock true, barterAcceptable false
-> emits discovery.index.updated { documentId: "0192f3b0-…", sourceKind: "listing", op: "upsert", geoCell: "u4pr", origin: "fetched", inStock: true, barterAcceptable: false, firstSeenAt: "2026-11-04T10:00:01.000Z" }
relay: TenantPort.limits(tenantId) -> { maxIndexedListingsPerPublisher: 100, allowedCurrencies: ["EUR"] }; a CHF-priced projection -> refused FEDERATION_CURRENCY_NOT_ALLOWED
relay: governance.prohibited_rule.evaluate { kind: "sell", categoryId: "0192f3a4-1111-7000-8000-0000000000c1", title: "Fake designer bag replica", description: "…", tags: [] } -> { verdict: "block", matches: [{ ruleKey: "counterfeit_goods", … }], packsDigest: "sha256-UGFj…" } -> refused DISCOVERY_POLICY_BLOCKED, previous document unchanged
vault command: discovery.search_document.rebuild { "scope": "all" }  -> { "rebuildId": "0192f3c1-…", "startedAt": "2026-11-04T10:00:00.000Z", "status": "started" }
relay command: discovery.search_document.set_promotion { "sourceKey": { "authorDid": "did:key:z6Mk…", "sourceId": "0192f3a4-…" }, "until": "2026-11-11T10:00:00.000Z", "claimRef": { "claimId": "0192f3d1-…", "dealId": "0192f3d0-…" } }
-> 200 { "documentId": "0192f3b0-…", "promotedUntil": "2026-11-11T10:00:00.000Z", "revision": 5 }
relay query: discovery.search_document.list_by_cell { "cells4": ["u4pr", "u4px"], "limit": 50 } -> { items: [{ projectionCid, sourceRevision, envelope, relayReceipt }], nextCursor }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T06 | integration | PS-045-04.R02, PS-045-06.R01 | deliver the same event twice and an older edit afterwards | one document, stale edit ignored |
| TEST-PS-045-09.T07 | contract | PS-045-04.R01, PS-045-04.R03 | rebuild, set_promotion and clear_promotion commands and each applied change | command and discovery.index.updated payloads validate against registry schemas; one event per change; old alias names accepted |
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02, PS-045-03.R04 | author-signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused with DISCOVERY_SOURCE_REMOVED |
| TEST-PS-045-09.T17 | integration | PS-045-04.R02, PS-045-01.R04 | vault receives federation.record.accepted for a listing with sourceKind peer_relay and receivedFromRelay B and for another with sourceKind import; relay ingests the first listing with sourceKind hosted_device through federation.record.ingest | MirrorView loaded by cid, roleFor and signature checked; one document with origin fetched and provenanceRelays [B], one with origin imported and no provenance relay, origin relay_published on the relay; no originRelay field is read |
| TEST-PS-045-09.T18 | integration | PS-045-01.R04, PS-045-04.R03 | service listing published, services.offering.published with seq 1 and then seq 2 for a published revision, rentals.offering.published for a rental listing, then services.offering.withdrawn and an author tombstone for the rental offering projection | exactly one document per listing, enriched from the offering projection with offeringRef.version 2; both withdrawals remove the listing document with reason withdrawn |
| TEST-PS-045-09.T19 | integration | PS-045-04.R02, PS-045-03.R01 | auction scheduled, opened, extended, then cancelled; a second auction closed | auctionId link resolves the document, endsAt follows the host-signed times, removed with auction_cancelled and auction_closed |
| TEST-PS-045-09.T20 | integration | PS-045-03.R02, PS-045-04.R02 | relay moderation actions warn, remove_from_index with targetRef, remove_from_index without targetRef, then author edit, then moderation.action.reverted, and an action whose expiresAt passes | warn ignored; target removed; all subjectKey documents removed; edit does not reactivate (DISCOVERY_SOURCE_REMOVED); revert and expiry reactivate |
| TEST-PS-045-09.T23 | integration | PS-045-04.R04 | set_promotion with a claimed but unacknowledged claim, then with an operator-acknowledged claim, then commerce.payment.reorged; a second promotion reaching promotedUntil; set_promotion in a vault | DISCOVERY_PROMOTION_CLAIM_NOT_FINAL; promotedUntil set; cleared on reorg; cleared by sweep; not available in a vault |
| TEST-PS-045-09.T28 | contract | PS-045-04.R02, PS-045-01.R04 | F01 bazaar.listing.published and bazaar.publication.renewed fixtures with total life 120 days, F03 services.offering.published fixture | accepted; document expires at the renewed expiresAt, not at 90 days |
| TEST-PS-045-09.T29 | integration | PS-045-04.R05, PS-045-05.R03 | list_by_cell with 2 L1 cells, with a 5-character cell, with 9 cells, and over quota | signed envelopes returned; VALIDATION_FAILED twice; RATE_LIMITED from RateLimitPort |
| TEST-PS-045-09.T32 | integration | PS-045-01.R06, PS-045-04.R03 | remote sell projection with inStock false and barterAcceptable true, wanted projection with want.minCondition fair, and a projection whose inStock is a string; then F06.S01.M03 filters inStock true, barterAcceptable true and wantAcceptsCondition good | in_stock, barter and want_min_condition columns set and discovery.index.updated carries inStock, barterAcceptable and wantMinCondition; the string inStock refused with DISCOVERY_PROJECTION_INVALID; inStock true excludes the sell listing, barterAcceptable true matches it, wantAcceptsCondition good matches the wanted listing |
| TEST-PS-045-09.T34 | integration | PS-045-02.R04, PS-045-04.R06 | relay tenant with maxIndexedListingsPerPublisher 2 and allowedCurrencies [EUR] from the TenantPort stub; an author's 3 EUR listings arrive through federation.record.ingest, a peer relay forwards a CHF listing, then the limit is lowered to 1 and list_by_cell is read | third listing refused with stub author_cap and DISCOVERY_INDEX_CAP; CHF listing refused with FEDERATION_CURRENCY_NOT_ALLOWED; lowering removes nothing; feed items carry the ReceiptPort.issue receipt of the ingest response; the index signs no receipt, index acceptance or acknowledgement |
| TEST-PS-045-09.T35 | integration | PS-045-03.R04, PS-045-04.R02 | relay index receives federation.tombstone.applied with kind relay_removal, issuerKind origin_relay and advisory true for relayId of this relay and of another relay; a vault receives the same advisory; own bazaar.listing.closed { listingId, ownerId, closeReason } before and after bazaar.listing.unpublished | this relay's advisory removes the document with hosting_policy and the other relay's changes nothing; the vault drops only that provenance; closed removes a still active own document with reason unpublished and is a no-op after unpublish; a payload without closedWithRef is accepted |

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F15.S04.M03, F18.S01.M02, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
