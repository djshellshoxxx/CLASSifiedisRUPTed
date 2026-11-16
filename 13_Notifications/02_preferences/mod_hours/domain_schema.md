# PS-105-01 — Domain schema: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-01.R01** A QuietHoursSchedule stores the user DID, an IANA time zone, an enabled flag, up to 4 windows each with days of week 1 to 7 and local start and end as HH:mm, the tzdata version used, and a mirror sequence, with tenant and revision per CTR-ID-001.
- **PS-105-01.R02** The schedule is P2, held in the vault and mirrored to relays only as time zone plus windows plus sequence; it contains no location and no content, but a time zone reveals a coarse region, which the UI states.
- **PS-105-01.R03** Evaluation is a pure function of the instant, the schedule and the pinned tzdata; local wall-clock windows are mapped to instants with the rules in the invariants.

## Specification

### QuietHoursSchedule

Schema `classrup.notify.quiet_hours/v1` · storage **relay+device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — owner |
| enabled | boolean — false means never quiet |
| timeZone | string — IANA identifier present in the pinned tzdata, for example Europe/Berlin |
| windows | array — 0..4 items { days: int[1..7] (ISO, 1 Monday), start: HH:mm, end: HH:mm } |
| tzdataVersion | string — IANA tzdata release used when the schedule was saved, for example 2026b |
| mirrorSeq | int — sequence of the last mirror statement sent |
| updatedAtClaim | timestamp — user clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A window whose end is not later than its start crosses midnight and belongs to the day of its start; its length is at least 15 minutes and at most 12 hours.
- A local start time that does not exist (spring-forward gap) moves forward by the gap length; a local time that occurs twice is interpreted as the earlier occurrence for a start and the later occurrence for an end, so the whole repeated hour lies inside a window that spans it.
- Windows of one schedule must not overlap in real time on any day and the union of windows must be shorter than 24 hours per day.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T01 | unit | PS-105-01.R01, PS-105-01.R02, PS-105-01.R03, PS-105-02.R01 | save a valid New York schedule 22:00 to 07:00 daily | stored with tzdataVersion and mirrorSeq 0; mirror statement contains only timeZone, windows, enabled, seq |
| TEST-PS-105-09.T03 | unit | PS-105-01.R03, PS-105-02.R02 | evaluate New York on 2026-03-08 across the gap | window covers 8 real hours: quiet from 03:00 UTC to 11:00 UTC on 2026-03-08 inclusive of the start and exclusive of the end |
| TEST-PS-105-09.T04 | unit | PS-105-01.R03 | evaluate New York on 2026-11-01 across the repeated hour | window covers 10 real hours from 02:00 UTC to 12:00 UTC; both 01:30 occurrences are quiet |
| TEST-PS-105-09.T05 | unit | PS-105-01.R03, PS-105-02.R02 | window starting 02:30 on 2026-03-08 New York, and Lord_Howe, London and Auckland transitions | start shifts forward by the gap, empty window yields not quiet, 30-minute shifts handled, results equal reference implementation |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
