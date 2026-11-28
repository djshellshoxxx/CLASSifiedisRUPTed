# PS-004-01 — Domain schema: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-01.R01** A PublicationRecord captures one publish attempt: listing revision, policy verdict with the evaluated rule packs and their packsDigest, expiry, federation opt-in, signed statement digest and per-relay delivery states.
- **PS-004-01.R02** The signed projection contains only P0 fields, a region cell of at most L2 and the listing revision; it never contains drafts, exact address, contact data or offers.
- **PS-004-01.R03** PublicationRecords are retained as evidence of what was published and when; delivery state is local knowledge and is labelled as such.
- **PS-004-01.R04** The projection statement classrup.bazaar.listing/v1 has a closed key set equal to the allowlist in the note below, distinct from the vault record classrup.bazaar.listing_record/v1; maxBudget appears only when budgetVisible is true and no other key may be added without a schema version.
- **PS-004-01.R05** The projection names the vault tenantId so that every vault derives the same listing threadId (F08.S01.M02 contextTenantId), and carries each photo as the author's MediaRef {ref, alt?, decorative?} unchanged, so receivers read the author's description.
- **PS-004-01.R06** Policy evidence names what was evaluated without copying listing text: the packs list [{publisherId, packVersion, packCid}] and packsDigest of the F18.S01.M02 evaluate result, each matched rule as {publisherId, ruleKey, ruleId}, and the jurisdiction profiles as ProfileRef {publisherId, code} of F18.S01.M01, whose version is resolved at evaluation.

## Specification

### PublicationRecord

Schema `classrup.bazaar.publication/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| ownerId | did:key — local principal; replaced by the deletion pseudonym in retained records on privacy.deletion.completed |
| listingRevision | int — Listing.revision signed in the projection |
| status | enum — submitted \| held_for_confirmation \| active \| policy_attention \| frozen \| blocked \| withdrawn \| unpublished \| ended |
| verdict | enum — allow \| allow_with_notice \| review \| block |
| packs | object[] — 1..20 {publisherId (did:key), packVersion, packCid}, the packs list of the F18.S01.M02 governance.prohibited_rule.evaluate result for the signed revision |
| packsDigest | string — sha256-JCS(packs), as returned by that evaluate result |
| matchedRules? | object[] — <= 10 {publisherId, ruleKey, ruleId, action, reasonKey} from the evaluate matches; never matched text |
| profileRefs? | ProfileRef[] — 1..3 {publisherId, code} of F18.S01.M01 used for notices and restricted categories; version resolved at evaluation; absent means the vault selection |
| riskLevel? | enum — low \| medium \| high (level returned by F12.S03.M01 moderation.risk.assess at publish) |
| acknowledgedNoticeIds? | string[] — <= 10 notice ids from the profiles resolved for profileRefs (F18.S01.M01) |
| ownerConfirmedAt? | timestamp — required when verdict is review or riskLevel is medium or high |
| expiresAt | timestamp — publishedAt + 1..90 days, default 30 |
| renewals | int — 0..3 |
| federationOptIn | boolean — default false; true lets the destination relays forward the projection to their federation peers; every destination relay needs a granted federation_publish consent either way |
| statementCid? | string — cid returned by F11.S01.M02 federation.record.publish (CTR-FED-001 FED-7) |
| statementSeq? | int — seq on the author's pub chain allocated by F11.S01.M02 in its storing transaction (FED-8); never allocated here |
| deliveries | object[] — <= 10 items {relayId (canonical relay: plus 26 lowercase base32 characters, F15.S02.M01), syncState: prepared\|transport_acknowledged\|relay_rejected\|relay_removed (never peer_accepted: acknowledger none), receiptAt? (from the verified classrup.platform.relay_receipt/v1), rejectReasonCid? (lastError.reasonCid of the F15.S01.M01 OutboxEntry), hostingRemoved?: {reasonCode, removalCid, statementOfReasons}, clockTrust: trusted\|untrusted} |
| promotion? | object — {relayId, operatorDid, tier: boost_7d\|boost_14d, dealId, claimId?, state: requested\|claimed\|acknowledged\|active\|revoked\|ended\|expired, promotionCid?, activeUntil?, revokeReason?} |
| endReason? | enum — owner \| policy_changed (owner confirmed Unpublish from policy_attention) \| expired \| closed \| archived \| account_deleted |
| policyAttention? | object — {since, blockedRevision, matches [{publisherId, ruleKey, ruleId, reasonKey}], packsDigest, reminderAt (since + 7 days or later), remindedAt?, resolvedAt?, resolution?: edited\|verdict_cleared\|owner_unpublished\|expired} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one PublicationRecord per listing has status active, policy_attention, frozen or held_for_confirmation.
- status active or policy_attention implies statementCid, statementSeq and at least one delivery are set.
- verdict review or riskLevel medium or high implies ownerConfirmedAt is set before status active; verdict block implies status blocked, and a later block from a pack change is recorded in policyAttention, never in verdict.
- receiptAt on a delivery is the relay clock and is never used to order events; a delivery with hostingRemoved has syncState relay_removed and never changes status.
- promotion.state active implies promotionCid names a verified statement signed by the key of promotion.relayId; it never derives from a payment event alone.
- status policy_attention implies policyAttention is set, and while it lasts no renewal, no statement of policyAttention.blockedRevision and no tombstone is produced except by the owner's confirmed unpublish or the expiry at the signed expiresAt.
- packsDigest equals sha256-JCS(packs) and every matchedRules entry names a publisherId listed in packs.

**Note:** Projection allowlist (classrup.bazaar.listing/v1 payload, closed key set): listingId, kind, title, description, categoryId, condition?, media [{ref, alt?, decorative?}] (shared MediaRef of F01.S01.M01, every entry with non-empty alt or decorative true), tags, locale, regionCell (length 4 or 5), subtypeRef? (service, rental, auction), tenantId (the vault tenant of CTR-ID-001 ID-6, named as contextTenantId by F08.S01.M02 thread derivation), listingRevision, publishedAt, expiresAt, inStock (boolean from F01.S03.M01 at signing), barterAcceptable (from SellTerms or WantSpec, false otherwise), mailboxHints [1..3 {relayId, mailboxId}] (F08.S01.M01 registrations of the author, for end-to-end delivery), federationOptIn, and one kind subset: sell {askingPrice, acceptedCurrencies, paymentMethods, cryptoAssets?, negotiable, pickup, delivery, deliveryNote?}; variants [{variantId, label, attributes, price?, inStock}] (contributed by F01.S03.M02 through the ProjectionContributorPort); want {categoryId, keywords, minCondition, quantityWanted, barterAcceptable, barterNote?, maxDistanceBucket?, neededBy?, maxBudget? only when budgetVisible}; giveaway {selectionMode, queueLimit, closesAt?}. Never included: minOffer, pickupNote, quantities, holds, status, closeReason, currentPublicationId, drafts, offers or any P1 to P4 field. Field classes are annotated per F10.S02.M02.

### Storage DDL

```sql
CREATE TABLE bazaar_publication (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_publication_live ON bazaar_publication(tenant_id, listing_id)
  WHERE status IN ('active','policy_attention','frozen','held_for_confirmation');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T01 | unit | PS-004-01.R01, PS-004-01.R03, PS-004-06.R03 | publish L offline | PublicationRecord active, delivery prepared, no receiptAt, no relay receipt claim |
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-01.R04, PS-004-04.R02, PS-004-09.R02 | publish L and W, then unpublish | projection validates against classrup.bazaar.listing/v1 and its key set equals the allowlist exactly (barterAcceptable, inStock, expiresAt, mailboxHints, tenantId and media with alt or decorative present; no status, closeReason, currentPublicationId or minOffer; W has no maxBudget); region <= 5 chars; signature by F11.S01.M02 verifies; tombstone validates |
| TEST-PS-004-09.T28 | integration | PS-004-01.R05 | publish L, then a buyer vault and the seller vault derive the listing thread through F08.S01.M02 | projection carries tenantId and both vaults derive the same threadId; media entries in the projection equal the listing's MediaRef entries |
| TEST-PS-004-09.T29 | contract | PS-004-01.R01, PS-004-01.R06 | evaluate stub returns packs of publishers P and Q with a review match of Q's rule r2; preview_policy and publish with profileRefs [{publisherId P, code eu_de}], then confirm with confirmedRules [{publisherId Q, ruleKey r2}]; an input naming jurisdictionProfileId | evaluate and governance.jurisdiction_profile.resolve receive the ProfileRefs; the PublicationRecord stores packs [{publisherId, packVersion, packCid}] and packsDigest equal to the evaluate result and matchedRules with publisherId; no listing text stored; jurisdictionProfileId refused with VALIDATION_FAILED |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
