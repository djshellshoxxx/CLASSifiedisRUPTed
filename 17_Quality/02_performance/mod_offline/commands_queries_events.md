# PS-140-04 — Commands, queries and events: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-04.R01** The module exposes pnpm test:offline (fake network, no browser, under 30 s) and pnpm test:offline:browser (Playwright, Pixel 7 profile).
- **PS-140-04.R02** The scenarios are offline_queue, flaky_replay, conflict_prompt, stale_command, cache_shell, quota_full and reload_during_replay.
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
| QUALITY_OFFLINE_DUPLICATE_EFFECT | 422 | no | a queued command had its effect applied more than once (exit 1) |
| QUALITY_OFFLINE_SILENT_OVERWRITE | 422 | no | a conflict was resolved without user choice (exit 1) |
| QUALITY_OFFLINE_AUTH_CACHED | 422 | no | authenticated API response found in cache (exit 1) |
| QUALITY_OFFLINE_STALE_REPLAYED | 422 | no | a command older than 7 days was replayed automatically (exit 1) |
| QUALITY_OFFLINE_BACKOFF_INVALID | 422 | no | retry schedule outside the documented backoff (exit 1) |
| QUALITY_OFFLINE_OVERCLAIM | 422 | no | UI claimed more certainty than the reached sync state (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:offline
  TEST-PS-140-09.T03 flaky_replay: 10 resets, 1 effect   OK
  TEST-PS-140-09.T05 cache_shell: auth responses cached = 0   OK
$ pnpm test:offline:browser --grep conflict_prompt
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T06 | unit | PS-140-04.R01, PS-140-04.R02, PS-140-04.R03 | run the scripts and read exit codes | fake-network suite under 30 s; browser variant runs scenario list; exit codes as documented |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
