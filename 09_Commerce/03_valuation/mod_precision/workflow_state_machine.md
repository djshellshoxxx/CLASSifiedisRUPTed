# PS-074-03 — workflow state machine (conversion pipeline)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04 quote pinning, Failure section). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-03.R01 | Conversion pipeline stages: `parse` → `validate_scale` → `multiply` → `round_half_even` → `range_check` → `emit`. | MVP |
| PS-074-03.R02 | Each stage is pure; failure at any stage returns its error and no partial output. | MVP |
| PS-074-03.R03 | Conversion output: `amount_minor` in target currency units, computed as `round_half_even(amount_base_minor × rate × 10^(quote_exp − base_exp) ÷ 10^rate_scale)` with exact rational arithmetic. | MVP |
| PS-074-03.R04 | Same inputs always produce the same output (no clock, no locale). | MVP |

## Data / schema
Stage record (debug only): `stage`, `ok`, `reason`. Not persisted.

## Commands / queries / events
None (library).

## States & transitions
| From | Event | To |
|---|---|---|
| `parse` | ok | `validate_scale` |
| `validate_scale` | ok | `multiply` |
| `multiply` | ok | `round_half_even` |
| `round_half_even` | ok | `range_check` |
| `range_check` | ok | `emit` |
| any | error | `failed` (error returned) |

## Validation & errors
Per PS-074-02.

## Authorization
None.

## Failure, idempotency, concurrency, offline
Pure; thread-safe; no caches with mutable state.

## Privacy, retention, abuse
No data stored.

## Observability & budgets
Benchmark: conversion p99 ≤ 50 µs (ASSUMPTION).

## Tests
- TEST-PS-074-03-01 (unit): each stage error path.
- TEST-PS-074-03-02 (golden): HALF_EVEN ties (x.5 to even) for 100 vectors.
- TEST-PS-074-03-03 (property): determinism over 10,000 random inputs.
- TEST-PS-074-03-04 (property): converting A→B→A within one rate does not exceed one minor unit drift (ASSUMPTION; documented, not an identity).

## Acceptance criteria
1. Golden HALF_EVEN vectors pass.
2. No partial output on error.
3. Determinism verified.

## Assumptions & open decisions
- ASSUMPTION: round-trip drift bound.
- D03 (PROVISIONAL default, unapproved).
