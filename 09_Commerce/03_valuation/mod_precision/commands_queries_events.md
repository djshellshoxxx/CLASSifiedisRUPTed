# PS-074-04 — library interface

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (amount and quote encodings), CTR-SCH-001, CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-04.R01 | Functions: `parse_amount(str) -> minor`, `format_amount(minor, exp) -> str`, `scale_to_minor(major_str, exp) -> minor`, `convert_minor(amount_minor, rate, rate_scale, base_exp, quote_exp) -> minor`. | MVP |
| PS-074-04.R02 | No function accepts or returns a float type. | MVP |
| PS-074-04.R03 | Each function returns `Result<T, PREC.*>`; no exceptions cross the boundary. | MVP |
| PS-074-04.R04 | No event is emitted by this module. | MVP |

## Data / schema
Inputs and outputs are decimal strings or arbitrary-precision integers.

## Commands / queries / events
No commands, queries or events. Calling services emit their own events.

## States & transitions
None.

## Validation & errors
Per PS-074-02.

## Authorization
None.

## Failure, idempotency, concurrency, offline
Pure functions; offline-safe.

## Privacy, retention, abuse
No logging of inputs.

## Observability & budgets
Callers record error counts only.

## Tests
- TEST-PS-074-04-01 (contract): public API surface matches R01 (generated).
- TEST-PS-074-04-02 (lint): no float in signatures.
- TEST-PS-074-04-03 (unit): every function returns `Result` on invalid input.

## Acceptance criteria
1. API surface matches R01.
2. Float lint clean.

## Assumptions & open decisions
- D03 (PROVISIONAL, unapproved).
