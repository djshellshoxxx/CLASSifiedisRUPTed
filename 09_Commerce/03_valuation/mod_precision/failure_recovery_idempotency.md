# PS-074-06 — Failure recovery and idempotency: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-06.R01** All functions are deterministic and idempotent; repeated calls with the same input return identical results.
- **PS-074-06.R02** There is no shared mutable state, so concurrent callers cannot interfere.
- **PS-074-06.R03** Failure is signalled with Result errors for input problems and thrown errors only for programmer mistakes.

## Specification

- **idempotency:** Pure functions; any call is trivially idempotent.
- **concurrency:** No shared state. Safe from any number of workers and the UI thread.
- **retries:** Not applicable; callers never retry a deterministic failure.
- **offline:** Fully offline; runs in the browser, service worker and relay identically.
- **partial failure:** No partial results: a function either returns a complete value or an error.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T07 | unit | PS-074-03.R01, PS-074-06.R01, PS-074-06.R02 | same input executed twice, inputs frozen and compared after the call | identical outputs, inputs unmodified |
| TEST-PS-074-09.T11 | property | PS-074-06.R03, PS-074-07.R02, PS-074-07.R03 | oversized inputs of 5 000 digits and 100 000 weights | rejected within 1 ms with documented error and no amounts in the message |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
