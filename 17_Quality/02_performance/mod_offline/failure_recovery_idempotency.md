# PS-140-06 — Failure recovery and idempotency: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-06.R01** Retry follows CTR-IDM-001 IDM-4 as F15.S01.M01 specifies it - each delay for attempt n is uniform in [0, min(30 s, 500 ms x 2^(n-1))], retryAfterMs is honoured when larger, after 6 attempts the entry moves to failed with failureReason retry_exhausted, and Retry now resets attempts; tests assert the bounds with a fake clock and a seeded jitter source.
- **PS-140-06.R02** Resend is idempotent by construction (the same cid for statements, the same Idempotency-Key for relay commands); the test resends 1, 3 and 10 times across resets with identical results.
- **PS-140-06.R03** A command that fails with a non-retryable error is not retried and is surfaced to the user.

## Specification

- **idempotency:** The suite proves resend idempotency by sending each queued entry up to 10 times across connection resets and asserting a single effect in the receiving vault (per cid) or relay test double (per Idempotency-Key).
- **concurrency:** Two devices edit the same entity offline; the second replay receives CONFLICT_REVISION and the prompt appears; both orders are tested.
- **retries:** Tests use the fake clock and a seeded jitter source to advance the IDM-4 backoff instead of waiting (base 500 ms, cap 30 s, full jitter, 6 attempts, then failed with retry_exhausted); real-time sleeps over 50 ms are forbidden.
- **offline:** This module is about offline: the network is toggled by the fake network or Playwright setOffline.
- **partial failure:** If replay stops midway (page reload), the outbox resumes from persisted state; the test verifies no lost and no duplicated commands.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | resend one statement and one relay command across 10 connection resets | effect count is exactly 1 in the receiving vault (per cid) and in the relay double (per Idempotency-Key) |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance the fake clock to day 6 and then past 7 days with an unsent entry; separately return a non-retryable error | the day-6 prompt lists the entry with Send now, Keep until expiry and Discard; at 7 days it is expired with payload erased, never sent, and a send attempt gives EXPIRED; the non-retryable error is not retried |
| TEST-PS-140-09.T09 | unit | PS-140-06.R01 | fake clock and seeded jitter over failing attempts, one retryable response carrying retryAfterMs 45 s, then Retry now | each delay for attempt n = 1..6 lies in [0, min(30000, 500 x 2^(n-1))] ms, or equals retryAfterMs when larger; no 7th attempt happens; the entry is failed with retry_exhausted; Retry now resets attempts to 0 and sends |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
