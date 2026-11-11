# PS-039-04 — Commands, queries and events: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-04.R01** Offering and reservation commands are vault commands; request, confirm, decline, cancel, renegotiate and publish produce named signed statements and sync outbox entries in the same vault transaction.
- **PS-039-04.R02** One ingestion command applies inbound statements, deduplicates by cid and derives local events with actor.kind federated; failures are quarantined with a reason.
- **PS-039-04.R03** Events are local (EVT-8) and leave the device only as the statements named below; the module consumes lifecycle events from handoff, return, listing, consent, block, Deal and deletion modules.
- **PS-039-04.R04** Rent and cancellation fees are noncustodial Deals opened through commerce.deal.open with contextRef types rental_reservation and rental_cancellation_fee, and a cancelled reservation that holds a Deal produces a commerce.deal.cancel statement for both parties to sign; the module never creates or alters a PaymentClaim.
- **PS-039-04.R05** Every statement schema this module sends is registered in the F11.S01.M01 statement registry with its signer role, consents use comms.consent.sign and comms.consent.verify with this module's SubjectCanonicalizerPort, and the receiving vault acts only on statements it accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.offering.create` | rentals.offering.manage | [vault-local] { listingId, hourlyRate?, dailyRate?, quantity, minDurationMinutes, maxDurationDays, bufferBeforeMinutes, bufferAfterMinutes, leadTimeMinutes, horizonDays, timeZone, blackoutDates?, lateFee, cancellationPolicy, declaredValue, checklistTemplate, autoConfirm, pickupAreaCell } | { offeringId, revision: 1, status: draft } | VALIDATION_FAILED, RENTALS_TZ_UNKNOWN, DISCOVERY_PRECISION_FORBIDDEN |  | yes (Idempotency-Key) |
| `rentals.offering.revise` | rentals.offering.manage | [vault-local] { offeringId, expectedRevision, patch } | { offeringId, revision, affectedReservationIds[] (open requests whose bound terms now differ) } | NOT_FOUND, CONFLICT_REVISION, VALIDATION_FAILED, RENTALS_TZ_UNKNOWN, DISCOVERY_PRECISION_FORBIDDEN |  | yes (Idempotency-Key) |
| `rentals.offering.publish` | rentals.offering.publish | [statement classrup.rentals.offering/v1 signed by owner, allowlisted fields only, uploaded to user-selected relays after privacy.consent.check federation_publish per relay and assertPublicCell] { offeringId, expectedRevision, relayIds? (max 5) } | { offeringId, revision, projectionCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_PUBLISH_CONSENT_REQUIRED, DISCOVERY_PRECISION_FORBIDDEN | rentals.offering.published | yes (Idempotency-Key) |
| `rentals.availability.publish_busy` | rentals.offering.publish | [statement classrup.rentals.busy_blocks/v1 signed by owner, expiry 24 h, intervals only without identities, after privacy.consent.check federation_publish per relay] { offeringId, fromUtc, toUtc (≤ 365 days), relayIds? (max 5) } | { summaryCid, blockCount (≤ 500), syncState } | NOT_FOUND, VALIDATION_FAILED, RENTALS_PUBLISH_CONSENT_REQUIRED |  | yes (Idempotency-Key) |
| `rentals.reservation.request` | rentals.reservation.request | [statement classrup.rentals.rental_request/v1 signed by renter, E2E encrypted to owner, binding offeringRevision, projectionCid, rent, lateFeeTerms, cancellationPolicy, declaredValue and expiresAt; plus comms.consent.sign {subjectType rentals_reservation, subjectRef reservationId, subjectRevision 1, subjectRevisionHash of the request terms, statementKey consent.rentals.reservation.request.v1, statementTextHash of its registered wording}] { offeringId, offeringRevision, projectionCid, startsAt, endsAt, units, rateUnit, note? (≤ 500) } | { reservationId, requestCid, requestConsentCid, rent: Money, expiresAt, syncState } | VALIDATION_FAILED, RENTALS_OFFERING_UNAVAILABLE, RENTALS_BLACKOUT, RENTALS_REQUEST_LIMIT, BLOCKED_PARTY, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | rentals.reservation.requested | yes (Idempotency-Key) |
| `rentals.reservation.confirm` | rentals.reservation.decide | [statement classrup.rentals.rental_confirmation/v1 signed by owner over the request cid, plus comms.consent.sign with statementKey consent.rentals.reservation.confirm.v1 over the same terms hash] { reservationId, expectedRevision } | { reservationId, revision, confirmationCid, confirmConsentCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, RENTALS_INTERVAL_CONFLICT, RENTALS_BLACKOUT, RENTALS_TERMS_CHANGED, DEPENDENCY_UNAVAILABLE | rentals.reservation.confirmed | yes (Idempotency-Key) |
| `rentals.reservation.cancel` | rentals.reservation.cancel | [statement classrup.rentals.rental_cancellation/v1 signed by the cancelling party; also used by the owner to decline and to notify an expiry; reason no_handoff only from the F05.S02.M01 expiry call; when the owner vault accepts a renter cancellation after the free period it calls commerce.deal.open {contextRef {rental_cancellation_fee, reservationId}, contextCid the renter's cancellation cid, one obligation renter to owner of cancellationPolicy.fee, purpose other}] { reservationId, expectedRevision, reason } | { reservationId, revision, freedFrom, freedUntil, feeDealId? (deterministic from contextRef and contextCid), dealCancelPending? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, FORBIDDEN | rentals.reservation.cancelled | yes (Idempotency-Key) |
| `rentals.reservation.renegotiate` | rentals.reservation.renegotiate | [statement classrup.rentals.reservation_renegotiation/v1 signed by the proposing party and co-signed by the other over the same cid; kind accept_late_confirmation is the renter's acceptance naming the owner's confirmationCid] { reservationId, expectedRevision, kind: new_terms \| accept_late_confirmation \| cosign, startsAt?, endsAt?, units?, renegotiationCid? } | { reservationId, revision, renegotiationCid, signatures: 1 \| 2, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_INTERVAL_CONFLICT, RENTALS_BLACKOUT, VALIDATION_FAILED, EXPIRED | rentals.reservation.confirmed | yes (Idempotency-Key) |
| `rentals.reservation.receive` | rentals.reservation.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_INTERVAL_CONFLICT, EXPIRED, CONFLICT_STATE | rentals.reservation.requested, rentals.reservation.confirmed, rentals.reservation.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.offering.get` | rentals.offering.read | [vault-local] { offeringId } | { offering: RentalOffering (own, or verified received projection) } | NOT_FOUND |
| `rentals.availability.list_busy` | rentals.offering.read | [vault-local] { offeringId, fromUtc, toUtc (≤ 365 days) } | { blocks: [{ fromUtc, untilUtc, units }] (≤ 500), source: own \| signed_summary, asOf } | NOT_FOUND |
| `rentals.reservation.get` | rentals.reservation.read_own | [vault-local] { reservationId } | { reservation: RentalReservation, consentStatus: valid \| stale \| revoked \| conflicted \| missing } | NOT_FOUND |
| `rentals.reservation.list_mine` | rentals.reservation.read_own | [vault-local] { role?: owner\|renter, status?, cursor?, limit ≤ 50 } | { items: RentalReservation[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.reservation.requested` | P2 | { reservationId, offeringId, renterId, ownerId, startsAt, endsAt, units, expiresAt, requestCid } |
| `rentals.reservation.confirmed` | P2 | { reservationId, offeringId, renterId, ownerId, parties: [{did: ownerId, role: owner}, {did: renterId, role: renter}], startsAt, endsAt, occupiedFrom, occupiedUntil, rent, lateFeeTerms, cancellationPolicy, declaredValue, checklistTemplate, requestCid, confirmationCid } |
| `rentals.reservation.cancelled` | P2 | { reservationId, ownerId, renterId, cancelledBy (did), reason, freedFrom, freedUntil, feeDealId? } |
| `rentals.offering.published` | P0 | { offeringId, ownerId, listingId, projectionCid } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | move a confirmed or handoff_pending reservation to in_use; in the owner vault open the rent Deal with commerce.deal.open as described in the note |
| `rentals.rental.overdue` | move an in_use reservation to overdue and extend its occupied interval to the present |
| `rentals.return.attested` | move to returned and set occupiedUntil to the effective return time plus bufferAfter |
| `rentals.rental.closed` | move a returned reservation to closed; move an in_use or overdue reservation closed without return (not_returned, owner_silent, unresolved) to closed and end its occupied interval at closedAt |
| `bazaar.listing.unpublished` | pause the linked offering and answer requested reservations with a signed decline, reason offering_unavailable |
| `identity.block.added` | requested reservations between the two parties: the owner vault cancels them locally with reason blocked and sends nothing (the renter vault lapses them by its own expiry rule), the renter vault cancels its own request with a signed cancellation reason renter; confirmed and later reservations are unaffected and their notifications are suppressed through filterBlocked |
| `comms.consent.revoked` | freeze a requested, confirmed or handoff_pending reservation whose request or confirm consent was revoked, after comms.consent.verify confirms the status |
| `commerce.deal.cancelled` | for contextRef rental_reservation or rental_cancellation_fee of a reservation, clear dealCancelPending |
| `privacy.deletion.completed` | replace the deleted party's DID in retained reservations and statement metadata with the deletion pseudonym; signed statement bytes are kept so signatures still verify |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role, consent, cancellation reason, schema or referenced cid check failed for a rentals statement; statement quarantined |
| RENTALS_OFFERING_UNAVAILABLE | 409 | no | offering is not active, or the owner key differs |
| RENTALS_BLACKOUT | 409 | no | the interval touches a blackout date in the offering time zone |
| RENTALS_INTERVAL_CONFLICT | 409 | no | the interval including buffers exceeds the offering quantity, counting frozen reservations |
| RENTALS_REQUEST_LIMIT | 409 | no | renter has too many open requests |
| RENTALS_TZ_UNKNOWN | 422 | no | time zone is not in the bundled tz database |
| RENTALS_TERMS_CHANGED | 409 | no | the offering terms differ from the terms the renter signed in the request; a new request is needed |
| RENTALS_PUBLISH_CONSENT_REQUIRED | 409 | no | federation_publish consent is not granted for a target relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles registered in F11.S01.M01 (N2): classrup.rentals.offering/v1 (owner), classrup.rentals.busy_blocks/v1 (owner), classrup.rentals.rental_request/v1 (renter), classrup.rentals.rental_confirmation/v1 (owner), classrup.rentals.rental_cancellation/v1 (renter or owner, reasons per V10; never the reason blocked), classrup.rentals.reservation_frozen/v1 (owner for forks and equivocation; renter for a held late confirmation), classrup.rentals.reservation_renegotiation/v1 (owner and renter, both signatures over one cid). Consents (N13, F08.S02.M02): classrup.comms.consent/v1 with subjectType rentals_reservation, subjectRef reservationId, subjectRevisionHash from this module's SubjectCanonicalizerPort (JCS bytes of the request terms), statement keys consent.rentals.reservation.request.v1 (renter) and consent.rentals.reservation.confirm.v1 (owner). Deals (N5): the rent Deal is opened by the owner vault when rentals.handoff.attested is derived - contextRef {type rental_reservation, id reservationId}, contextCid requestCid, parties [{did ownerId, role owner}, {did renterId, role renter}], one obligation renter to owner for rent with purpose rent, expiresInDays min(90, ceil(remaining rental days) + 14), which covers endsAt because the maximum duration is 90 days; the renter vault checks that the received Deal equals the signed rent. Opening at handoff means a reservation cancelled before handoff has no rent Deal; whenever a cancelled reservation does hold a dealId or feeDealId, the vault produces commerce.deal.cancel for both parties to sign and shows 'cancellation pending counterparty' until both signatures are held. The cancellation fee Deal uses contextRef {rental_cancellation_fee, reservationId}, contextCid the renter's cancellation cid, and is opened by the owner vault when it accepts that cancellation. This module implements the F09.S01.M01 ContextTermsPort for the types it registers, rental_reservation and rental_cancellation_fee - verify recomputes the parties and the single obligation from the signed rental_request (rent) or from the renter's signed cancellation and the copied cancellationPolicy (fee), openerRole and ownerRole are owner - and every cancellation of these Deals is mutual (commerce.deal.cancel signed by both), never the unilateral context_voided mode, so a renter's recorded payment is never voided by the owner alone. Blocks (N7): F07.S02.M02 isBlockedEither is checked only for new requests, which are dropped; statements for reservations confirmed before a block are verified and stored, and notifications about them are suppressed through filterBlocked.

### Example

```
renter vault: rentals.reservation.request { "offeringId": "0192f500-0001-…", "offeringRevision": 4, "projectionCid": "sha256-Of…",
  "startsAt": "2026-12-05T09:00:00.000Z", "endsAt": "2026-12-07T09:00:00.000Z", "units": 1, "rateUnit": "day" }
  -> { "reservationId": "0192f500-0002-…", "rent": { "amount": "4000", "currency": "EUR" }, "expiresAt": "2026-11-06T10:00:00.000Z", "syncState": "prepared" }
owner vault receives, verifies the renter's consent, checks [2026-12-05T07:00Z, 2026-12-07T11:00Z) with buffers 2 h and the bound terms, then confirms -> status confirmed
renter sees confirmed only after the owner's signed confirmation and consent are held locally
at handoff the owner vault opens the rent Deal { "contextRef": { "type": "rental_reservation", "id": "0192f500-0002-…" }, "contextCid": "sha256-Rq…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T08 | integration | PS-039-04.R02, PS-039-06.R01, PS-039-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on confirmed with identical cids; duplicates skipped |
| TEST-PS-039-09.T09 | contract | PS-039-04.R01, PS-039-04.R03, PS-039-04.R05 | each command, statement and event; publication with federation_publish consent denied for one relay; offering with a 6-character pickupAreaCell | payloads and signatures validate against registry schemas and signer roles; publish refused with RENTALS_PUBLISH_CONSENT_REQUIRED and DISCOVERY_PRECISION_FORBIDDEN respectively; nothing uploaded |
| TEST-PS-039-09.T11 | integration | PS-039-04.R03, PS-039-03.R01, PS-039-03.R06 | handoff, overdue, return and closed events delivered twice and out of order, and rentals.rental.closed with reason not_returned for an overdue reservation | reservation follows the machine; early return frees tail after buffer; overdue extends blocking; the not_returned closure ends the occupied interval at closedAt |
| TEST-PS-039-09.T16 | e2e | PS-039-01.R01, PS-039-04.R01 | mobile renter requests, owner confirms in second browser | both show confirmed; busy blocks update; axe zero serious issues |
| TEST-PS-039-09.T26 | integration | PS-039-04.R04 | handoff attested; a forked device opened a rent Deal before a frozen reservation is cancelled; renter cancels inside the fee period | owner vault opens one rent Deal {rental_reservation, reservationId} with contextCid requestCid, purpose rent and expiry covering endsAt, and the renter vault's ContextTermsPort.verify accepts it; commerce.deal.cancel produced and 'cancellation pending counterparty' shown until both sign; the owner vault opens one fee Deal {rental_cancellation_fee, reservationId} of the policy fee with contextCid the renter's cancellation cid |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
