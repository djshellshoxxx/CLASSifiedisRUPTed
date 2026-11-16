# PS-138-04 — Commands, queries and events: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-04.R01** The module exposes pnpm test:chaos (smoke profile), pnpm test:chaos:nightly and pnpm test:chaos --scenario <name> --seed <n>.
- **PS-138-04.R02** Scenarios are db_busy, consumer_crash, duplicate_delivery, clock_skew, peer_outage, combined_busy_crash, fork_conflict, relay_tamper, revocation_lag and relay_down.
- **PS-138-04.R03** Exit codes: 0 pass, 1 invariant violated, 2 recovery timeout, 3 scenario invalid.

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
| QUALITY_CHAOS_SCENARIO_INVALID | 422 | no | scenario lacks seed or recovery, or exceeds fault bounds (exit 3) |
| QUALITY_CHAOS_INVARIANT_VIOLATED | 422 | no | an invariant failed after recovery (exit 1) |
| QUALITY_CHAOS_RECOVERY_TIMEOUT | 422 | no | system did not recover within 60 s (exit 2) |
| QUALITY_CHAOS_HOOK_IN_PROD | 422 | no | chaos hook detected in a production bundle (exit 1) |
| QUALITY_CHAOS_TRUST_SCENARIO_MISSING | 422 | no | a mandatory trust-fault scenario is missing or failing (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:chaos --scenario duplicate_delivery --seed 31
  inject: deliver event offer.accepted x3, reorder 2
  recover: 4.1 s
  invariants: exactly-once OK, revisions monotonic OK, outbox drained OK
  exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T02 | integration | PS-138-01.R03, PS-138-02.R02, PS-138-04.R03 | scan production bundles and run with out-of-bound parameters | no chaos hooks; QUALITY_CHAOS_SCENARIO_INVALID for 31 s BUSY and 25 h skew |
| TEST-PS-138-09.T05 | chaos | PS-138-03.R03, PS-138-04.R02 | run each scenario twice in sequence | each starts from a fresh relay and database |
| TEST-PS-138-09.T06 | chaos | PS-138-04.R01, PS-138-04.R03, PS-138-09.R02 | duplicate_delivery with planted double-apply bug | invariant violated and exit 1 |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
