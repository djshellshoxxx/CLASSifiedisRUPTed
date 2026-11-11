# PS-029-04 — Commands, queries and events: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-04.R01** The module exposes create, revise, publish and withdraw as vault commands (publish, and revise of a published offering, additionally produce a signed projection statement) and two local queries.
- **PS-029-04.R02** Each command writes its local events to the vault outbox in the same IndexedDB transaction as the state change per EVT-8; only publish, a revision of a published offering and the key-revocation re-sign create a signed statement (EVT-9), and the withdrawal tombstone is issued by F11.S01.M02 from services.offering.withdrawn.
- **PS-029-04.R03** The module consumes listing, device key and deletion events so that offerings never stay published locally without a published listing or with a revoked signature; relay moderation never arrives as an event because it changes nothing locally.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.offering.create` | services.offering.create | [vault-local] { listingId, skillCodes[], rateType, rate: Money, minBillableMinutes?, serviceAreaCell, remoteCapable, credentials? } | { offeringId, revision: 1 } | VALIDATION_FAILED, SERVICES_SKILL_INVALID, SERVICES_AREA_TOO_PRECISE, SERVICES_LISTING_NOT_SERVICE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `services.offering.revise` | services.offering.revise | [vault-local; for a published offering plus statement classrup.services.offering/v1 with seq+1 and prev] { offeringId, expectedRevision, patch: partial of create fields } | { offeringId, revision, projectionCid?, seq? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_SKILL_INVALID, SERVICES_AREA_TOO_PRECISE, SERVICES_RATE_IMMUTABLE, SERVICES_PUBLISH_CONSENT_MISSING | services.offering.revised, services.offering.published | yes (Idempotency-Key) |
| `services.offering.publish` | services.offering.publish | [vault-local plus statement classrup.services.offering/v1 signed by the provider device key after privacy.consent.check(federation_publish, relayId) per relay] { offeringId, expectedRevision, relayIds? (user-selected relays, max 5), prv6Acknowledged: true } | { offeringId, revision, publishedAt, projectionCid, seq, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_OFFERING_LIMIT, SERVICES_LISTING_NOT_SERVICE, SERVICES_PUBLISH_CONSENT_MISSING, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE | services.offering.published | yes (Idempotency-Key) |
| `services.offering.withdraw` | services.offering.withdraw | [vault-local; no statement is signed here - for a published offering F11.S01.M02 issues the FED-4 tombstone from services.offering.withdrawn, a draft withdrawal stays in the vault] { offeringId, expectedRevision } | { offeringId, revision, withdrawReason } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.offering.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.offering.get` | services.offering.read_public | [vault-local] { offeringId } | { offering: ServiceOffering for the provider, or the verified P0 projection of the highest seq for anyone else } | NOT_FOUND |
| `services.offering.list_mine` | services.offering.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: ServiceOffering[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.offering.published` | P0 | { offeringId, providerId, listingId, skillCodes, rateType, rate, serviceAreaCell, providerTimeZone, remoteCapable, projectionCid, seq, publishedAt } |
| `services.offering.withdrawn` | P0 | { offeringId, providerId, listingId, reason: provider\|listing_unavailable, tombstoneReason: owner_withdrawn\|listing_expired, projectionCid } |
| `services.offering.revised` | P3 | { offeringId, providerId, changedFields[], published: boolean, projectionCid?, seq? } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | withdraw the linked published offering with reason listing_unavailable (any F01 reason, including policy_changed) and tombstoneReason owner_withdrawn; a linked draft is withdrawn vault-locally |
| `bazaar.listing.expired` | withdraw the linked published offering with reason listing_unavailable and tombstoneReason listing_expired; a linked draft is withdrawn vault-locally |
| `identity.device_key.revoked` | re-sign every published projection signed by the revoked key with a current key (same content, seq+1, prev) and queue it to the same relays; emits services.offering.published |
| `privacy.deletion.completed` | replace the erased principal's DID in the provenance of stored foreign projections with the deletion pseudonym or drop those projections; the local principal's own offerings were withdrawn and purged by the DeletionPort plan |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_SKILL_INVALID | 422 | no | a skill code is unknown or the count is outside 1..10 |
| SERVICES_AREA_TOO_PRECISE | 422 | no | service area is finer than geohash 5 (L2) |
| SERVICES_LISTING_NOT_SERVICE | 409 | no | linked listing is missing, not of subtype service, or not owned by the provider |
| SERVICES_OFFERING_LIMIT | 409 | no | provider already has 20 published offerings |
| SERVICES_RATE_IMMUTABLE | 409 | no | rate type and currency cannot change after publication |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2): classrup.services.offering/v1 has signer role provider (offering.providerId) and carries only the F11.S01.M01 allowlist {offeringId, providerId, listingId, skillCodes, rateType, rate, minBillableMinutes, serviceAreaCell, providerTimeZone, remoteCapable, credentials without evidence references, seq, prev, publishedAt}; receivers keep the highest seq per offering (FED-3). The tombstone classrup.federation.tombstone/v1 for a withdrawn published offering is issued only by F11.S01.M02 with target projectionCid and reason owner_withdrawn (withdrawReason provider or listing unpublished) or listing_expired (listing expired). Drafts produce no statement.

### Example

```
vault command services.offering.create
{ "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "skillCodes": ["svc.plumbing.repair"], "rateType": "hourly",
  "rate": { "amount": "4500", "currency": "EUR" }, "serviceAreaCell": "u0yj1", "remoteCapable": false }
-> { "offeringId": "0192f3a5-1111-7000-8000-000000000001", "revision": 1 }
vault command services.offering.publish { "offeringId": "0192f3a5-1111-…", "expectedRevision": 1, "relayIds": ["relay.example.org"], "prv6Acknowledged": true }
-> { "revision": 2, "publishedAt": "2026-11-04T10:00:00.000Z", "projectionCid": "sha256-Pq…", "seq": 1, "syncState": { "relay.example.org": "prepared" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T05 | integration | PS-029-03.R03, PS-029-04.R03 | bazaar.listing.unpublished (reason policy_changed) delivered twice, then a relay refusal with a statement of reasons | offering withdrawn once with reason listing_unavailable; refusal stored only as syncState[relay] refused with the relay statement |
| TEST-PS-029-09.T06 | contract | PS-029-04.R01, PS-029-04.R02, PS-029-09.R02 | execute each command and read both queries | outputs and event payloads (including projectionCid, seq, publishedAt and providerTimeZone) validate against registry schemas |
| TEST-PS-029-09.T17 | integration | PS-029-03.R01, PS-029-04.R02 | revise the rate of a published offering, then revoke the signing key | new projection with seq+1 and prev = old cid; relay and client views carry the new projectionCid and rate; after revocation the same content is re-signed with a current key |
| TEST-PS-029-09.T19 | integration | PS-029-04.R02, PS-029-07.R04 | withdraw a never-published draft and a published offering | draft produces no outbound statement, no tombstone and no event; published produces one services.offering.withdrawn with tombstoneReason and projectionCid and this module signs no tombstone |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F03.S01.M02, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
