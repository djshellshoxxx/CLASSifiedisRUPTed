# PS-105-02 — Validation rules: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-02.R01** Schedules are validated for time zone, window shapes, overlap and size before they are stored or mirrored.
- **PS-105-02.R02** Evaluation inputs are validated so isQuiet is total and never throws for any instant in the supported range 2020 to 2100.
- **PS-105-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | timeZone is present in the pinned IANA tzdata list | NOTIFY_QUIET_TZ_UNKNOWN |
| V02 | windows has at most 4 entries, days are unique values 1 to 7, start and end match HH:mm 00:00 to 23:59 | VALIDATION_FAILED |
| V03 | each window length is between 15 minutes and 12 hours and start is not equal to end | NOTIFY_QUIET_WINDOW_INVALID |
| V04 | windows do not overlap and the daily union is less than 24 hours | NOTIFY_QUIET_WINDOW_INVALID |
| V05 | mirror statement signature verifies, seq is greater than the stored seq and the relay holds a granted channel consent for the user | PRECONDITION_FAILED |
| V06 | a user changes the schedule at most 30 times per day | RATE_LIMITED |
| V07 | expectedRevision equals the stored revision | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T01 | unit | PS-105-01.R01, PS-105-01.R02, PS-105-01.R03, PS-105-02.R01 | save a valid New York schedule 22:00 to 07:00 daily | stored with tzdataVersion and mirrorSeq 0; mirror statement contains only timeZone, windows, enabled, seq |
| TEST-PS-105-09.T02 | unit | PS-105-02.R02, PS-105-02.R03 | each rule V01 to V07 violated in turn including Mars/Olympus, 24-hour window and overlapping windows | documented error code returned and nothing stored |
| TEST-PS-105-09.T03 | unit | PS-105-01.R03, PS-105-02.R02 | evaluate New York on 2026-03-08 across the gap | window covers 8 real hours: quiet from 03:00 UTC to 11:00 UTC on 2026-03-08 inclusive of the start and exclusive of the end |
| TEST-PS-105-09.T05 | unit | PS-105-01.R03, PS-105-02.R02 | window starting 02:30 on 2026-03-08 New York, and Lord_Howe, London and Auckland transitions | start shifts forward by the gap, empty window yields not quiet, 30-minute shifts handled, results equal reference implementation |
| TEST-PS-105-09.T06 | property | PS-105-02.R02, PS-105-03.R01 | random instants 2020 to 2100 for 12 zones and random valid schedules | isQuiet equals reference; quietEndsAt is the first instant where isQuiet is false; never throws |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
