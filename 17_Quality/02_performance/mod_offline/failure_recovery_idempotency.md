# PS-140-06 — Failure recovery and idempotency: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-06.R01** Replay uses backoff 1 s doubling to 60 s with jitter of plus or minus 20 percent; tests assert the schedule with a fake clock.
- **PS-140-06.R02** Replay is idempotent by construction (same Idempotency-Key); the test replays 1, 3 and 10 times with identical results.
- **PS-140-06.R03** A command that fails with a non-retryable error is not retried and is surfaced to the user.

## Specification

- **idempotency:** The suite proves replay idempotency by sending each queued command up to 10 times across resets and asserting a single server-side effect.
- **concurrency:** Two devices edit the same entity offline; the second replay receives CONFLICT_REVISION and the prompt appears; both orders are tested.
- **retries:** Tests use the fake clock to advance backoff instead of waiting; real-time sleeps over 50 ms are forbidden.
- **offline:** This module is about offline: the network is toggled by the fake network or Playwright setOffline.
- **partial failure:** If replay stops midway (page reload), the outbox resumes from persisted state; the test verifies no lost and no duplicated commands.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | replay one command across 10 connection resets | server-side effect count is exactly 1 |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance fake clock 8 days with a queued command | command marked stale and not sent; non-retryable error is not retried |
| TEST-PS-140-09.T09 | unit | PS-140-06.R01 | fake clock backoff schedule over 10 failures | delays 1,2,4,8,16,32,60,60,60,60 s with jitter within 20 percent |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
