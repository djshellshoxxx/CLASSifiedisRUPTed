# PS-074-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, Validation table), CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-02.R01 | Parser accepts only the amount grammar in PS-074-01 R01: no sign, no separator, no exponent notation, no leading zeros except `0`. | MVP |
| PS-074-02.R02 | Scaling input (major to minor) accepts only decimal strings with at most `exponent` fractional digits; more digits → error, never silent rounding. | MVP |
| PS-074-02.R03 | Overflow: any intermediate or result > 39 digits → error. | MVP |
| PS-074-02.R04 | Zero amounts are rejected for claims (`COM.AMOUNT_INVALID`) but valid as rule-set inputs. | MVP |
| PS-074-02.R05 | Unsupported rounding mode name → error. | MVP |

## Data / schema
Error reasons: `grammar`, `leading_zero`, `too_many_digits`, `fraction_digits`, `overflow`, `rounding_unsupported`.

## Commands / queries / events
Library functions in PS-074-04.

## States & transitions
None.

## Validation & errors
| Condition | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Grammar violation | `PREC.GRAMMAR` | validation / 400 | false |
| Overflow | `PREC.OVERFLOW` | validation / 400 | false |
| Too many fraction digits | `PREC.SCALE_EXCEEDED` | validation / 400 | false |
| Unsupported rounding | `PREC.ROUNDING_UNSUPPORTED` | validation / 400 | false |
| Claim zero amount | `COM.AMOUNT_INVALID` | validation / 400 | false |

## Authorization
None.

## Failure, idempotency, concurrency, offline
Deterministic; no I/O.

## Privacy, retention, abuse
Error values are never echoed (CTR-ERR-001 R07).

## Observability & budgets
Counter by reason in calling services.

## Tests
- TEST-PS-074-02-01 (unit): grammar accept and reject list (`0`, `1`, `01`, `1.0`, `-1`, `1e3`, `+1`, ` 1`).
- TEST-PS-074-02-02 (unit): fraction digits beyond exponent rejected.
- TEST-PS-074-02-03 (property): overflow boundary at 10^39 - 1 and 10^39.
- TEST-PS-074-02-04 (unit): error values not included in messages.

## Acceptance criteria
1. Grammar tests pass exhaustively for length ≤ 3 and sampled longer strings.
2. No silent rounding on input.
3. Overflow never wraps.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
