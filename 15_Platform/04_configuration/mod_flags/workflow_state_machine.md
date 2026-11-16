# PS-124-03 — Workflow state machine: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-03.R01** A flag key has three values and any change goes through the same validated transition.
- **PS-124-03.R02** A change and its cascade are atomic, so all dependents change or none.
- **PS-124-03.R03** Evaluation always reflects the committed state after at most 30 s of caching, and immediately in the writing process.

## Specification

**Note:** A flag key is a cyclic value register, not a lifecycle with a terminal state. Allowed value changes: off to on, off to beta, beta to on, on to beta, on to off, beta to off, each only when the dependency rule passes (V03, V04) and the key is not locked (V05); each change emits platform.flag.changed.

### Timeouts and scheduled transitions

- Evaluation cache TTL 30000 ms; cleared immediately in the writing process on every change and on platform.tenant.created for that tenant.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T03 | property | PS-124-02.R02, PS-124-03.R01, PS-124-01.R02 | random settings and random changes over random acyclic registries | stored state never violates the dependency rule; evaluation never throws; unknown keys evaluate off |
| TEST-PS-124-09.T04 | integration | PS-124-03.R02, PS-124-06.R02 | cascade off of B with A and D on, injected failure on the third write | no key changed; without failure A, D, B off in one transaction with three events |
| TEST-PS-124-09.T05 | unit | PS-124-03.R03, PS-124-08.R02 | write then evaluate in the same process and in a second process | same process sees new value immediately; second within 30 s |
| TEST-PS-124-09.T09 | integration | PS-124-06.R01, PS-124-03.R01 | same Idempotency-Key replayed with same and different body; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
