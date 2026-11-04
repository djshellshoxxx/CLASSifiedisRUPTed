# PS-028-02 — Validation rules: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-02.R01** Calendar input is validated strictly; zone names are checked against the bundled tz database, not against the device locale.
- **PS-028-02.R02** Slot holds are validated for overlap including buffers, horizon, notice and exceptions before they are stored.
- **PS-028-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | timeZone is a canonical IANA name present in the bundled tz database | SERVICES_TZ_UNKNOWN |
| V02 | weeklyRules windows are valid HH:mm, startLocal < endLocal, no overlap on a weekday, length multiple of slotMinutes | VALIDATION_FAILED |
| V03 | buffers within 0..120, notice within 0..20160, horizon within 1..180 | VALIDATION_FAILED |
| V04 | requested slot start is a generated slot at least minNoticeMinutes from now and within horizonDays | SERVICES_SLOT_UNAVAILABLE |
| V05 | requested interval plus buffers overlaps no held or committed interval | SERVICES_SLOT_UNAVAILABLE |
| V06 | a client holds at most 3 active holds and a calendar has at most 50 active holds | SERVICES_HOLD_LIMIT |
| V07 | exceptions has at most 200 items and each localDate is within the horizon plus 30 days | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T02 | unit | PS-028-02.R01, PS-028-02.R02, PS-028-02.R03 | each rule V01–V07 violated | documented code returned and nothing stored |
| TEST-PS-028-09.T03 | property | PS-028-01.R01, PS-028-02.R02, PS-028-03.R02, PS-028-09.R02 | random rules in every zone for 2026-2028 | derived slots are unique, ordered, non-overlapping, and no slot falls in a DST gap |
| TEST-PS-028-09.T06 | integration | PS-028-02.R03, PS-028-06.R02 | two tabs hold overlapping slots simultaneously | exactly one succeeds, other SERVICES_SLOT_UNAVAILABLE |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
