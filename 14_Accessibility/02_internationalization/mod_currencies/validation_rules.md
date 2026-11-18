# PS-112-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-02.R01 | Amount strings match `^(0|[1-9][0-9]{0,38})$` for minor units; reject anything else. | MVP |
| PS-112-02.R02 | Fraction digits never exceed `minor_exponent`; reject with `CUR.EXPONENT_MISMATCH`. | MVP |
| PS-112-02.R03 | Float or number-typed amounts are rejected at the boundary with `CUR.FLOAT_INPUT_FORBIDDEN`. | MVP |

## Data / schema
Input contract: `{"amount_minor":"1250","code":"EUR"}`. Display output: `"12.50 EUR"` (locale-specific).

## Commands / queries / events
Validation runs before any formatting call and before publish ([PS-112-04](commands_queries_events.md)).

## States & transitions
Not applicable.

## Validation & errors
| Rule | Code | Retryable | Message key | Diagnostic |
|---|---|---|---|---|
| Code not in catalog | CUR.UNKNOWN_CODE | false | err.cur.unknown_code | none |
| Code deprecated, new use | CUR.CODE_DEPRECATED | false | err.cur.code_deprecated | code |
| Fraction digits > exponent | CUR.EXPONENT_MISMATCH | false | err.cur.exponent_mismatch | exponent only |
| Number or float input | CUR.FLOAT_INPUT_FORBIDDEN | false | err.cur.float_input_forbidden | type name |
| Catalog version older than client | CUR.CATALOG_VERSION_STALE | true | err.cur.catalog_version_stale | versions |

Input values are never echoed.

## Authorization
Validation applies to all callers.

## Failure, idempotency, concurrency, offline
Client validates offline against bundled catalog; stale version triggers refresh, not failure.

## Privacy, retention, abuse
Amounts are not logged; only codes.

## Observability & budgets
Counter per code.

## Tests
- TEST-PS-112-02-01 property: random decimal strings with excess fraction digits rejected.
- TEST-PS-112-02-02 unit: JSON number input rejected.
- TEST-PS-112-02-03 unit: deprecated code accepted for display, rejected for new use.

## Acceptance criteria
1. No float value reaches formatting code (static check plus test).
2. All five codes return documented retryable values.

## Assumptions & open decisions
- ASSUMPTION: amount max 39 digits matches CTR-COM-001 R02.
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved). Not applied here.
