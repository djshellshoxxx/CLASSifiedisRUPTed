# PS-140-09 — Contract and acceptance tests: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-140-09.R02** Planted bugs (replay with a new key, authenticated response cached) must fail the suite.
- **PS-140-09.R03** The suite runs on every pull request touching apps/pwa.

## Specification

See the module test table below (all processes).

**Fixtures:** FakeNetwork scenario files, FakeClock 2026-11-04T10:00:00Z, in-memory IndexedDB shim, Pixel 7 profile for browser tests, relay test double that counts effects per Idempotency-Key.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T01 | unit | PS-140-01.R01, PS-140-01.R02, PS-140-01.R03 | enqueue through production function with a scenario file | entry matches the OutboxEntry schema; scenario parses |
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | replay one command across 10 connection resets | server-side effect count is exactly 1 |
| TEST-PS-140-09.T03 | integration | PS-140-02.R02, PS-140-03.R01 | two devices edit the same entity offline then reconnect | second gets CONFLICT_REVISION and the three-action prompt appears; no overwrite |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance fake clock 8 days with a queued command | command marked stale and not sent; non-retryable error is not retried |
| TEST-PS-140-09.T05 | integration | PS-140-03.R02, PS-140-03.R03 | walk local committed, prepared, transport_acknowledged, peer_accepted, quarantined and stale states with both harnesses | every state reached and outbox ends empty or in expected terminal state |
| TEST-PS-140-09.T06 | unit | PS-140-04.R01, PS-140-04.R02, PS-140-04.R03 | run the scripts and read exit codes | fake-network suite under 30 s; browser variant runs scenario list; exit codes as documented |
| TEST-PS-140-09.T07 | e2e | PS-140-05.R01, PS-140-05.R03 | revoke signing key while offline then reconnect | receiver quarantines the statement; sender sees quarantined with reason |
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | logout then inspect IndexedDB and caches | all empty for the previous account |
| TEST-PS-140-09.T09 | unit | PS-140-06.R01 | fake clock backoff schedule over 10 failures | delays 1,2,4,8,16,32,60,60,60,60 s with jitter within 20 percent |
| TEST-PS-140-09.T10 | e2e | PS-140-07.R01, PS-140-09.R02 | plant an authenticated response in cache | QUALITY_OFFLINE_AUTH_CACHED and suite fails |
| TEST-PS-140-09.T11 | abuse | PS-140-07.R03, PS-140-09.R02 | fill storage to 95 percent and enqueue; plant replay with a new key | visible quota error; the new-key bug fails with QUALITY_OFFLINE_DUPLICATE_EFFECT |
| TEST-PS-140-09.T12 | e2e | PS-140-08.R01, PS-140-08.R02, PS-140-08.R03 | reconnect on Pixel 7 4G profile and load shell offline | first replay within 2 s, shell within 2.5 s, browser suite within 3 min |
| TEST-PS-140-09.T13 | integration | PS-140-09.R01, PS-140-09.R03 | traceability tool run and check CI path filter | every requirement maps to a passing test; suite runs on apps/pwa changes |
| TEST-PS-140-09.T14 | integration | PS-140-10.R01, PS-140-10.R02, PS-140-10.R03 | export report and reuse scenario files in e2e | reports contain no user data; scenarios load in both harnesses |
| TEST-PS-140-09.T15 | e2e | PS-140-03.R01 | reload the page during replay | outbox resumes, no lost and no duplicate commands |
| TEST-PS-140-09.T16 | e2e | PS-140-01.R04 | no relay configured, network blocked: create and search records, sign a statement | works; status local committed |
| TEST-PS-140-09.T17 | e2e | PS-140-02.R04 | drive a statement through each sync state | UI label matches the state; delivered shown only at peer_accepted; plant an overclaim bug and see QUALITY_OFFLINE_OVERCLAIM |

## Acceptance criteria

- A command created offline is applied exactly once after reconnect, even across repeated connection resets.
- A stale revision conflict always shows the keep mine, take theirs and merge prompt and never overwrites silently.
- Authenticated API responses are never present in Cache Storage and caches are empty after logout.
- The app shell loads offline after first visit within the OBS-5 budget.

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
