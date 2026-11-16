# PS-138-02 — Validation rules: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-02.R01** Every scenario must assert the full invariant set after recovery, not only that the process stays alive.
- **PS-138-02.R02** Fault parameters are bounded: BUSY duration at most 30 s, clock skew at most 24 h, peer outage at most 10 min, crashes at most 5 per scenario.
- **PS-138-02.R03** A scenario without a seed or without recovery step is rejected with a typed error.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Scenario has seed, fault type, bounded parameters and a recovery step | QUALITY_CHAOS_SCENARIO_INVALID |
| V02 | After recovery every committed command appears exactly once and revisions are strictly increasing | QUALITY_CHAOS_INVARIANT_VIOLATED |
| V03 | Outbox is drained and no orphan hold or stuck saga exists within 60 s of fault removal | QUALITY_CHAOS_RECOVERY_TIMEOUT |
| V04 | Production build contains no chaos hooks | QUALITY_CHAOS_HOOK_IN_PROD |
| V05 | Fault parameters do not exceed bounds: BUSY 30 s, skew 24 h, outage 10 min, 5 crashes | QUALITY_CHAOS_SCENARIO_INVALID |
| V06 | Trust-fault scenarios fork_conflict, relay_tamper, revocation_lag and relay_down exist and pass | QUALITY_CHAOS_TRUST_SCENARIO_MISSING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T01 | unit | PS-138-01.R01, PS-138-01.R02, PS-138-02.R03 | validate a scenario file without seed or recovery | rejected with QUALITY_CHAOS_SCENARIO_INVALID |
| TEST-PS-138-09.T02 | integration | PS-138-01.R03, PS-138-02.R02, PS-138-04.R03 | scan production bundles and run with out-of-bound parameters | no chaos hooks; QUALITY_CHAOS_SCENARIO_INVALID for 31 s BUSY and 25 h skew |
| TEST-PS-138-09.T03 | chaos | PS-138-02.R01, PS-138-06.R01 | db_busy: SQLITE_BUSY for 12 s during accept commands | commands retried or DEPENDENCY_UNAVAILABLE; no half-commit; exactly-once after replay |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
