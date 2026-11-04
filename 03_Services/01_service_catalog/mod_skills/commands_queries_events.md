# PS-029-04 — Commands, queries and events: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-04.R01** The module exposes create, revise, publish and withdraw as vault commands (publish and withdraw additionally produce signed statements) and two local queries.
- **PS-029-04.R02** Each command writes its local events to the vault outbox in the same IndexedDB transaction as the state change per EVT-8; only the explicit publish and withdraw commands create a signed statement (EVT-9).
- **PS-029-04.R03** The module consumes listing events so that offerings never stay published locally without a published listing; relay moderation never arrives as an event because it changes nothing locally.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.offering.create` | services.offering.create | [vault-local] { listingId, skillCodes[], rateType, rate: Money, minBillableMinutes?, serviceAreaCell, remoteCapable, credentials? } | { offeringId, revision: 1 } | VALIDATION_FAILED, SERVICES_SKILL_INVALID, SERVICES_AREA_TOO_PRECISE, SERVICES_LISTING_NOT_SERVICE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `services.offering.revise` | services.offering.revise | [vault-local] { offeringId, expectedRevision, patch: partial of create fields } | { offeringId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_SKILL_INVALID, SERVICES_AREA_TOO_PRECISE, SERVICES_RATE_IMMUTABLE | services.offering.revised | yes (Idempotency-Key) |
| `services.offering.publish` | services.offering.publish | [vault-local plus statement classrup.services.offering/v1 signed by the provider device key] { offeringId, expectedRevision, relayIds? (user-selected relays, max 5) } | { offeringId, revision, publishedAt, projectionCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_OFFERING_LIMIT, SERVICES_LISTING_NOT_SERVICE, PRECONDITION_FAILED | services.offering.published | yes (Idempotency-Key) |
| `services.offering.withdraw` | services.offering.withdraw | [vault-local plus tombstone statement classrup.federation.tombstone/v1 per CTR-FED-001 FED-4] { offeringId, expectedRevision } | { offeringId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.offering.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.offering.get` | services.offering.read_public | [vault-local] { offeringId } | { offering: ServiceOffering (published only unless caller is the provider) } | NOT_FOUND |
| `services.offering.list_mine` | services.offering.read_own | [vault-local] { status?, cursor?, limit ≤ 50 } | { items: ServiceOffering[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.offering.published` | P0 | { offeringId, providerId, listingId, skillCodes, rateType, rate, serviceAreaCell } |
| `services.offering.withdrawn` | P0 | { offeringId, providerId, listingId, reason } |
| `services.offering.revised` | P0 | { offeringId, providerId, changedFields[] } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | withdraw the linked published offering with reason listing_unavailable |
| `bazaar.listing.expired` | withdraw the linked published offering with reason listing_unavailable |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_SKILL_INVALID | 422 | no | a skill code is unknown or the count is outside 1..10 |
| SERVICES_AREA_TOO_PRECISE | 422 | no | service area is finer than geohash 5 (L2) |
| SERVICES_LISTING_NOT_SERVICE | 409 | no | linked listing is missing, not of subtype service, or not owned by the provider |
| SERVICES_OFFERING_LIMIT | 409 | no | provider already has 20 published offerings |
| SERVICES_RATE_IMMUTABLE | 409 | no | rate type and currency cannot change after publication |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/cmd/services.offering.create
Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000a1
{ "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "skillCodes": ["svc.plumbing.repair"], "rateType": "hourly",
  "rate": { "amount": "4500", "currency": "EUR" }, "serviceAreaCell": "u0yj1", "remoteCapable": false }
201 { "offeringId": "0192f3a5-1111-7000-8000-000000000001", "revision": 1 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T05 | integration | PS-029-03.R03, PS-029-04.R03 | bazaar.listing.unpublished event delivered twice and a relay refusal received | offering withdrawn once with reason listing_unavailable; relay refusal changes only sync state |
| TEST-PS-029-09.T06 | contract | PS-029-04.R01, PS-029-04.R02, PS-029-09.R02 | execute each command and read both queries | outputs and event payloads validate against registry schemas |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
