# PS-032-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-02.R01 | `price_minor` matches `^[1-9][0-9]{0,14}$` (> 0). Otherwise `SVCQUOTE.PRICE_INVALID`. | MVP |
| PS-032-02.R02 | Sum of `line_items[].amount_minor` equals `price_minor`. Otherwise `SVCQUOTE.LINE_ITEMS_MISMATCH`. | MVP |
| PS-032-02.R03 | `valid_until` > now and ≤ now + 14 days (ASSUMPTION). Otherwise `SVCQUOTE.VALIDITY_INVALID`. | MVP |
| PS-032-02.R04 | Every `avw_id` belongs to the quote's `srv_id`, is OPEN or HELD by this quote, and is not in the past. Otherwise `SVCQUOTE.WINDOW_UNAVAILABLE`. | MVP |
| PS-032-02.R05 | If `currency` differs from the currency of the listing, a `qte_` quote ID is required. Otherwise `SVCQUOTE.CURRENCY_MISMATCH`. | MVP |
| PS-032-02.R06 | `scope_text` ≤ 2000 characters. Otherwise `SVCQUOTE.SCOPE_TOO_LONG`. | MVP |
| PS-032-02.R07 | Provider may not send a quote to itself (`customer` = `provider`) → `SVCQUOTE.SELF_QUOTE`. | MVP |

## Data / schema
Validation runs on the complete quote at `svcquote.create` and again at `svcquote.send`, because hold state can change between the two.

## Commands / queries / events
Enforced by `svcquote.create`, `svcquote.send`, `svcquote.accept`, `svcquote.supersede`.

## States & transitions
Not applicable. Validation failure leaves state unchanged.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| SVCQUOTE.PRICE_INVALID | false | validation / 400 | field path |
| SVCQUOTE.LINE_ITEMS_MISMATCH | false | validation / 400 | field path, no amounts |
| SVCQUOTE.VALIDITY_INVALID | false | validation / 400 | rule enum |
| SVCQUOTE.WINDOW_UNAVAILABLE | false | unprocessable_state / 422 | window ID class |
| SVCQUOTE.CURRENCY_MISMATCH | false | unprocessable_state / 422 | currency class |
| SVCQUOTE.SCOPE_TOO_LONG | false | validation / 400 | count |
| SVCQUOTE.SELF_QUOTE | false | forbidden / 403 | none |

Messages use `err.svcquote.<code>` keys. No amounts echoed.

## Authorization
Runs after PS-032-05. Self-quote is a validation rule, not an authorization failure, and is returned only to the provider.

## Failure, idempotency, concurrency, offline
Deterministic. Offline drafts validated locally as preview only; server result authoritative (D08).

## Privacy, retention, abuse
`scope_text` is scanned for off-platform contact details (phone, e-mail, messaging handles). A match is flagged to F12 as an advisory signal; it does not block the quote (MVP). Rule-failure counts feed abuse signals.

## Observability & budgets
Validation ≤ 10 ms p95. Metric `svcquote_validation_rejections_total{code}`.

## Tests
- TEST-PS-032-02-01 (unit): one failing input per code.
- TEST-PS-032-02-02 (property): line items summing to price ± 1 minor unit always rejected.
- TEST-PS-032-02-03 (integration): window released between create and send → `SVCQUOTE.WINDOW_UNAVAILABLE`.
- TEST-PS-032-02-04 (unit): scope of 2000 accepted, 2001 rejected.

## Acceptance criteria
1. All seven SVCQUOTE codes registered in CTR-ERR-001 lint.
2. Integer-only arithmetic; no float path.
3. Error bodies contain no amounts or scope text.

## Assumptions & open decisions
- ASSUMPTION: 14-day maximum validity; 8 windows per quote.
- PROVISIONAL: currency handling per D03 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
