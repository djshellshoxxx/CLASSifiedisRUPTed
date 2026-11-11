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
| TEST-PS-081-09.T03 | unit | PS-081-01.R04, PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 11 sinks) and the location cap per sink | every result equals the matrix in the domain_schema note; P4 denied everywhere; P3 only to event, export and ui_owner |
| TEST-PS-081-09.T05 | property | PS-081-03.R01, PS-081-03.R02, PS-081-06.R01 | random records and schemas | redaction is pure, idempotent and monotonic; class order is total |
| TEST-PS-081-09.T15 | unit | PS-081-10.R01, PS-081-10.R02, PS-081-10.R03, PS-081-03.R03 | load v1 maps and a v2 candidate with an added class or sink | v1 maps load; an added class or sink requires the major version flag |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
