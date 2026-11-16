# PS-098-09 — Contract and acceptance tests: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-098-09.R02** Tier tables and multiplier math are covered by deterministic and property tests.
- **PS-098-09.R03** Authorization and non-disclosure are covered by abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, keys A (first seen 2 days ago, 0 deals), B (40 days, 5 deals), C (120 days, 12 deals), moderators M1, M2, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R03, PS-098-02.R01 | tier table for A, B, C on all five limit keys | A new (5, 10, 3, 20, 20), B established (20, 50, 10, 100, 60), C trusted (100, 200, 25, 500, 200) |
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers and overrides | effective value follows the documented formula; never below 1 unless base is 0 or override sets 0 |
| TEST-PS-098-09.T03 | unit | PS-098-02.R01, PS-098-02.R02, PS-098-02.R03 | override with value 10001, short reason, expiry 91 days, self override | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-098-09.T04 | integration | PS-098-03.R01, PS-098-03.R03, PS-098-04.R03 | deal.completed events and 7-day sweep; override expiry | tier promoted once both conditions hold; limit.changed emitted on expiry |
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium then high then recovery | effective value 0.75×, 0.5×, then base; one event per distinct value |
| TEST-PS-098-09.T06 | contract | PS-098-04.R01, PS-098-04.R02, PS-098-09.R02 | commands, queries and event | validate against registry schemas; check output matches examples |
| TEST-PS-098-09.T07 | integration | PS-098-02.R03, PS-098-06.R02 | 6th listing in a day for tier new; stock limit with currentCount 10 of 10 | ACCOUNT_LIMIT_REACHED with resetsAt for flow; without for stock |
| TEST-PS-098-09.T08 | abuse | PS-098-05.R01, PS-098-05.R02, PS-098-05.R03 | member overrides own limit; member checks another's limit over HTTP; moderator overrides own key | FORBIDDEN, no route, FORBIDDEN |
| TEST-PS-098-09.T09 | integration | PS-098-06.R01, PS-098-06.R03 | same Idempotency-Key replayed; rate store down for flow limit | original response replayed; fail mode of class applies |
| TEST-PS-098-09.T10 | abuse | PS-098-07.R01, PS-098-07.R03 | 31 overrides by one moderator in a day | 31st RATE_LIMITED; weekly report lists all |
| TEST-PS-098-09.T11 | integration | PS-098-07.R02 | membership deletion | rows deleted after 30 days; audit history kept 1 year |
| TEST-PS-098-09.T12 | load | PS-098-08.R01, PS-098-08.R02, PS-098-08.R03 | 2 000 checks per second for 5 minutes; sweep 100 000 keys | p95 ≤ 5 ms; sweep ≤ 60 s |
| TEST-PS-098-09.T13 | unit | PS-098-09.R01, PS-098-09.R03 | traceability tool run | every PS-098 requirement maps to a passing test |
| TEST-PS-098-09.T14 | integration | PS-098-10.R01, PS-098-10.R02, PS-098-10.R03 | export own limits, relay backup and restore | limits recomputed after restore; firstSeen set to restore time when absent |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily listing limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- [object Object]
- Effective values follow the published tier table and multipliers exactly.

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
