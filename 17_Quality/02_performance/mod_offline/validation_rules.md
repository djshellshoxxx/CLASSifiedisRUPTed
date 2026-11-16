# PS-140-02 — Validation rules: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-02.R01** Every offline test must assert exactly-once delivery: the receiving vault or relay mailbox sees each statement once, identified by its statement ID and Idempotency-Key.
- **PS-140-02.R02** Conflict tests must assert that CONFLICT_REVISION never produces a silent overwrite and the prompt offers keep mine, take theirs and merge.
- **PS-140-02.R03** A queued command older than 7 days must be marked stale and not replayed automatically.
- **PS-140-02.R04** The UI status for a statement never exceeds the sync state reached (local committed, prepared, transport_acknowledged, peer_accepted); a test fails with QUALITY_OFFLINE_OVERCLAIM when the UI shows delivered before peer_accepted.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Receiving vault or relay mailbox sees each queued statement exactly once per statement ID | QUALITY_OFFLINE_DUPLICATE_EFFECT |
| V02 | CONFLICT_REVISION after reconnect shows the three-way prompt and never overwrites silently | QUALITY_OFFLINE_SILENT_OVERWRITE |
| V03 | Authenticated API responses are not present in Cache Storage | QUALITY_OFFLINE_AUTH_CACHED |
| V04 | Queued commands older than 7 days are not replayed automatically | QUALITY_OFFLINE_STALE_REPLAYED |
| V05 | Backoff schedule matches 1 s doubling to 60 s with jitter of 20 percent | QUALITY_OFFLINE_BACKOFF_INVALID |
| V06 | UI status never exceeds the reached sync state | QUALITY_OFFLINE_OVERCLAIM |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | replay one command across 10 connection resets | server-side effect count is exactly 1 |
| TEST-PS-140-09.T03 | integration | PS-140-02.R02, PS-140-03.R01 | two devices edit the same entity offline then reconnect | second gets CONFLICT_REVISION and the three-action prompt appears; no overwrite |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance fake clock 8 days with a queued command | command marked stale and not sent; non-retryable error is not retried |
| TEST-PS-140-09.T17 | e2e | PS-140-02.R04 | drive a statement through each sync state | UI label matches the state; delivered shown only at peer_accepted; plant an overclaim bug and see QUALITY_OFFLINE_OVERCLAIM |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
