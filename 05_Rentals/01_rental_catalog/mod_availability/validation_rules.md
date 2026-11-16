# PS-039-02 — Validation rules: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-02.R01** Inbound statements are validated in a fixed order - schema, signature, signer role, offering state, interval, capacity - and the first failure decides the error.
- **PS-039-02.R02** Interval checks use UTC half-open intervals [occupiedFrom, occupiedUntil) and count units against quantity.
- **PS-039-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the renter for requests and the offering owner for confirmations | RENTALS_STATEMENT_INVALID |
| V02 | offering is active and the owner key matches | RENTALS_OFFERING_UNAVAILABLE |
| V03 | startsAt is at least leadTimeMinutes from now, within horizonDays, and endsAt gives a duration within minimum and maximum | VALIDATION_FAILED |
| V04 | interval does not fall on a blackout date in the offering time zone | RENTALS_BLACKOUT |
| V05 | for every instant in [occupiedFrom, occupiedUntil) the overlapping confirmed, in_use and overdue units plus the requested units are at most quantity (requested but unconfirmed reservations never block others) | RENTALS_INTERVAL_CONFLICT |
| V06 | rate unit exists on the offering and rent equals the computed amount | VALIDATION_FAILED |
| V07 | renter has fewer than 5 open requests and fewer than 2 per offering | RENTALS_REQUEST_LIMIT |
| V08 | neither party has blocked the other | BLOCKED_PARTY |
| V09 | rate and fee amounts are positive integer strings in one registered currency | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T01 | unit | PS-039-01.R01, PS-039-01.R03, PS-039-02.R03 | compute rent for 25 h on day unit, 90 min on hour unit, and JPY and BHD currencies | ceiling units, integer minor units, no rounding of minor units |
| TEST-PS-039-09.T02 | unit | PS-039-02.R01, PS-039-02.R03 | each rule V01–V09 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-039-09.T03 | property | PS-039-02.R02, PS-039-01.R02 | random reservations for quantities 1 to 20 against brute-force reference | accept/refuse decisions identical; never more than quantity units at any minute |
| TEST-PS-039-09.T04 | unit | PS-039-02.R02, PS-039-03.R01 | boundary cases - touching intervals with zero buffers, one minute inside the buffer, DST change inside the rental | half-open rule respected; elapsed-time durations; blackout by local date |
| TEST-PS-039-09.T16 | e2e | PS-039-01.R01, PS-039-02.R01 | mobile renter requests, owner confirms in second browser | both show confirmed; busy blocks update; axe zero serious issues |

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
