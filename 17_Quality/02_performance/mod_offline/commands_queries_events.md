# PS-140-04 — Commands, queries and events: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-04.R01** The module exposes pnpm test:offline (fake network, no browser, under 30 s) and pnpm test:offline:browser (Playwright, Pixel 7 profile).
- **PS-140-04.R02** The scenarios are offline_queue, flaky_replay, conflict_prompt, fork_freeze, expiry_prompt, retry_exhausted, outbox_full, cache_shell, quota_full, vault_lock and reload_during_replay.
- **PS-140-04.R03** Exit codes: 0 pass, 1 assertion failure, 2 configuration failure.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_OFFLINE_DUPLICATE_EFFECT | 422 | no | a queued statement or relay command had its effect applied more than once (exit 1) |
| QUALITY_OFFLINE_SILENT_OVERWRITE | 422 | no | a conflict was resolved without user choice, offered an option other than the two F15.S01.M01 actions, overwrote the peer's signed revision, or a fork was resolvable (exit 1) |
| QUALITY_OFFLINE_AUTH_CACHED | 422 | no | relay-authenticated response found in Cache Storage (exit 1) |
| QUALITY_OFFLINE_STALE_REPLAYED | 422 | no | an entry past its 7-day expiry was sent, or the day-6 prompt or the expiry did not happen (exit 1) |
| QUALITY_OFFLINE_BACKOFF_INVALID | 422 | no | retry delays, attempt count or final state differ from CTR-IDM-001 IDM-4 (exit 1) |
| QUALITY_OFFLINE_OVERCLAIM | 422 | no | a label is stronger than the F15.S01.M01 label for the reached state (exit 1) |
| QUALITY_OFFLINE_LOCK_UNSAFE | 422 | no | vault lock or principal switch deleted data, left keys or relay tokens usable, sent entries while locked, or left the image partition bound (exit 1) |
| QUALITY_OFFLINE_LIMIT_INVALID | 422 | no | outbox cap not enforced or an entry silently dropped (exit 1) |
| QUALITY_OFFLINE_PLAINTEXT_QUEUED | 422 | no | an entry for a relay destination holds plaintext P2 or any P3 field (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:offline
  TEST-PS-140-09.T03 flaky_replay: 10 resets, 1 effect   OK
  TEST-PS-140-09.T05 cache_shell: auth responses cached = 0   OK
  TEST-PS-140-09.T09 retry_exhausted: 6 attempts, delays within IDM-4 bounds, failed (retry_exhausted)   OK
  TEST-PS-140-09.T08 vault_lock: keys dropped, 3 entries kept unsent, records unreadable until unlock   OK
$ pnpm test:offline:browser --grep conflict_prompt
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T06 | unit | PS-140-04.R01, PS-140-04.R02, PS-140-04.R03 | run the scripts and read exit codes | fake-network suite under 30 s; browser variant runs scenario list; exit codes as documented |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
