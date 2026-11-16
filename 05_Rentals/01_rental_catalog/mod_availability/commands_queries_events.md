# PS-039-04 — Commands, queries and events: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-04.R01** Offering and reservation commands are vault commands; request, confirm, decline, cancel and publish produce named signed statements and sync outbox entries in the same vault transaction.
- **PS-039-04.R02** One ingestion command applies inbound statements, deduplicates by cid and derives local events with actor.kind federated; failures are quarantined with a reason.
- **PS-039-04.R03** Events are local (EVT-8) and leave the device only as the statements named below; the module consumes lifecycle events from handoff, return and listing modules.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.offering.create` | rentals.offering.manage | [vault-local] { listingId, hourlyRate?, dailyRate?, quantity, minDurationMinutes, maxDurationDays, bufferBeforeMinutes, bufferAfterMinutes, leadTimeMinutes, horizonDays, timeZone, blackoutDates?, lateFee, autoConfirm, pickupAreaCell } | { offeringId, revision: 1, status: draft } | VALIDATION_FAILED, RENTALS_TZ_UNKNOWN |  | yes (Idempotency-Key) |
| `rentals.offering.revise` | rentals.offering.manage | [vault-local] { offeringId, expectedRevision, patch } | { offeringId, revision, affectedReservationIds[] } | NOT_FOUND, CONFLICT_REVISION, VALIDATION_FAILED, RENTALS_TZ_UNKNOWN |  | yes (Idempotency-Key) |
| `rentals.offering.publish` | rentals.offering.publish | [statement classrup.rentals.offering/v1 signed by owner, uploaded to user-selected relays] { offeringId, expectedRevision, relayIds? (max 5) } | { offeringId, revision, projectionCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | rentals.offering.published | yes (Idempotency-Key) |
| `rentals.availability.publish_busy` | rentals.offering.publish | [statement classrup.rentals.busy_blocks/v1 signed by owner, expiry 24 h, intervals only without identities] { offeringId, fromUtc, toUtc (≤ 365 days) } | { summaryCid, blockCount (≤ 500), syncState } | NOT_FOUND, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.reservation.request` | rentals.reservation.request | [statement classrup.rentals.rental_request/v1 signed by renter, E2E encrypted to owner] { offeringId, startsAt, endsAt, units, rateUnit, note? (≤ 500) } | { reservationId, requestCid, rent: Money, syncState } | VALIDATION_FAILED, RENTALS_OFFERING_UNAVAILABLE, RENTALS_BLACKOUT, RENTALS_REQUEST_LIMIT, BLOCKED_PARTY, RATE_LIMITED | rentals.reservation.requested | yes (Idempotency-Key) |
| `rentals.reservation.confirm` | rentals.reservation.decide | [statement classrup.rentals.rental_confirmation/v1 signed by owner over the request cid] { reservationId, expectedRevision } | { reservationId, revision, confirmationCid, dealId, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, RENTALS_INTERVAL_CONFLICT, RENTALS_BLACKOUT, DEPENDENCY_UNAVAILABLE | rentals.reservation.confirmed | yes (Idempotency-Key) |
| `rentals.reservation.cancel` | rentals.reservation.cancel | [statement classrup.rentals.rental_cancellation/v1 signed by the cancelling party; also used by the owner to decline] { reservationId, expectedRevision, reason } | { reservationId, revision, freedFrom, freedUntil } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | rentals.reservation.cancelled | yes (Idempotency-Key) |
| `rentals.reservation.receive` | rentals.reservation.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_INTERVAL_CONFLICT, CONFLICT_STATE | rentals.reservation.requested, rentals.reservation.confirmed, rentals.reservation.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.offering.get` | rentals.offering.read | [vault-local] { offeringId } | { offering: RentalOffering (own, or verified received projection) } | NOT_FOUND |
| `rentals.availability.list_busy` | rentals.offering.read | [vault-local] { offeringId, fromUtc, toUtc (≤ 365 days) } | { blocks: [{ fromUtc, untilUtc, units }] (≤ 500), source: own \| signed_summary, asOf } | NOT_FOUND |
| `rentals.reservation.list_mine` | rentals.reservation.read_own | [vault-local] { role?: owner\|renter, status?, cursor?, limit ≤ 50 } | { items: RentalReservation[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.reservation.requested` | P2 | { reservationId, offeringId, renterId, ownerId, startsAt, endsAt, units, requestCid } |
| `rentals.reservation.confirmed` | P2 | { reservationId, offeringId, renterId, ownerId, startsAt, endsAt, occupiedFrom, occupiedUntil, rent, lateFeeTerms, dealId, confirmationCid } |
| `rentals.reservation.cancelled` | P2 | { reservationId, cancelledBy, reason, freedFrom, freedUntil } |
| `rentals.offering.published` | P0 | { offeringId, ownerId, listingId, projectionCid } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | move a confirmed reservation to in_use |
| `rentals.rental.overdue` | move an in_use reservation to overdue and extend its occupied interval to the present |
| `rentals.return.attested` | move to returned and set occupiedUntil to return time plus bufferAfter |
| `rentals.rental.closed` | move a returned reservation to closed |
| `bazaar.listing.unpublished` | pause the linked offering and cancel requested reservations with reason offering_unavailable |
| `identity.block.added` | cancel requested reservations between the two parties with reason blocked |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role, schema or referenced cid check failed; statement quarantined |
| RENTALS_OFFERING_UNAVAILABLE | 409 | no | offering is not active, or the owner key differs |
| RENTALS_BLACKOUT | 409 | no | the interval touches a blackout date in the offering time zone |
| RENTALS_INTERVAL_CONFLICT | 409 | no | the interval including buffers exceeds the offering quantity |
| RENTALS_REQUEST_LIMIT | 409 | no | renter has too many open requests |
| RENTALS_TZ_UNKNOWN | 422 | no | time zone is not in the bundled tz database |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
renter vault: rentals.reservation.request { "offeringId": "0192f500-0001-…", "startsAt": "2026-12-05T09:00:00.000Z", "endsAt": "2026-12-07T09:00:00.000Z",
  "units": 1, "rateUnit": "day" } -> { "reservationId": "0192f500-0002-…", "rent": { "amount": "4000", "currency": "EUR" }, "syncState": "prepared" }
owner vault receives, checks [2026-12-05T07:00Z, 2026-12-07T11:00Z) with buffers 2 h, then confirms -> status confirmed, dealId set
renter sees confirmed only after the owner's signed confirmation is held locally
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T08 | integration | PS-039-04.R02, PS-039-06.R01, PS-039-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on confirmed with identical cids; duplicates skipped |
| TEST-PS-039-09.T09 | contract | PS-039-04.R01, PS-039-04.R03, PS-039-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-039-09.T11 | integration | PS-039-04.R03, PS-039-03.R01 | handoff, overdue, return and closed events delivered twice and out of order | reservation follows the machine; early return frees tail after buffer; overdue extends blocking |

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
