# F09.S03.M03 — Money precision

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S03](../SPEC.md). **Process IDs:** PS-074-01…PS-074-10. **Code:** `packages/commerce/src/valuation/precision`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A dependency-free library that implements the Money type of CTR-MNY-001. It represents amounts as bigint minor units, parses and serializes them without locale or floating point, rounds HALF_EVEN exactly once per conversion, converts through rational FX quotes, and splits totals with the largest-remainder method so allocations always sum exactly. Every commerce, barter and auction module imports it; it has no storage, network or clock access.

## Responsibilities

- Define Money { amount, currency } with a bigint core and the canonical JSON form (decimal integer string of minor units plus currency code).
- Provide exact add, subtract, negate, compare, sign and sum with currency-mismatch protection.
- Provide rational conversion using FX quote {num, den} and minor-unit exponents with HALF_EVEN rounding applied once at the end, plus FLOOR for fee caps.
- Provide allocation by integer weights (largest remainder) and even split so that parts sum exactly to the total.
- Provide neutral decimal-string parse and format for a given decimals count, never locale aware.

## Not responsible for

- Currency definitions, decimals and the allowed-currency list (F09.S03.M01 currency registry).
- Obtaining, storing or expiring FX quotes (F09.S03.M02 rates).
- Locale-aware display of amounts, grouping separators and symbols (F14 localization).
- Future: pluggable rounding modes beyond HALF_EVEN and FLOOR, and arbitrary-precision decimal types for non-monetary quantities.

## User stories

- As a developer, I can add, compare and convert Money values knowing that no floating point value is ever involved.
- As a barter participant, I see a fair split of a compensation amount among several parties that adds up to exactly the agreed total.
- As an auditor, I can recompute any displayed conversion from the pinned quote and get the identical minor-unit result.

## Edge cases

- Conversion of 1 JPY (0 decimals) to BTC (8 decimals) with a tiny rate rounds to 0 and is reported as rounded to zero, not as an error.
- Exactly half-way values (x.5 minor units) round to the nearest even integer, both for positive and negative amounts.
- An amount string with a leading plus, leading zeros, a decimal point or exponent notation is rejected as invalid input.
- Operands with different currencies passed to add or compare throw a programmer error and never coerce silently.
- Allocation of 100 minor units over weights [1, 1, 1] returns [34, 33, 33] in a stable index order; allocation over all-zero weights is refused.
- A product that exceeds the 38-digit bound after multiplication in intermediate bigint arithmetic is computed exactly and only the final result is bound-checked.

## UX and accessibility



Headless library. No screens; the neutral formatter output is consumed by F14 localized components. Formatter output is ASCII digits with '.' as decimal separator and never rounds.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-MNY-001, CTR-ERR-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-074-01 | [Domain schema](domain_schema.md) | 3 |
| PS-074-02 | [Validation rules](validation_rules.md) | 3 |
| PS-074-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-074-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-074-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-074-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-074-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-074-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-074-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-074-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/valuation/precision/index.ts`.

## Acceptance criteria

- Every property test passes with at least 10 000 cases and the shared vectors give identical results in all implementations.
- Allocation never produces parts that fail to sum to the total in any generated case.
- No floating point type, function or literal is present in the package (lint and static analysis).
