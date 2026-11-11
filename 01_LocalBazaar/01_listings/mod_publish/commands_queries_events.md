# PS-004-04 — Commands, queries and events: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-04.R01** publish, confirm, unpublish, renew and attach_promotion are vault commands; publish, unpublish and renew produce signed statements, confirm and attach_promotion produce them only as a consequence of publish or the Deal they open.
- **PS-004-04.R02** Statements produced: classrup.bazaar.listing/v1 (projection, seq n) and classrup.federation.tombstone/v1; both go to the sync outbox with per-destination states.
- **PS-004-04.R03** No relay command is required: relays accept statements through their own index endpoints defined in F06 and F11.
- **PS-004-04.R04** Relay notices (classrup.moderation.reasons/v1, classrup.moderation.reversal/v1 and classrup.bazaar.promotion/v1) are accepted only through bazaar.publication.receive_relay_notice when signed by the pinned key of the relay of that delivery and targeting this publication's statementCid; they are deduplicated by cid, anything else is quarantined, and they change only that relay's delivery or promotion state (N17).
- **PS-004-04.R05** attach_promotion opens a noncustodial Deal with commerce.deal.open {contextRef {type: listing_fee, id: publicationId}, contextCid: statementCid, payee: the relay operator DID} (N5, FLOW-01); the vault never shows paid or promoted on the strength of a payment event.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.publication.publish` | bazaar.publication.publish | [vault-local + statement classrup.bazaar.listing/v1] { listingId, expectedRevision, relayIds[], expiresInDays? (default 30), federationOptIn?, acknowledgedNoticeIds?, jurisdictionProfileId? } | { publicationId, status, verdict, riskLevel, matchedRuleKeys?, statementCid?, deliveries[], skippedRelays[], clockWarning? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_PUBLISH_NOT_ALLOWED, BAZAAR_PUBLISH_INCOMPLETE, BAZAAR_PUBLISH_BLOCKED, BAZAAR_PUBLISH_LIMIT, BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED, DISCOVERY_PRECISION_FORBIDDEN, PRECONDITION_FAILED, FEATURE_DISABLED | bazaar.listing.published | yes (Idempotency-Key) |
| `bazaar.publication.confirm` | bazaar.publication.confirm | [vault-local + statement classrup.bazaar.listing/v1] { publicationId, expectedRevision, confirmedRuleKeys[], confirmedRisk? } | { publicationId, status: active, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_CONFIRMATION_REQUIRED, EXPIRED | bazaar.listing.published | yes (Idempotency-Key) |
| `bazaar.publication.unpublish` | bazaar.publication.unpublish | [vault-local + statement classrup.federation.tombstone/v1] { publicationId, expectedRevision, confirmHolds? } | { publicationId, status: unpublished, tombstoneCid, activeHolds } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_HOLDS_ACTIVE | bazaar.listing.unpublished | yes (Idempotency-Key) |
| `bazaar.publication.end` | bazaar.publication.end | [vault-local, internal port + tombstone statement] { listingId, reason: closed\|archived\|account_deleted\|policy_changed } | { publicationId?, ended: boolean } | NOT_FOUND, CONFLICT_STATE | bazaar.listing.unpublished | yes (Idempotency-Key) |
| `bazaar.publication.renew` | bazaar.publication.renew | [vault-local + statement classrup.bazaar.listing/v1] { publicationId, expectedRevision, requestedBy?: owner\|expiry_deferral } | { publicationId, expiresAt, renewals, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_RENEW_NOT_ALLOWED, PRECONDITION_FAILED | bazaar.publication.renewed | yes (Idempotency-Key) |
| `bazaar.publication.attach_promotion` | bazaar.publication.promote | [vault-local; opens a Deal through commerce.deal.open, which produces classrup.commerce.deal/v1] { publicationId, relayId, tier: boost_7d\|boost_14d, price: Money (from the relay's signed price list), operatorDid } | { publicationId, promotion: { state: requested, dealId } } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, COMMERCE_DEAL_CONTEXT_CONFLICT |  | yes (Idempotency-Key) |
| `bazaar.publication.receive_relay_notice` | bazaar.publication.receive_relay_notice | [vault-local, inbound relay-signed statement] { envelope: classrup.moderation.reasons/v1 \| classrup.moderation.reversal/v1 \| classrup.bazaar.promotion/v1, provenance } | { publicationId?, accepted: boolean, effect?: hosting_removed\|hosting_restored\|promotion_active\|promotion_withdrawn, quarantineReason?: signature_invalid\|signer_not_relay\|target_mismatch\|unknown_relay\|duplicate } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION | bazaar.publication.promotion_activated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.publication.get` | bazaar.publication.read | { publicationId } | { publication: PublicationRecord } | NOT_FOUND |
| `bazaar.publication.list_mine` | bazaar.publication.read | { status?, cursor?, limit <= 50 } | { items: PublicationRecord[], nextCursor? } | VALIDATION_FAILED |
| `bazaar.publication.preview_policy` | bazaar.publication.read | { listingId, jurisdictionProfileId? } | { verdict, riskLevel, matchedRuleKeys, requiredNoticeIds, rulesetVersion, projectionPreview } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.published` | P0 | { listingId, publicationId, ownerId, kind, categoryId, regionCell, listingRevision, publishedAt, expiresAt, federationOptIn, barterAcceptable, statementCid } |
| `bazaar.listing.unpublished` | P0 | { listingId, publicationId, ownerId, reason: owner\|policy_changed\|closed\|archived\|account_deleted, tombstoneCid } |
| `bazaar.publication.renewed` | P1 | { listingId, publicationId, listingRevision, expiresAt, renewals, statementCid, requestedBy } |
| `bazaar.publication.promotion_activated` | P1 | { listingId, publicationId, relayId, tier, activeUntil, promotionCid } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.expired` | end the active PublicationRecord with endReason expired and queue a tombstone |
| `governance.prohibited_rule.changed` | re-evaluate active publications in batches of 200; a new block verdict ends the publication with reason policy_changed |
| `governance.category.changed` | re-evaluate active publications in the changed category when the category became restricted or retired |
| `commerce.payment.claimed` | when the claim belongs to a promotion Deal of this vault, move the promotion from requested to claimed |
| `commerce.payment.acknowledged` | when the acknowledgement of a promotion claim is signed by promotion.operatorDid, move the promotion to acknowledged; never to active |
| `commerce.payment.finalized` | for a crypto promotion claim, move the promotion to acknowledged |
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
| BAZAAR_PUBLISH_BLOCKED | 422 | no | policy pack blocks this listing; params.ruleKeys and reasonKeys |
| BAZAAR_PUBLISH_CONFIRMATION_REQUIRED | 409 | no | a review-level rule matched or the risk level is elevated and the owner has not confirmed |
| BAZAAR_PUBLISH_LIMIT | 409 | no | vault already has 100 active publications |
| BAZAAR_PUBLISH_RENEW_NOT_ALLOWED | 409 | no | renewal window, count or total life limit not met |
| BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED | 409 | no | federation opt-in without a granted federation_publish consent for a destination relay |
| BAZAAR_PUBLISH_HOLDS_ACTIVE | 409 | no | the listing has active inventory holds; confirm to unpublish while keeping them |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.bazaar.listing/v1, signer role listing author (a registered device key of ownerId); classrup.federation.tombstone/v1 (F11 schema), signer role listing author; classrup.bazaar.promotion/v1, signer role operator key of the relay named by relayId; inbound classrup.moderation.reasons/v1 and classrup.moderation.reversal/v1 (F12.S02.M01 schemas), signer role the relay of that delivery, ingested here only for the vault's own publications. The relay key is the one pinned when the user selected the relay (published by F15.S02.M01 at /.well-known/classrup-relay.json). Privacy ports (N6): the module registers ExportSectionPort (section bazaar.publications), DeletionPort (end every publication with reason account_deleted, pseudonymize ownerId in retained records) and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02. Variant subsets come from F01.S03.M02 through the ProjectionContributorPort that it registers here.

### Example

```
vault.dispatch("bazaar.publication.publish", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 5,
  "relayIds": ["relay:berlin.example", "relay:hamburg.example"], "expiresInDays": 30 }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000031")
=> { "publicationId": "0192f3a6-...", "status": "active", "verdict": "allow", "riskLevel": "low", "statementCid": "sha256-Zm9v...",
     "deliveries": [ { "relayId": "relay:berlin.example", "syncState": "prepared" } ], "skippedRelays": ["relay:hamburg.example"] }
later: delivery syncState transport_acknowledged (relay receipt), then peer_accepted (relay signed acceptance).
vault.dispatch("bazaar.publication.receive_relay_notice", { "envelope": { "type": "classrup.moderation.reasons/v1", "author": "did:key:z6MkRelayR2...", ... }, "provenance": { "relayId": "relay:berlin.example" } })
=> { "accepted": false, "quarantineReason": "signer_not_relay" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-01.R04, PS-004-04.R02, PS-004-09.R02 | publish L and W, then unpublish | projection validates against classrup.bazaar.listing/v1 and its key set equals the allowlist exactly (barterAcceptable, inStock, expiresAt and mailboxHints present; no status, closeReason, currentPublicationId or minOffer; W has no maxBudget); region <= 5 chars; signature verifies; tombstone validates |
| TEST-PS-004-09.T06 | integration | PS-004-04.R01, PS-004-04.R03 | publish with review verdict then confirm | held_for_confirmation first, active after confirm with ownerConfirmedAt |
| TEST-PS-004-09.T07 | contract | PS-004-04.R02 | each command runs | outputs and events validate against registry schemas |
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03, PS-004-04.R04 | R2 signs a statement of reasons for L, then a foreign-author statement reaches a receiving vault | delivery relay_removed with hostingRemoved only for R2; Listing status and R1 delivery unchanged; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T14 | abuse | PS-004-04.R04 | a notice for R2 signed by R1, one signed by a random key, a replay of an accepted notice, then a valid R2 reversal | first three quarantined (signer_not_relay, signature_invalid or signer_not_relay, duplicate); reversal clears hostingRemoved on R2 only |
| TEST-PS-004-09.T15 | integration | PS-004-03.R04, PS-004-04.R05 | attach_promotion, payment claimed and acknowledged by the operator, then a promotion statement signed by R1 vs by a random key, then a signed withdrawal | Deal opened with contextRef listing_fee and payee operatorDid; acknowledged without label; active only for R1's signature with promotion_activated; revoked after withdrawal |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
