# PS-047-05 — Authorization and capabilities: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-05.R01** The library performs no authorization and holds no data; any caller may use it.
- **PS-047-05.R02** Authorization for storing or disclosing locations lives in F06.S02.M02 and the modules that publish payloads.
- **PS-047-05.R03** No capability is defined by this module.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T10 | property | PS-047-05.R01, PS-047-05.R03, PS-047-06.R01 | 200 runs of the same call sequence | byte-identical results, no I/O performed |
| TEST-PS-047-09.T11 | abuse | PS-047-05.R02, PS-047-07.R01, PS-047-07.R02, PS-047-07.R03 | scan the public API for functions returning coordinates or cells longer than 5 characters | none found; contract helper fails a fake publisher that skips the guard |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
