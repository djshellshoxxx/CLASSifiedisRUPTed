# PS-105-09 — Contract and acceptance tests: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-105-09.R02** DST behavior is verified against a reference implementation and golden fixtures for concrete 2026 transitions.
- **PS-105-09.R03** Property tests prove isQuiet and nextQuietEnd agree for all instants.

## Specification

See the module test table below (all processes).

**Fixtures:** Golden transitions America/New_York 2026-03-08 and 2026-11-01, Europe/London 2026-03-29 and 2026-10-25, Australia/Lord_Howe 2026-04-05 and 2026-10-04, Asia/Kolkata (no DST), Pacific/Auckland 2026-04-05 and 2026-09-27, pinned tzdata 2026b.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T01 | unit | PS-105-01.R01, PS-105-01.R02, PS-105-01.R03, PS-105-02.R01 | save a valid New York schedule 22:00 to 07:00 daily | stored with tzdataVersion and mirrorSeq 0; mirror statement contains only timeZone, windows, enabled, seq |
| TEST-PS-105-09.T02 | unit | PS-105-02.R02, PS-105-02.R03 | each rule V01 to V07 violated in turn including Mars/Olympus, 24-hour window and overlapping windows | documented error code returned and nothing stored |
| TEST-PS-105-09.T03 | unit | PS-105-01.R03, PS-105-02.R02 | evaluate New York on 2026-03-08 across the gap | window covers 8 real hours: quiet from 03:00 UTC to 11:00 UTC on 2026-03-08 inclusive of the start and exclusive of the end |
| TEST-PS-105-09.T04 | unit | PS-105-01.R03 | evaluate New York on 2026-11-01 across the repeated hour | window covers 10 real hours from 02:00 UTC to 12:00 UTC; both 01:30 occurrences are quiet |
| TEST-PS-105-09.T05 | unit | PS-105-01.R03, PS-105-02.R02 | window starting 02:30 on 2026-03-08 New York, and Lord_Howe, London and Auckland transitions | start shifts forward by the gap, empty window yields not quiet, 30-minute shifts handled, results equal reference implementation |
| TEST-PS-105-09.T06 | property | PS-105-02.R02, PS-105-03.R01 | random instants 2020 to 2100 for 12 zones and random valid schedules | isQuiet equals reference; quietEndsAt is the first instant where isQuiet is false; never throws |
| TEST-PS-105-09.T07 | contract | PS-105-04.R01, PS-105-04.R02, PS-105-09.R02 | set, mirror, get, evaluate execute | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-105-09.T08 | integration | PS-105-04.R03, PS-105-03.R02 | channel opted in and opted out events delivered | schedule mirrored to the consenting relay and deletion requested when consent ends |
| TEST-PS-105-09.T09 | abuse | PS-105-05.R01, PS-105-05.R02, PS-105-05.R03 | forged mirror; mirror without consent; another user edit | rejected in each case |
| TEST-PS-105-09.T10 | integration | PS-105-06.R01, PS-105-06.R02, PS-105-06.R03, PS-105-03.R03 | replay seq 3 after seq 5; relay down during save | stale ignored; local evaluation unaffected; sync states advance prepared to transport acknowledged to peer accepted |
| TEST-PS-105-09.T11 | abuse | PS-105-07.R01, PS-105-07.R02, PS-105-07.R03 | inspect mirror payload, relay logs and notification payloads | no location, no content, schedule absent from payloads; 31st change in a day returns RATE_LIMITED |
| TEST-PS-105-09.T12 | load | PS-105-08.R01, PS-105-08.R02, PS-105-08.R03 | 100 000 evaluations and 50 mirror calls per second for 2 minutes | budgets met |
| TEST-PS-105-09.T13 | unit | PS-105-09.R01, PS-105-09.R03 | traceability tool run | every PS-105 requirement maps to a passing test |
| TEST-PS-105-09.T14 | integration | PS-105-10.R01, PS-105-10.R02, PS-105-10.R03 | export, import into fresh vault, restore relay from backup, and import with newer tzdata | schedule round trips; unknown time zone rejected with the user prompted |
| TEST-PS-105-09.T15 | a11y | PS-105-04.R01 | settings screen with screen reader and keyboard | inputs labelled, currently quiet announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- Golden DST fixtures for the six listed transitions produce the documented durations in the vault and on the relay with identical results.
- No notification payload or event contains the schedule.

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
