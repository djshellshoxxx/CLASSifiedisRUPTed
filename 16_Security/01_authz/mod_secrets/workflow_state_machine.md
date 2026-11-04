# PS-127-03 — Workflow state machine: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-03.R01** Startup is all-or-nothing, so if any required secret fails validation the relay does not open its listener.
- **PS-127-03.R02** Reload on SIGHUP loads new values atomically and keeps the previous value valid for the configured overlap of at most 300 seconds.
- **PS-127-03.R03** Rotation of the relay data key re-wraps stored per-object keys in batches of 1 000 and records progress so it is resumable.

## Specification

**Note:** No entity lifecycle. Secret loading is a startup and reload procedure, not a stateful entity.

### Timeouts and scheduled transitions

- Overlap window after rotation: configurable 0..300 s, default 120 s.
- Weekly full-history secret scan every Monday 02:00 UTC in CI.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T04 | unit | PS-127-03.R02, PS-127-04.R01, PS-127-04.R02 | equalConstantTime across equal, different and length-mismatched inputs; timing harness over 100 000 runs | correct results; no statistically significant timing difference between early and late mismatch |
| TEST-PS-127-09.T06 | integration | PS-127-03.R01, PS-127-03.R02, PS-127-03.R03, PS-127-06.R01, PS-127-06.R02 | SIGHUP reload with overlap 120 s; failed reload; key rotation interrupted and resumed | atomic swap; old value valid within overlap only; failed reload keeps previous; rotation resumes without double work |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
