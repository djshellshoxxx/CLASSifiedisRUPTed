# PS-067-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R07, R08), CTR-ERR-001, CTR-PRV-001 (R03). **Decisions:** D03, D09 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-02.R01 | `method = cash` is accepted only when `cashcfg` for the (currency, region_class) pair is `enabled`. | MVP |
| PS-067-02.R02 | `amount_minor` ≤ `ceiling_minor` for the pair. Above ceiling: rejected. | MVP |
| PS-067-02.R03 | Cross-currency cash claims require a `qte_` (COM.QUOTE_MISSING / COM.QUOTE_EXPIRED). | MVP |
| PS-067-02.R04 | Any attempt to call `adapter.verify` or `clm.verified` on a cash claim is refused with `COM.CASH_NOT_VERIFIABLE`. | MVP |
| PS-067-02.R05 | `direction` and counterparty must match the `trx_` parties. | MVP |

## Data / schema
Rule enum: `method_enabled`, `ceiling`, `quote_required`, `quote_valid`, `not_verifiable`, `party_direction`, `amount_format`.

## Commands / queries / events
Applies to `clm.submit` when `method = cash`, and to `cash_method.configure`.

## States & transitions
Validation failure creates no claim and no event.

## Validation & errors
| Rule | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Method disabled | `CASH.METHOD_DISABLED` | unprocessable_state / 422 | false |
| Above ceiling | `CASH.CEILING_EXCEEDED` | unprocessable_state / 422 | false |
| Amount format | `COM.AMOUNT_INVALID` | validation / 400 | false |
| Quote missing | `COM.QUOTE_MISSING` | unprocessable_state / 422 | false |
| Quote expired | `COM.QUOTE_EXPIRED` | unprocessable_state / 422 | false |
| Verify attempted | `COM.CASH_NOT_VERIFIABLE` | unprocessable_state / 422 | false |
| Party mismatch | `SYS.NOT_FOUND` | not_found / 404 | false |

Diagnostics carry the rule enum only; never the amount with party identifiers together (CTR-ERR-001 R06).

## Authorization
Party check first (PS-067-05).

## Failure, idempotency, concurrency, offline
Deterministic; server time at commit for quote validity.

## Privacy, retention, abuse
No amount in logs. Counter by (code, rule).

## Observability & budgets
Alert if `CASH.METHOD_DISABLED` exceeds 5% of cash submissions in an hour (config drift signal).

## Tests
- TEST-PS-067-02-01 (unit): each row of the error table.
- TEST-PS-067-02-02 (unit): amount equal to ceiling accepted; ceiling + 1 minor unit rejected.
- TEST-PS-067-02-03 (unit): exponent-0 currency (JPY-like) and exponent-2 currency scale ceilings correctly.
- TEST-PS-067-02-04 (negative): verify call on cash claim returns `COM.CASH_NOT_VERIFIABLE`.

## Acceptance criteria
1. Error table implemented and registered.
2. Ceiling enforcement holds across currency exponents (golden vectors).
3. No cash claim path reaches verification (test).

## Assumptions & open decisions
- ASSUMPTION: default ceilings are placeholders until Commerce Lead sets them.
- D03, D09 (PROVISIONAL, unapproved).
