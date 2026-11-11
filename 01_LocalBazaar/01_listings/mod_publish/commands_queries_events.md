# PS-004-04 — Commands, queries and events: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-04.R01** publish, confirm, unpublish, renew and attach_promotion are vault commands; publish, unpublish and renew produce signed statements through the StatementPublisherPort, confirm and attach_promotion produce them only as a consequence of publish or the Deal they open.
- **PS-004-04.R02** Statements produced only through the StatementPublisherPort declared by F11.S01.M01 and implemented by F11.S01.M02: classrup.bazaar.listing/v1 by federation.record.publish {type, audience public, payload, sourceRecordId listingId}, which signs and allocates seq and prev in its storing transaction, and classrup.federation.tombstone/v1 by federation.tombstone.issue {targetCid, reason}; this module holds no signing path and no seq counter, and F11.S02.M01 routes both through one F15.S01.M01 OutboxEntry per destination relay.
- **PS-004-04.R03** No relay command is required: relays accept statements through their own index endpoints defined in F06 and F11.
- **PS-004-04.R04** Relay statements (classrup.federation.relay_removal/v1 hosting-removal advisories per CTR-FED-001 FED-9, classrup.moderation.reversal/v1 hosting restorations and classrup.bazaar.promotion/v1) are accepted only through bazaar.publication.receive_relay_notice after F11.S01.M02 verified them, when signed by the pinned key of the relay of that delivery and targeting this publication's statementCid; they are deduplicated by cid, anything else is quarantined, and they change only that relay's delivery or promotion state, never the Listing (N17).
- **PS-004-04.R05** attach_promotion opens a noncustodial Deal with commerce.deal.open {contextRef {type: listing_fee, id: publicationId}, contextCid: statementCid, payee: the relay operator DID} (N5, FLOW-01); the vault never shows paid or promoted on the strength of a payment event.
- **PS-004-04.R06** Per-relay delivery state is derived from the F15.S01.M01 OutboxEntry of the statement for destination <relayId> (canonical relayId of F15.S02.M01): classrup.bazaar.listing/v1 is audience public with acknowledger none (F11.S01.M01 registry), so its entry becomes completed on a verified classrup.platform.relay_receipt/v1 and the delivery shows transport_acknowledged, never peer_accepted; relay_rejected when the entry fails with failureReason relay_rejected (rejectReasonCid = lastError.reasonCid), and relay_removed only on a verified relay_removal advisory.
- **PS-004-04.R07** The module implements the F09.S01.M01 ContextTermsPort for context type listing_fee: verify(contextRef {listing_fee, publicationId}, contextCid, parties, obligations) recomputes parties [listing author as payer, promotion.operatorDid as payee] and one obligation {payer listing author, payee operatorDid, amount = price of the tier in the relay's signed price list, purpose listing_fee, allowedMethods crypto|external} from the stored PublicationRecord whose statementCid equals contextCid; openerRole(listing_fee) and ownerRole(listing_fee) are listing author.
- **PS-004-04.R08** bazaar.publication.policy_attention is a vault-local P1 event carrying ownerId for F13 notification routing (N4), with change raised, reminder or resolved; governance.prohibited_rule.changed and governance.category.changed only re-evaluate and never call unpublish, end or federation.tombstone.issue.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.publication.publish` | bazaar.publication.publish | [vault-local; statement classrup.bazaar.listing/v1 signed by F11.S01.M02 federation.record.publish] { listingId, expectedRevision, relayIds[] (canonical relay:<26 lowercase base32>), expiresInDays? (default 30), federationOptIn?, acknowledgedNoticeIds?, profileRefs?: ProfileRef[] (1..3 {publisherId, code}, default the F18.S01.M01 vault selection), confirmedRules?: [{publisherId, ruleKey}] and confirmedRisk? (re-publication in place only) } | { publicationId, status, verdict, riskLevel: low\|medium\|high, matchedRules?: [{publisherId, ruleKey, ruleId, action, reasonKey}], packsDigest, statementCid?, statementSeq?, deliveries[], skippedRelays[], clockWarning? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_PUBLISH_NOT_ALLOWED, BAZAAR_PUBLISH_INCOMPLETE, BAZAAR_PUBLISH_BLOCKED, BAZAAR_PUBLISH_CONFIRMATION_REQUIRED, BAZAAR_PUBLISH_POLICY_ATTENTION, BAZAAR_PUBLISH_LIMIT, BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED, BAZAAR_LISTING_MEDIA_ALT_MISSING, DISCOVERY_PRECISION_FORBIDDEN, PRIVACY_DELETION_PENDING, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED | bazaar.listing.published, bazaar.publication.policy_attention | yes (Idempotency-Key) |
| `bazaar.publication.confirm` | bazaar.publication.confirm | [vault-local; statement classrup.bazaar.listing/v1 signed by F11.S01.M02 federation.record.publish] { publicationId, expectedRevision, confirmedRules: [{publisherId, ruleKey}], confirmedRisk? } | { publicationId, status: active, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_CONFIRMATION_REQUIRED, PRIVACY_DELETION_PENDING, DEPENDENCY_UNAVAILABLE, EXPIRED | bazaar.listing.published | yes (Idempotency-Key) |
| `bazaar.publication.unpublish` | bazaar.publication.unpublish | [vault-local; tombstone classrup.federation.tombstone/v1 issued by F11.S01.M02 federation.tombstone.issue] { publicationId, expectedRevision, confirmHolds? } | { publicationId, status: unpublished, tombstoneCid, activeHolds } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_HOLDS_ACTIVE | bazaar.listing.unpublished, bazaar.publication.policy_attention | yes (Idempotency-Key) |
| `bazaar.publication.end` | bazaar.publication.end | [vault-local, internal port; tombstone issued by F11.S01.M02 federation.tombstone.issue] { listingId, reason: closed\|archived\|account_deleted\|expired } — never called by the policy-change consumer | { publicationId?, ended: boolean, tombstoneCid? } — reason expired ends with endReason expired, keeps Listing.status for F01.S01.M04 and emits no bazaar.listing.unpublished | NOT_FOUND, CONFLICT_STATE | bazaar.listing.unpublished | yes (Idempotency-Key) |
| `bazaar.publication.renew` | bazaar.publication.renew | [vault-local; statement classrup.bazaar.listing/v1 signed by F11.S01.M02 federation.record.publish] { publicationId, expectedRevision, requestedBy?: owner\|expiry_deferral } | { publicationId, expiresAt, renewals, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_RENEW_NOT_ALLOWED, BAZAAR_PUBLISH_POLICY_ATTENTION, PRIVACY_DELETION_PENDING, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE | bazaar.publication.renewed | yes (Idempotency-Key) |
| `bazaar.publication.attach_promotion` | bazaar.publication.promote | [vault-local; opens a Deal through commerce.deal.open, which produces classrup.commerce.deal/v1] { publicationId, relayId, tier: boost_7d\|boost_14d, price: Money (from the relay's signed price list), operatorDid } | { publicationId, promotion: { state: requested, dealId } } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, COMMERCE_DEAL_CONTEXT_CONFLICT |  | yes (Idempotency-Key) |
| `bazaar.publication.receive_relay_notice` | bazaar.publication.receive_relay_notice | [vault-local, inbound relay-signed statement verified by F11.S01.M02] { envelope: classrup.federation.relay_removal/v1 \| classrup.moderation.reversal/v1 \| classrup.bazaar.promotion/v1, provenance } | { publicationId?, accepted: boolean, effect?: hosting_removed\|hosting_restored\|promotion_active\|promotion_withdrawn, quarantineReason?: signature_invalid\|signer_not_relay\|target_mismatch\|unknown_relay\|duplicate } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION | bazaar.publication.promotion_activated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.publication.get` | bazaar.publication.read | { publicationId } | { publication: PublicationRecord } | NOT_FOUND |
| `bazaar.publication.list_mine` | bazaar.publication.read | { status?, cursor?, limit <= 50 } | { items: PublicationRecord[], nextCursor? } | VALIDATION_FAILED |
| `bazaar.publication.preview_policy` | bazaar.publication.read | { listingId, profileRefs?: ProfileRef[] (1..3 {publisherId, code}, default the F18.S01.M01 vault selection) } | { verdict, riskLevel, matchedRules: [{publisherId, ruleKey, ruleId, action, reasonKey}], requiredNoticeIds, packs: [{publisherId, packVersion, packCid}], packsDigest, projectionPreview } | NOT_FOUND, VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.published` | P0 | { listingId, publicationId, ownerId, kind, categoryId, regionCell, listingRevision, publishedAt, expiresAt, federationOptIn, barterAcceptable, statementCid } |
| `bazaar.listing.unpublished` | P0 | { listingId, publicationId, ownerId, reason: owner\|policy_changed\|closed\|archived\|account_deleted, tombstoneCid } |
| `bazaar.publication.renewed` | P1 | { listingId, publicationId, listingRevision, expiresAt, renewals, statementCid, requestedBy } |
| `bazaar.publication.promotion_activated` | P1 | { listingId, publicationId, relayId, tier, activeUntil, promotionCid } |
| `bazaar.publication.policy_attention` | P1 | { listingId, publicationId, ownerId, change: raised\|reminder\|resolved, rules: [{publisherId, ruleKey, reasonKey}], packsDigest, since, reminderAt, resolution?: edited\|verdict_cleared\|owner_unpublished\|expired } — vault-local; never carries listing text |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.expired` | when the publication is still active or in policy_attention (the expiry did not run bazaar.publication.end), end it with endReason expired and issue the tombstone through federation.tombstone.issue (idempotent per target); otherwise nothing changes |
| `governance.prohibited_rule.changed` | re-evaluate active and policy_attention publications in batches of 200 against their signed revision and stored profileRefs; a new block verdict moves an active publication to policy_attention (owner notified, reminder after 7 days, renewals and re-publication of the unchanged revision stopped) and never unpublishes it or issues a tombstone; a policy_attention publication that no longer blocks returns to active with resolution verdict_cleared |
| `governance.category.changed` | re-evaluate active and policy_attention publications in the changed category when the category became restricted or retired, with the same policy_attention rule; nothing is unpublished or tombstoned |
| `commerce.payment.claimed` | when the claim belongs to a promotion Deal of this vault, move the promotion from requested to claimed |
| `commerce.payment.acknowledged` | when the acknowledgement of a promotion claim has payeeId promotion.operatorDid and verificationSource counterparty or chain (the operator's own verifier, COM-8), move the promotion to acknowledged; never to active |
| `commerce.payment.finalized` | for a crypto promotion claim, record only that the seller's own verifier sees it final (label final per your verifier); the promotion state does not move |
| `federation.conflict.detected` | statementClass public_projection naming a statementCid of an own active publication among the candidates: move it to frozen |
| `federation.conflict.resolved` | for a frozen publication: keep of its candidate or superseded by an own newer projection returns it to active; drop_all moves it to unpublished with a tombstone |
| `commerce.payment.reorged` | move an acknowledged promotion back to claimed; an active promotion stays until the relay's signed withdrawal arrives |
| `commerce.payment.expired` | move a claimed promotion to expired |
| `commerce.payment.failed` | move a claimed promotion to expired |
| `commerce.deal.cancelled` | when the Deal is a promotion Deal (contextRef listing_fee), move a requested or claimed promotion to expired |
| `privacy.deletion.completed` | replace ownerId with the payload pseudonym in PublicationRecords retained under RET-EVIDENCE |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_PUBLISH_NOT_ALLOWED | 409 | no | listing status does not allow publication now, or every destination relay has removed it |
| BAZAAR_PUBLISH_INCOMPLETE | 422 | no | required fields, terms or region are missing; params.fields lists them |
| BAZAAR_PUBLISH_BLOCKED | 422 | no | policy pack blocks this listing; params.rules [{publisherId, ruleKey}] and reasonKeys |
| BAZAAR_PUBLISH_CONFIRMATION_REQUIRED | 409 | no | a review-level rule matched or the risk level is medium or high and the owner has not confirmed |
| BAZAAR_PUBLISH_LIMIT | 409 | no | vault already has 100 active publications |
| BAZAAR_PUBLISH_RENEW_NOT_ALLOWED | 409 | no | renewal window, count or total life limit not met |
| BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED | 409 | no | no granted federation_publish consent for a destination relay (required for every public projection, and for relay-to-relay forwarding when federationOptIn is set) |
| BAZAAR_PUBLISH_HOLDS_ACTIVE | 409 | no | the listing has active inventory holds; confirm to unpublish while keeping them |
| BAZAAR_LISTING_MEDIA_ALT_MISSING | 422 | no | a listing photo has neither non-empty alt text nor decorative true; params.mediaIndexes names the photos |
| BAZAAR_PUBLISH_POLICY_ATTENTION | 409 | no | a changed rule pack blocks the published revision; renew and re-publication of that revision wait until the owner edits it or confirms Unpublish; params.rules and reminderAt |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.bazaar.listing/v1, audience public, class public_projection, signer role listing author (a registered device key of ownerId), acknowledger none (audience public in the F11.S01.M01 registry: the F15.S01.M01 entry completes on a verified relay receipt and is never peer_accepted), signed only by F11.S01.M02 federation.record.publish through the StatementPublisherPort; classrup.federation.tombstone/v1 (F11 schema), signer role listing author, issued by federation.tombstone.issue; classrup.bazaar.promotion/v1, signer role operator key of the relay named by relayId; inbound classrup.federation.relay_removal/v1 (F11 schema, advisory, signer role the hosting relay) and classrup.moderation.reversal/v1 (F12.S02.M01 schema), signer role the relay of that delivery, ingested here only for the vault's own publications. Relays are named by the canonical relayId of F15.S02.M01 (relay: plus 26 lowercase base32 characters of SHA-256 of the genesis key) and their key is the one pinned when the user selected the relay (published by F15.S02.M01 at /.well-known/classrup-relay.json); receipts are classrup.platform.relay_receipt/v1. ContextTermsPort (F09.S01.M01) for context type listing_fee: verify, openerRole and ownerRole as stated in the requirements. The per-record export opt-in that F11.S01.M01 V02 and F11.S01.M02 re-check when signing is the owner's publish decision: a PublicationRecord of the listing in status submitted (after confirmation where needed) or active, or in policy_attention during a re-publication of a newer revision that passed V01 to V22; unpublish and end withdraw it. Privacy ports (N6): the module registers ExportSectionPort (section bazaar.publications), DeletionPort (end every publication with reason account_deleted, pseudonymize ownerId in retained records) and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02. Variant subsets come from F01.S03.M02 through the ProjectionContributorPort that it registers here.

### Example

```
vault.dispatch("bazaar.publication.publish", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 5,
  "relayIds": ["relay:abrq5gguqtrwbwrgupnsqfxm7b", "relay:4uxxpspglt72i7qxcnsd3gjeo2"], "expiresInDays": 30 }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000031")
=> { "publicationId": "0192f3a6-...", "status": "active", "verdict": "allow", "riskLevel": "low", "statementCid": "sha256-Zm9v...", "statementSeq": 12,
     "deliveries": [ { "relayId": "relay:abrq5gguqtrwbwrgupnsqfxm7b", "syncState": "prepared" } ], "skippedRelays": ["relay:4uxxpspglt72i7qxcnsd3gjeo2"] }
(projection signed by F11.S01.M02 federation.record.publish, seq 12 allocated there)
later: delivery syncState transport_acknowledged when the verified classrup.platform.relay_receipt/v1 completes the outbox entry (acknowledger none; never peer_accepted).
vault.dispatch("bazaar.publication.receive_relay_notice", { "envelope": { "type": "classrup.federation.relay_removal/v1", "author": "did:key:z6MkRelayR2...", ... }, "provenance": { "relayId": "relay:abrq5gguqtrwbwrgupnsqfxm7b" } })
=> { "accepted": false, "quarantineReason": "signer_not_relay" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-01.R04, PS-004-04.R02, PS-004-09.R02 | publish L and W, then unpublish | projection validates against classrup.bazaar.listing/v1 and its key set equals the allowlist exactly (barterAcceptable, inStock, expiresAt, mailboxHints, tenantId and media with alt or decorative present; no status, closeReason, currentPublicationId or minOffer; W has no maxBudget); region <= 5 chars; signature by F11.S01.M02 verifies; tombstone validates |
| TEST-PS-004-09.T06 | integration | PS-004-04.R01, PS-004-04.R03 | publish with review verdict then confirm | held_for_confirmation first, active after confirm with ownerConfirmedAt |
| TEST-PS-004-09.T07 | contract | PS-004-04.R02 | each command runs | outputs and events validate against registry schemas |
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03, PS-004-04.R04 | R2 signs a classrup.federation.relay_removal/v1 advisory with a statement of reasons for L, then a foreign-author statement reaches a receiving vault | delivery relay_removed with hostingRemoved {reasonCode, removalCid, statementOfReasons} only for R2; Listing status and R1 delivery unchanged; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T13 | integration | PS-004-03.R01, PS-004-03.R05, PS-004-02.R09, PS-004-04.R08 | governance.prohibited_rule.changed adds a block rule matching active L; renew and publish of the unchanged revision; 6 days, then 7 days pass; the owner edits L so the verdict clears and publishes it; in a second run the owner confirms Unpublish; in a third run a later pack retires the rule | L moves to policy_attention with bazaar.publication.policy_attention raised for ownerId and no unpublish, end or federation.tombstone.issue call; renew and unchanged publish refused with BAZAAR_PUBLISH_POLICY_ATTENTION; no reminder at day 6, one at day 7; the edited revision is published and the attention resolved as edited; the confirmation unpublishes with reason policy_changed and only then issues the tombstone; the retirement returns L to active as verdict_cleared without a new statement |
| TEST-PS-004-09.T14 | abuse | PS-004-04.R04 | a relay_removal for R2 signed by R1, one signed by a random key, a replay of an accepted advisory, then a valid R2 reversal | first three quarantined (signer_not_relay, signature_invalid or signer_not_relay, duplicate); reversal clears hostingRemoved on R2 only |
| TEST-PS-004-09.T15 | integration | PS-004-03.R04, PS-004-04.R05 | attach_promotion, a crypto claim finalized only by the seller's own verifier, then commerce.payment.acknowledged by the operator with verificationSource chain, then a promotion statement signed by R1 vs by a random key, then a signed withdrawal | Deal opened with contextRef listing_fee and payee operatorDid; finalized alone keeps the promotion claimed with the label final per your verifier; acknowledged only after the operator's acknowledgement, without label; active only for R1's signature with promotion_activated; revoked after withdrawal |
| TEST-PS-004-09.T25 | contract | PS-004-04.R02, PS-004-06.R02 | publish, renew, unpublish and end with reason expired through the StatementPublisherPort test double | every statement is created by federation.record.publish or federation.tombstone.issue with the seq returned by F11.S01.M02; the module calls no signing primitive and keeps no seq counter; bazaar.listing.unpublished carries tombstoneCid; end with reason expired returns tombstoneCid and emits no bazaar.listing.unpublished |
| TEST-PS-004-09.T26 | integration | PS-004-04.R06 | outbox double moves R1's entry to completed on a verified classrup.platform.relay_receipt/v1 (acknowledger none from the F11.S01.M01 registry), and R2's entry to failed with failureReason relay_rejected and lastError.reasonCid; relayIds use the canonical form | R1 delivery transport_acknowledged and never peer_accepted, with no peer acknowledgement awaited; R2 delivery relay_rejected with rejectReasonCid; a relayId like relay:berlin.example is refused with VALIDATION_FAILED |
| TEST-PS-004-09.T27 | contract | PS-004-04.R07 | F09.S01.M01 conformance suite calls the listing_fee ContextTermsPort with the Deal of T15, then with a doubled amount and a wrong payee | verify confirms parties and obligation for the matching Deal and rejects the others; openerRole and ownerRole return listing author |
| TEST-PS-004-09.T30 | integration | PS-004-03.R01, PS-004-04.R01 | edit active L to revision 6 and publish; publish revision 6 again; edit to revision 7 matching review rule r1 and publish without, then with confirmedRules and confirmedRisk | revision 6 projection published in place with the next seq and bazaar.listing.published; the repeat refused with BAZAAR_PUBLISH_NOT_ALLOWED; revision 7 refused with BAZAAR_PUBLISH_CONFIRMATION_REQUIRED first, published with ownerConfirmedAt after confirmation; one live PublicationRecord throughout |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
