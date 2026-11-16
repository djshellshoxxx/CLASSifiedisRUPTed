# PS-081-03 — Workflow state machine: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-03.R01** All functions are pure and deterministic; they hold no state and never mutate inputs.
- **PS-081-03.R02** Class comparison is a total order P0 less than P1 less than P2 less than P3 less than P4, and flow rules are monotonic.
- **PS-081-03.R03** Adding a new class or sink is a breaking change requiring a new library major version.

## Specification

**Note:** Stateless pure functions; no lifecycle.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T03 | unit | PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 9 sinks) | result equals the PRV-001 table; P3 and P4 never allowed to log, federation, notification, projection |
| TEST-PS-081-09.T04 | unit | PS-081-02.R03, PS-081-03.R03 | locations L0 to L4 for public sinks | L3 and L4 snapped to L2 cell or refused with PRIVACY_LOCATION_TOO_PRECISE; L0 to L2 pass |
| TEST-PS-081-09.T05 | property | PS-081-03.R01, PS-081-03.R03, PS-081-06.R01 | random records and schemas | redaction is idempotent and monotonic; class order is total |
| TEST-PS-081-09.T12 | integration | PS-081-07.R02, PS-081-03.R03 | CI lint on the repository schemas | fails for an injected unannotated field and an event class below its max field class; passes otherwise |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
