# PS-074-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02 amount encoding, quote schema `rate`, `rate_scale`, `rounding`), CTR-PRV-001 (PUBLIC rule set). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-01.R01 | Amount type: `amount_minor` is a non-negative integer of at most 39 decimal digits, held as a string at every boundary. | MVP |
| PS-074-01.R02 | Rate type: `rate` decimal string matching `^(0\|[1-9][0-9]{0,17})(\.[0-9]{1,18})?$`, with `rate_scale` = number of fractional digits. | MVP |
| PS-074-01.R03 | Exponent type: integer 0–18 from `cur_` (PENDING prefix). | MVP |
| PS-074-01.R04 | Rounding mode: `HALF_EVEN` only (ASSUMPTION; CTR-COM-001 quote `rounding` const). | MVP |
| PS-074-01.R05 | No floating-point type appears in any commerce schema or API (CTR-COM-001 R02). | MVP |

## Data / schema
Rule set record `precision_rules` (versioned):

| Field | Type | Class |
|---|---|---|
| `rules_version` | SemVer | PUBLIC |
| `max_digits` | integer, 39 | PUBLIC |
| `rounding` | const `HALF_EVEN` | PUBLIC |
| `max_rate_scale` | integer, 18 | PUBLIC |
| `vector_suite_sha256` | hex 64 | PUBLIC |

Amounts, rates and exponents are classed by the owning records (claims: FINANCIAL_EVIDENCE; quotes: PUBLIC).

## Commands / queries / events
Specified in PS-074-04 (library-level only).

## States & transitions
Rule-set versions: `draft`, `published`.

## Validation & errors
See PS-074-02.

## Authorization
None (library).

## Failure, idempotency, concurrency, offline
Pure functions; no shared state.

## Privacy, retention, abuse
No personal data.

## Observability & budgets
None beyond PS-074-08.

## Tests
- TEST-PS-074-01-01 (unit): 39-digit amount accepted; 40-digit rejected.
- TEST-PS-074-01-02 (lint): no float type in commerce packages.
- TEST-PS-074-01-03 (unit): rate with 19 fractional digits rejected.

## Acceptance criteria
1. Types match the table.
2. Float lint passes.
3. Rule-set version published with vector digest.

## Assumptions & open decisions
- ASSUMPTION: HALF_EVEN only.
- D03 (PROVISIONAL default, unapproved).
