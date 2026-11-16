# PS-092-09 — Contract and acceptance tests: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-092-09.R02** Contract tests check commands, statements and events against the schema registry.
- **PS-092-09.R03** Reviewer independence and window arithmetic are covered by deterministic tests with an injected clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X with moderators M1 (decider, key K1) and M2 (key K2), member A with action on listing L issued 2026-11-04T10:00:00Z, fixed clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T01 | unit | PS-092-01.R01, PS-092-01.R03, PS-092-02.R01 | file a valid appeal | Appeal stored with deadlineAt = reasonsIssuedAt + 30 days and status filed |
| TEST-PS-092-09.T02 | unit | PS-092-02.R02, PS-092-02.R03 | window day 30 and day 31; duplicate; same reviewer; short reasons | accepted on day 30; documented error codes otherwise |
| TEST-PS-092-09.T03 | property | PS-092-03.R01, PS-092-03.R02 | random sequences of assign, decide, withdraw | only declared transitions succeed and reviewer never equals decider |
| TEST-PS-092-09.T04 | integration | PS-092-03.R02, PS-092-03.R03 | relay with a single moderator; second moderator added | awaiting_reviewer then in_review; decision overturn emits moderation.appeal.decided |
| TEST-PS-092-09.T05 | contract | PS-092-04.R01, PS-092-04.R02, PS-092-09.R02 | each command, statement and event | validate against registry schemas; decision statement signature verifies |
| TEST-PS-092-09.T06 | integration | PS-092-04.R03 | action.applied then action.reverted before appeal decision | deadline stored; appeal closed as moot with outcome overturned |
| TEST-PS-092-09.T07 | abuse | PS-092-05.R01, PS-092-05.R02, PS-092-05.R03 | stranger files; decider decides; appellant queries reviewer identity | FORBIDDEN, MODERATION_APPEAL_REVIEWER_CONFLICT, reviewer key absent |
| TEST-PS-092-09.T08 | abuse | PS-092-07.R01, PS-092-07.R03 | forged decision signature; 6th appeal in a day | decision quarantined, vault never shows decided; 6th returns RATE_LIMITED |
| TEST-PS-092-09.T09 | integration | PS-092-06.R01, PS-092-06.R02 | same Idempotency-Key replayed; concurrent assign and withdraw | original receipt replayed; consistent final state by revision |
| TEST-PS-092-09.T10 | chaos | PS-092-06.R03, PS-092-03.R03 | receipt lost then retried; decision statement undelivered | stored receipt replayed; vault fetches decision; sync state advances honestly |
| TEST-PS-092-09.T11 | integration | PS-092-07.R02 | appellant deletes vault copy | relay copy retained for RET-EVIDENCE; UI states relay copy remains |
| TEST-PS-092-09.T12 | load | PS-092-08.R01, PS-092-08.R02, PS-092-08.R03 | 50 req/s mixed receive and decide for 5 minutes; assign 1 000 appeals | p95 ≤ 300 ms, assignment ≤ 5 s, metrics exported |
| TEST-PS-092-09.T13 | unit | PS-092-09.R01, PS-092-09.R03 | traceability tool run | every PS-092 requirement maps to a passing test |
| TEST-PS-092-09.T14 | integration | PS-092-10.R01, PS-092-10.R02, PS-092-10.R03 | export appeal packet, import into fresh vault, restore relay backup | signed decision verifies after round trip; imported pending appeals are not re-sent |
| TEST-PS-092-09.T15 | e2e | PS-092-01.R02, PS-092-04.R01 | mobile appellant files offline and reconnects | appeal reaches the relay, timeline shows honest states, axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No appeal is ever decided by the moderator who made the original decision (property and abuse tests).
- The 30-day window is always computed from the relay-signed statement time.

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
