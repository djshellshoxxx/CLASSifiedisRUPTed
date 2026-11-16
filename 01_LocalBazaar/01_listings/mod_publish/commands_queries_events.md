# PS-004-04 — Commands, queries and events: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-04.R01** publish, confirm, unpublish, renew and attach_promotion are vault commands; publish, unpublish and renew produce signed statements, confirm and attach_promotion produce them only as a consequence of publish or a payment claim.
- **PS-004-04.R02** Statements produced: classrup.bazaar.listing/v1 (projection, seq n) and classrup.federation.tombstone/v1; both go to the sync outbox with per-destination states.
- **PS-004-04.R03** No relay command is required: relays accept statements through their own index endpoints defined in F06 and F11.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.publication.publish` | bazaar.publication.publish | [vault-local + statement classrup.bazaar.listing/v1] { listingId, expectedRevision, relayIds[], expiresInDays? (default 30), federationOptIn?, acknowledgedNoticeIds?, jurisdictionProfileId? } | { publicationId, status, verdict, matchedRuleKeys?, statementCid?, deliveries[] } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_PUBLISH_NOT_ALLOWED, BAZAAR_PUBLISH_INCOMPLETE, BAZAAR_PUBLISH_BLOCKED, BAZAAR_PUBLISH_LIMIT, PRECONDITION_FAILED, FEATURE_DISABLED | bazaar.listing.published | yes (Idempotency-Key) |
| `bazaar.publication.confirm` | bazaar.publication.confirm | [vault-local + statement classrup.bazaar.listing/v1] { publicationId, expectedRevision, confirmedRuleKeys[] } | { publicationId, status: active, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_CONFIRMATION_REQUIRED, EXPIRED | bazaar.listing.published | yes (Idempotency-Key) |
| `bazaar.publication.unpublish` | bazaar.publication.unpublish | [vault-local + statement classrup.federation.tombstone/v1] { publicationId, expectedRevision } | { publicationId, status: unpublished, tombstoneCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.listing.unpublished | yes (Idempotency-Key) |
| `bazaar.publication.end` | bazaar.publication.end | [vault-local, internal port + tombstone statement] { listingId, reason: closed\|archived\|account_deleted\|policy_changed } | { publicationId?, ended: boolean } | NOT_FOUND, CONFLICT_STATE | bazaar.listing.unpublished | yes (Idempotency-Key) |
| `bazaar.publication.renew` | bazaar.publication.renew | [vault-local + statement classrup.bazaar.listing/v1] { publicationId, expectedRevision } | { publicationId, expiresAt, renewals } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_PUBLISH_RENEW_NOT_ALLOWED | bazaar.publication.renewed | yes (Idempotency-Key) |
| `bazaar.publication.attach_promotion` | bazaar.publication.promote | [vault-local] { publicationId, relayId, tier: boost_7d\|boost_14d, claimId (F09 PaymentClaim) } | { publicationId, promotion: { state: claimed } } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.publication.get` | bazaar.publication.read | { publicationId } | { publication: PublicationRecord } | NOT_FOUND |
| `bazaar.publication.list_mine` | bazaar.publication.read | { status?, cursor?, limit <= 50 } | { items: PublicationRecord[], nextCursor? } | VALIDATION_FAILED |
| `bazaar.publication.preview_policy` | bazaar.publication.read | { listingId, jurisdictionProfileId? } | { verdict, matchedRuleKeys, requiredNoticeIds, rulesetVersion } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.published` | P0 | { listingId, publicationId, ownerId, kind, categoryId, regionCell, listingRevision, publishedAt, expiresAt, federationOptIn, statementCid } |
| `bazaar.listing.unpublished` | P0 | { listingId, publicationId, ownerId, reason: owner\|policy_changed\|closed\|archived\|account_deleted, tombstoneCid } |
| `bazaar.publication.renewed` | P1 | { listingId, publicationId, expiresAt, renewals } |
| `bazaar.publication.promotion_activated` | P1 | { listingId, publicationId, relayId, tier, activeUntil } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.expired` | end the active PublicationRecord with endReason expired and queue a tombstone |
| `governance.prohibited_rule.changed` | re-evaluate active publications in batches of 200; a new block verdict ends the publication with reason policy_changed |
| `governance.category.changed` | re-evaluate active publications in the changed category when the category became restricted or retired |
| `moderation.action.applied` | when a relay hosting notice targets one of this vault's listings, set that delivery to relay_removed with the signed reason; the local publication stays active and other relays are unaffected |
| `moderation.action.reverted` | clear relay_removed on that delivery and allow resubmission to the relay |
| `commerce.payment.acknowledged` | when the claim belongs to a promotion and the relay operator signed the acknowledgement, set promotion.state active and emit bazaar.publication.promotion_activated |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_PUBLISH_NOT_ALLOWED | 409 | no | listing status or a relay notice does not allow publication now |
| BAZAAR_PUBLISH_INCOMPLETE | 422 | no | required fields, terms or region are missing; params.fields lists them |
| BAZAAR_PUBLISH_BLOCKED | 422 | no | policy pack blocks this listing; params.ruleKeys and reasonKeys |
| BAZAAR_PUBLISH_CONFIRMATION_REQUIRED | 409 | no | a review-level rule matched and the owner has not confirmed |
| BAZAAR_PUBLISH_LIMIT | 409 | no | vault already has 100 active publications |
| BAZAAR_PUBLISH_RENEW_NOT_ALLOWED | 409 | no | renewal window, count or total life limit not met |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault.dispatch("bazaar.publication.publish", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 5,
  "relayIds": ["relay:berlin.example"], "expiresInDays": 30 }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000031")
=> { "publicationId": "0192f3a6-...", "status": "active", "verdict": "allow", "statementCid": "sha256-Zm9v...",
     "deliveries": [ { "relayId": "relay:berlin.example", "syncState": "prepared" } ] }
later: delivery syncState transport_acknowledged (relay receipt), then peer_accepted (relay signed acceptance).
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-04.R02, PS-004-09.R02 | publish and unpublish | projection validates against classrup.bazaar.listing/v1, only P0 allowlisted fields, region <= 5 chars, signature verifies, tombstone validates |
| TEST-PS-004-09.T06 | integration | PS-004-04.R01, PS-004-04.R03 | publish with review verdict then confirm | held_for_confirmation first, active after confirm with ownerConfirmedAt |
| TEST-PS-004-09.T07 | contract | PS-004-04.R02 | each command runs | outputs and events validate against registry schemas |
| TEST-PS-004-09.T14 | integration | PS-004-04.R03 | moderation.action.applied then reverted for R2 | relay_removed set then cleared; local status unchanged |
| TEST-PS-004-09.T15 | integration | PS-004-04.R01 | promotion claim acknowledged by relay operator vs by a random key | active only for the operator signature |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
