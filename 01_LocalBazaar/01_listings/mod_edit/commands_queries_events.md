# PS-003-04 — Commands, queries and events: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-04.R01** bazaar.listing.edit is a vault-local command; it produces no signed statement. Sending the new projection is the explicit command bazaar.publication.publish in F01.S01.M03.
- **PS-003-04.R02** bazaar.listing_revision.record is an internal vault port used by sibling modules in their own transaction.
- **PS-003-04.R03** bazaar.listing.edited is emitted only for published or unpublished listings and carries field names, never field values, so it is safe for notification channels.
- **PS-003-04.R04** On an auction host relay the module consumes federation.record.accepted for type classrup.bazaar.listing/v1 with payload kind auction, reads the verified projection with federation.record.get, compares its public fields with the host baseline of the same listing and, when the listingRevision is higher, a field changed and the ListingEditLockPort registered on the host by the auction host returns an auctionId for the listing, emits bazaar.listing.edited host-side with source host_projection; the baseline is updated in the same relay transaction.
- **PS-003-04.R05** The ListingEditLockPort {editLock({listingId}) -> {locked, bidCount, lastKnownAt, auctionId?}} is declared here and implemented by F04.S01.M01 (auctions.auction.edit_lock in the seller vault, answered from hosted auctions on a host relay); it is registered at composition, so this module never lists F04 in depends_on.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.listing.edit` | bazaar.listing.edit | [vault-local] { listingId, expectedRevision, patch: { title?, description?, categoryId?, condition?, media?: [{ ref, alt?, decorative? }], tags?, regionCell? } } | { listingId, revision, material, changedFields, unsentChanges } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_EDIT_REVISION_LIMIT, BAZAAR_EDIT_POLICY_BLOCKED, BAZAAR_EDIT_AUCTION_HAS_BIDS, DEPENDENCY_UNAVAILABLE | bazaar.listing.edited | yes (Idempotency-Key) |
| `bazaar.listing_revision.record` | bazaar.listing_revision.record | [vault-local, internal port] { listingId, expectedRevision, source, changedFields, snapshotPatch } | { listingId, revision, material, unsentChanges } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_EDIT_REVISION_LIMIT, BAZAAR_EDIT_AUCTION_HAS_BIDS, DEPENDENCY_UNAVAILABLE | bazaar.listing.edited | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.listing_revision.list` | bazaar.listing_revision.read | { listingId, cursor?, limit <= 50 } | { items: ListingRevision[], nextCursor?, unsentChanges } | NOT_FOUND |
| `bazaar.listing_revision.get` | bazaar.listing_revision.read | { listingId, revisionNo } | { revision: ListingRevision } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.edited` | P1 | { listingId, ownerId, revision, status, material, changedFields: string[], source: owner_edit\|sell_terms\|variant\|wanted_spec\|system\|host_projection, projectionCid? (host_projection only), auctionId? (host_projection only) } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.published` | set lastProjectedRevision = payload listingRevision for the listing, so unsentChanges becomes false when it equals Listing.revision |
| `bazaar.publication.renewed` | set lastProjectedRevision = payload listingRevision of the renewed signed projection |
| `bazaar.listing.deleted` | keepEvidence true: keep the listing's revisions and set evidenceUntil = deletion time + 2 years; keepEvidence false: purge the revisions in the same transaction |
| `federation.record.accepted` | host relay only: for type classrup.bazaar.listing/v1 with payload kind auction (not local), read the projection with federation.record.get, diff it against the host baseline and, when the listingRevision is higher, a public field changed and the host-registered ListingEditLockPort returns an auctionId, emit bazaar.listing.edited with source host_projection, material per the price, condition and categoryId rule, changedFields and projectionCid; always update the baseline |
| `privacy.deletion.completed` | replace editorId with the payload pseudonym in revisions retained under evidenceUntil and purge the derived edit state |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_EDIT_REVISION_LIMIT | 409 | no | listing already has 100 revisions |
| BAZAAR_EDIT_POLICY_BLOCKED | 422 | no | edited content or category is blocked or needs review under the active policy pack; params.verdict and params.ruleKeys |
| BAZAAR_EDIT_AUCTION_HAS_BIDS | 409 | no | the auction edit lock (auctions.auction.edit_lock) reports this listing locked because an auction on it has bids or its bid count is not confirmed; condition, category and price cannot change (N11); params bidCount, lastKnownAt, auctionId |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Privacy ports (N6): the module registers ExportSectionPort (section bazaar.listing_revisions), DeletionPort (plan: purge unreferenced revisions, pseudonymize editorId in rows kept as evidence) and RetentionPurgePort (purge rows past evidenceUntil) with F10.S01.M03, F10.S01.M04 and F10.S01.M02. Declared port ListingEditLockPort { editLock({listingId}) -> { locked, bidCount, lastKnownAt, auctionId? } }: F04.S01.M01 registers auctions.auction.edit_lock as its implementation in the seller vault and the auction host registers the same port on a host relay for the auctions it hosts (inverted registration; F04.S01.M01 depends on F01, so a direct edge would form a cycle). Host-side derivation runs only on a relay where that port is registered and emits a relay-local event (EVT-8) carrying IDs and field names only.

### Example

```
vault.dispatch("bazaar.listing.edit", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 4,
  "patch": { "condition": "like_new" } }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000021")
=> { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "revision": 5, "material": true, "changedFields": ["condition"], "unsentChanges": true }
event bazaar.listing.edited { listingId, ownerId, revision: 5, status: "published", material: true, changedFields: ["condition"], source: "owner_edit" }
after F01.S01.M03 publishes revision 5: event bazaar.listing.published { listingRevision: 5, ... } => unsentChanges false
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T05 | contract | PS-003-04.R01, PS-003-04.R03, PS-003-09.R02 | edit and record execute | outputs and event payloads validate; payload contains no field values |
| TEST-PS-003-09.T06 | integration | PS-003-04.R02, PS-003-05.R02 | call record from a non-sibling caller and from sell terms | FORBIDDEN for the first; revision and event for the second in one transaction |
| TEST-PS-003-09.T20 | integration | PS-003-04.R04 | host relay H accepts a new projection of A (title changed, revision 6), then one with condition changed (revision 7), then a changed projection of a listing that no hosted auction references | bazaar.listing.edited host-side with source host_projection, material false and changedFields [title], then material true with [condition] and projectionCid; nothing for the unreferenced listing; baselines updated |
| TEST-PS-003-09.T21 | contract | PS-003-04.R05 | F04.S01.M01 conformance stub registers auctions.auction.edit_lock as ListingEditLockPort; inspect the depends_on graph | the edit transaction calls editLock with {listingId} and maps the output fields; F01.S01.M02 does not list F04 in depends_on and the graph stays acyclic |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
