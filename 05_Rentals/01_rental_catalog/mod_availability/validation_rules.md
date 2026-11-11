# PS-039-02 — Validation rules: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-02.R01** Inbound statements are validated in a fixed order - schema, signature, signer role, offering state, terms binding, interval, capacity - and the first failure decides the error.
- **PS-039-02.R02** Interval checks use UTC half-open intervals [occupiedFrom, occupiedUntil) and count units against quantity, including frozen units.
- **PS-039-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.
- **PS-039-02.R04** Request expiry, confirmations and cancellations are judged against the signed absolute expiresAt and each statement's signed createdAt with a 72 hour receipt bound, never against one vault's receipt time alone.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the renter for requests and the offering owner for confirmations, declines and frozen notices | RENTALS_STATEMENT_INVALID |
| V02 | offering is active and the owner key matches | RENTALS_OFFERING_UNAVAILABLE |
| V03 | startsAt is at least leadTimeMinutes from now, within horizonDays, endsAt gives a duration within minimum and maximum, and expiresAt equals min(createdAt + 48 h, startsAt − leadTimeMinutes) | VALIDATION_FAILED |
| V04 | interval does not fall on a blackout date in the offering time zone | RENTALS_BLACKOUT |
| V05 | for every instant in [occupiedFrom, occupiedUntil) the overlapping confirmed, handoff_pending, in_use, overdue and frozen units plus the requested units are at most quantity (requested but unconfirmed reservations never block others) | RENTALS_INTERVAL_CONFLICT |
| V06 | rate unit exists on the offering and rent equals the computed amount | VALIDATION_FAILED |
| V07 | renter has fewer than 5 open requests and fewer than 2 per offering; lapsed, declined and cancelled requests do not count | RENTALS_REQUEST_LIMIT |
| V08 | for a new request neither party has blocked the other (F07.S02.M02 isBlockedEither); a local request returns the code, an inbound request from a blocked DID is dropped silently with no reply and no statement | BLOCKED_PARTY |
| V09 | rate, late-fee and declared-value amounts are positive and the cancellation fee is non-negative, all integer strings in one registered currency | VALIDATION_FAILED |
| V10 | a cancellation is signed by the renter or owner of the reservation; reason renter only from the renter; owner, declined, conflict and offering_unavailable only from the owner; a post-confirmation owner cancellation names the confirmationCid, and one that does not is handled as owner equivocation (frozen) rather than refused; locally derived reasons expired and no_handoff never cancel on receipt and are applied only by the receiver's own evaluation of the same signed deadline | RENTALS_STATEMENT_INVALID |
| V11 | at confirmation the current offering revision, rates, lateFee, cancellationPolicy and declaredValue equal the terms bound in the signed request | RENTALS_TERMS_CHANGED |
| V12 | the owner confirms only while its clock is not after expiresAt and startsAt − leadTime has not passed; an inbound confirmation has createdAt ≤ expiresAt and is received within 72 h of createdAt | EXPIRED |
| V13 | before an offering projection or busy summary is uploaded, privacy.consent.check {purpose federation_publish, relayId} returns granted for every target relay | RENTALS_PUBLISH_CONSENT_REQUIRED |
| V14 | pickupAreaCell passes F06.S02.M01 assertPublicCell (geohash length 4 or 5) and the projection holds only allowlisted fields | DISCOVERY_PRECISION_FORBIDDEN |
| V15 | the renter's request consent and, for confirmations, the owner's confirm consent verify as valid through comms.consent.verify over the request terms hash; conflicted or revoked freezes the reservation, missing quarantines the statement | RENTALS_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T01 | unit | PS-039-01.R01, PS-039-01.R03, PS-039-02.R03 | compute rent for 25 h on day unit, 90 min on hour unit, and JPY and BHD currencies | ceiling units, integer minor units, no rounding of minor units |
| TEST-PS-039-09.T02 | unit | PS-039-02.R03 | each rule V01–V15 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-039-09.T03 | property | PS-039-02.R02, PS-039-01.R02, PS-039-09.R02 | random reservations, including frozen ones, for quantities 1 to 20 against brute-force reference | accept/refuse decisions identical; never more than quantity units at any minute outside detected fork excess |
| TEST-PS-039-09.T04 | unit | PS-039-02.R02, PS-039-03.R01 | boundary cases - touching intervals with zero buffers, one minute inside the buffer, DST change inside the rental | half-open rule respected; elapsed-time durations; blackout by local date |
| TEST-PS-039-09.T17 | unit | PS-039-02.R01 | inbound confirmation with a bad signature and a stale state; inbound request with a wrong signer and an interval that conflicts | the signature code RENTALS_STATEMENT_INVALID is returned for the first and the signer code RENTALS_STATEMENT_INVALID for the second; the later failures are never reported |
| TEST-PS-039-09.T19 | integration | PS-039-01.R02, PS-039-02.R04 | owner raises the late fee between request and confirmation, then the renter re-requests with the new terms | first confirm returns RENTALS_TERMS_CHANGED; the confirmed reservation's lateFeeTerms, cancellationPolicy and declaredValue equal the signed request |
| TEST-PS-039-09.T20 | integration | PS-039-03.R04, PS-039-02.R04 | request unanswered; confirm attempted after expiresAt and after startsAt − leadTime; confirmation signed before expiresAt delivered to the renter at expiresAt plus 30 h | owner vault declines with a signed expired notice at expiresAt; owner confirm returns EXPIRED; renter vault lapses at expiresAt plus 24 h, stops retrying and frees the V07 slot; a second request whose startsAt − leadTime falls 6 h after expiresAt lapses at that instant; the late confirmation is held frozen until the renter accepts it through renegotiate |
| TEST-PS-039-09.T23 | abuse | PS-039-05.R02, PS-039-02.R03 | renter-signed cancellation with reason declined; inbound cancellation with reason no_handoff while the receiving vault's handoff holds a signed report | first quarantined with RENTALS_STATEMENT_INVALID; second stored as a notice and not applied; reservation stays handoff_pending |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
