# PS-108-09 — Contract and acceptance tests: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-108-09.R02** Contract tests check commands and event payloads against the schema registry.
- **PS-108-09.R03** DST and urgent bypass behaviors are covered with golden fixtures that reuse the F13.S02.M02 schedule fixtures.

## Specification

See the module test table below (all processes).

**Fixtures:** User U in America/New_York with quiet window 22:00 to 07:00 daily, push and email consent granted, matrix defaults, relay R with fake push and email senders, fixed clocks per test, golden transitions 2026-03-08 and 2026-11-01.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | dispatch normal offers alert at 03:00 local | deferred record with only templateKey, ref and timing; no text fields; release at 07:00 plus jitter |
| TEST-PS-108-09.T02 | unit | PS-108-02.R02, PS-108-02.R03 | each rule V01 to V07 violated in turn | documented error code returned and nothing sent |
| TEST-PS-108-09.T03 | property | PS-108-03.R01, PS-108-03.R02, PS-108-03.R03 | random sequences of dispatch, schedule changes, consent changes, reads and clock jumps | terminal states never change; no send without consent; nothing deferred beyond 24 h; urgent never deferred |
| TEST-PS-108-09.T04 | integration | PS-108-03.R02 | night of 2026-03-08 and 2026-11-01 New York | release at 07:00 local on both, i.e. 11:00 UTC and 12:00 UTC, plus jitter ≤ 300 s |
| TEST-PS-108-09.T05 | contract | PS-108-04.R01, PS-108-04.R02, PS-108-09.R02 | dispatch, release, list_deferred execute | outputs and event payloads validate against registry schemas |
| TEST-PS-108-09.T06 | integration | PS-108-04.R03 | quiet_hours.changed, channel.opted_out, preference.changed and notification.read events delivered | deferred items recomputed, dropped or cancelled with documented reasons |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent | first sent immediately; second treated as normal and deferred; third not sent |
| TEST-PS-108-09.T08 | abuse | PS-108-05.R01, PS-108-05.R02, PS-108-05.R03 | dispatch by a stranger for another user; replay of a hook call; operator reads deferred records | FORBIDDEN or NOT_FOUND; one send; records content-free |
| TEST-PS-108-09.T09 | integration | PS-108-06.R01, PS-108-06.R02 | same dispatch retried 5 times; crash after send before status update | one send, or one repeated send collapsed by Topic and Message-ID |
| TEST-PS-108-09.T10 | chaos | PS-108-06.R03 | preference store unavailable during gate | fail closed: deferred 5 minutes then dropped after 3 attempts; inbox entry unaffected |
| TEST-PS-108-09.T11 | abuse | PS-108-07.R01, PS-108-07.R02, PS-108-07.R03 | 121st dispatch in an hour; inspect deferred records and logs | RATE_LIMITED; no content or schedule in records |
| TEST-PS-108-09.T12 | load | PS-108-08.R01, PS-108-08.R02, PS-108-08.R03 | 2 000 users with deferred items released at one window end; 100 dispatch per second | decision p95 ≤ 20 ms, release lag ≤ 600 s, jitter uniform |
| TEST-PS-108-09.T13 | unit | PS-108-09.R01, PS-108-09.R03 | traceability tool run | every PS-108 requirement maps to a passing test |
| TEST-PS-108-09.T14 | integration | PS-108-10.R01, PS-108-10.R02, PS-108-10.R03 | export deferred counts, restore relay from backup | deferred records past expiry are dropped on restore and none are sent twice |

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- No send occurs on any path without a granted unexpired channel consent.
- Urgent bypass works only for category security and is visible in metrics.
- Released times match the golden DST fixtures to within the 300 s jitter.

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
