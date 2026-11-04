# PS-123-03 — Workflow state machine: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-03.R01** The registry has no runtime lifecycle; it is regenerated per build and replaced as a whole.
- **PS-123-03.R02** Generation is an ordered pipeline of parse, merge, validate, order and write steps, and any failing step prevents writing.
- **PS-123-03.R03** The build never publishes a registry that failed validation.

## Specification

**Note:** No entity lifecycle. Generation pipeline steps: parse planning/modules.yaml, merge module.spec.yaml depends_on and scope, validate V01-V04 and V07, topologically order, canonicalize and hash, write registry.generated.json atomically.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T03 | property | PS-123-03.R01, PS-123-02.R01 | random digraphs with and without injected back edges | cycle detected exactly when one exists; topological order places dependencies first |
| TEST-PS-123-09.T04 | integration | PS-123-03.R02, PS-123-03.R03, PS-123-06.R02 | break validation in each pipeline step | generation fails, previous file untouched, nothing published |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
