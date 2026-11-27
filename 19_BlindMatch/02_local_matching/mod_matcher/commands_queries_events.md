# PS-150-04 — Commands, queries and events: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-04.R01** Expose matchLocalCandidates and createLocalMatchSession as libraries without bus commands, events or provider fallback.
- **PS-150-04.R02** Pass only signal and limit to the authenticated local loader, never private criteria or intent identifiers.
- **PS-150-04.R03** Reject nonlocal modes before loading candidates and return fixed errors without input echoes.

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

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Headless library; no HTTP or command-bus registration, emitted event or audit sink.

### Example

```
match({id,expectedRevision,mode:"local"}) returns minimal public references after current-session admission.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T04 | unit | PS-150-04.R01, PS-150-04.R02, PS-150-04.R03 | Inspect candidate-loader arguments and request unavailable confidential modes | Loader sees signal and limit only; nonlocal modes invoke no loader or fallback |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
