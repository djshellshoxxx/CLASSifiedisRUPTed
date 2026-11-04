# PS-001-02 — Validation rules: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-02.R01** Each command validates the listing status, the owner and the 90-day restore window before any change.
- **PS-001-02.R02** Close requires a reason and refuses silently releasing inventory holds.
- **PS-001-02.R03** Every violation maps to a stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | listing exists, owned by local principal, and status allows the requested action (see machine) | CONFLICT_STATE |
| V02 | close has closeReason in sold, given, traded, fulfilled, other (sold_out is system only) | VALIDATION_FAILED |
| V03 | closedWithRef, if present, has a valid type and uuidv7 id | VALIDATION_FAILED |
| V04 | no active inventory hold on the listing unless releaseHolds is true | BAZAAR_ARCHIVE_HOLD_ACTIVE |
| V05 | restore requested now <= restoreUntil | BAZAAR_ARCHIVE_RESTORE_EXPIRED |
| V06 | expectedRevision matches ArchiveRecord or Listing revision | CONFLICT_REVISION |
| V07 | kind giveaway closes only with reason given or other; kind wanted only fulfilled or other | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T01 | unit | PS-001-01.R01, PS-001-01.R02, PS-001-02.R01, PS-001-02.R02 | close A with reason sold and a deal ref | ArchiveRecord closed, closedWithRef.verified false, Listing closed |
| TEST-PS-001-09.T03 | unit | PS-001-02.R03 | violate each rule V01-V07 | documented error code returned and nothing changes |
| TEST-PS-001-09.T10 | chaos | PS-001-06.R03, PS-001-02.R03 | signing key locked during close; later tombstone transport fails | close refused atomically; later local close stands and transport retries |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
