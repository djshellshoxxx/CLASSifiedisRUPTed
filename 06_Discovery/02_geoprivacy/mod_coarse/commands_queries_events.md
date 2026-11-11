# PS-047-04 — Commands, queries and events: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-04.R01** The module exposes functions only; it has no commands, queries or events.
- **PS-047-04.R02** Callers own capability checks; this module cannot read or write user data.
- **PS-047-04.R03** Error codes are returned inside Result values and mapped by callers to HTTP problems.

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
| DISCOVERY_COORD_INVALID | 422 | no | latitude or longitude is not a finite value in range |
| DISCOVERY_PRECISION_FORBIDDEN | 422 | no | cell is finer than L2 and may not appear in a public payload |
| DISCOVERY_RADIUS_TOO_SMALL | 422 | no | radius below the 5 km minimum |
| DISCOVERY_RADIUS_NOT_ALLOWED | 422 | no | radius is at least 5 km but not one of 5, 10, 25, 50, 100 |
| DISCOVERY_RADIUS_TOO_LARGE | 422 | no | radius would need more than 512 cells |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module - no commands or queries.

### Example

```
encode(42.6, -5.6, 5)            -> "ezs42"
encode(57.64911, 10.40744, 5)    -> "u4pru"
snap(57.64911, 10.40744, "L2")   -> "u4pru"
bucketBetween("u4pru", "u4prv")  -> "lt5"
cellsForRadius("u4pru", 10)      -> ["u4prg", "u4prs", "u4pru", …]  (precision 5, sorted, at most 512)
cellsForRadius("u4pru", 100)     -> ["u4nz", "u4pr", "u4px", …]  (precision 4, sorted)
bucketBetween("u4pru", "u4pr")   -> "lt5" (from the L1 cell center)
cellsForRadius("u4pru", 200)     -> error DISCOVERY_RADIUS_NOT_ALLOWED
assertPublicCell("u4pruy")       -> error DISCOVERY_PRECISION_FORBIDDEN
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T09 | unit | PS-047-04.R01, PS-047-04.R02, PS-047-04.R03 | inspect exports | no command, query, event or capability exists; errors map to documented codes |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
