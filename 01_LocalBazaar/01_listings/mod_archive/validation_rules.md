# PS-001-02 — Validation rules: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-02.R01** Each command validates the listing status, the owner and the 90-day restore window before any change.
- **PS-001-02.R02** Close requires a reason and never silently releases inventory holds: the hold of the Deal named in closedWithRef is converted, other Deal-linked holds are released only together with commerce.deal.cancel and a signed reservation release, and cycle holds are never released here.
- **PS-001-02.R03** Every violation maps to a stable error code.
- **PS-001-02.R04** The expiry sweep applies the same clock sanity rule as F01.S01.M03: it compares with the median of the latest receipts from at least 2 distinct relays, ignores receipts more than 24 h ahead of that median, and with fewer than 2 relays uses the device clock with a warning.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | listing exists, owned by local principal, and status allows the requested action (see machine) | CONFLICT_STATE |
| V02 | close has closeReason in sold, given, traded, fulfilled, other (sold_out is system only) | VALIDATION_FAILED |
| V03 | closedWithRef, if present, has a valid type and uuidv7 id | VALIDATION_FAILED |
| V04 | active holds on the listing: with closedWithRef.type deal the hold whose linkedDealId equals closedWithRef.id is converted; any other hold with a linkedDealId of an open Deal is refused unless cancelDeals is true (then commerce.deal.cancel runs and a signed classrup.bazaar.reservation_release/v1 is queued to its reservation audience); holds without a Deal are released only with releaseHolds true; holderType cycle is always refused | BAZAAR_ARCHIVE_HOLD_ACTIVE |
| V05 | restore requested now <= restoreUntil | BAZAAR_ARCHIVE_RESTORE_EXPIRED |
| V06 | expectedRevision matches ArchiveRecord or Listing revision | CONFLICT_REVISION |
| V07 | kind giveaway closes only with reason given or other; kind wanted only fulfilled or other | VALIDATION_FAILED |
| V08 | expiry sweep: now >= expiresAt by the device clock and the device clock is not more than 24 h behind the median of the latest receipts of at least 2 distinct relays in the last 7 days (receipts more than 24 h ahead of the median are discarded) | PRECONDITION_FAILED |
| V09 | expiry sweep: no active hold with linkedDealId or holderType cycle on the listing, otherwise renew within the F01.S01.M03 cap or defer (also when F01.S01.M03 refuses the renewal because the publication is in policy_attention) | BAZAAR_ARCHIVE_HOLD_ACTIVE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T01 | unit | PS-001-01.R01, PS-001-01.R02, PS-001-02.R01 | close A with reason sold and a deal ref | ArchiveRecord closed, closedWithRef.verified false, Listing closed |
| TEST-PS-001-09.T03 | unit | PS-001-02.R03 | violate each rule V01-V09 | documented error code returned and nothing changes |
| TEST-PS-001-09.T10 | chaos | PS-001-06.R03, PS-001-02.R03 | signing key locked during close; later tombstone transport fails | close refused atomically; later local close stands and transport retries |
| TEST-PS-001-09.T16 | integration | PS-001-02.R02 | close B with closedWithRef D1; close B with a ref to another Deal; then with cancelDeals true | first converts the D1 hold; second BAZAAR_ARCHIVE_HOLD_ACTIVE; third calls commerce.deal.cancel and queues a signed reservation release to the buyer |
| TEST-PS-001-09.T18 | abuse | PS-001-02.R04 | R3 returns receipts 3 days ahead while R1 and R2 agree; then only R3 remains | R3 ignored and the sweep expires on time; with R3 alone the device clock is used and a warning is recorded |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
