# PS-063-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R04), CTR-ERR-001, CTR-CAP-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-02.R01 | `amount_minor` matches `^(0|[1-9][0-9]{0,38})$`; `exponent` equals registry value for `currency.code`. | MVP |
| PS-063-02.R02 | Cross-currency compensation requires `quote_id` with `now ≤ valid_until`; new quotes are not created by this module. | MVP |
| PS-063-02.R03 | Offerer ≠ recipient. Self-offers rejected. | MVP |
| PS-063-02.R04 | A counter must change at least one term; identical terms → `OFFERS.NO_CHANGE`. | MVP |
| PS-063-02.R05 | Counter allowed only from `open` state of the immediately prior version. | MVP |
| PS-063-02.R06 | `expires_at` in (now, now + 14 d]. Default 72 h when omitted. | MVP |
| PS-063-02.R07 | Counter depth ≤ 20; deeper → `OFFERS.DEPTH_EXCEEDED`. | MVP |

## Data / schema
Rule identifiers for `details[].rule`: `amount_format`, `exponent_mismatch`, `quote_missing`, `quote_expired`, `self_offer`, `no_change`, `state_forbids`, `expiry_range`, `depth_exceeded`, `compensation_count`.

## Commands / queries / events
Validation precedes idempotency lookup for malformed input.

## States & transitions
Validation does not change state.

## Validation & errors
| Code | Retryable | Category / HTTP | message_key | Diagnostic |
|---|---|---|---|---|
| OFFERS.AMOUNT_INVALID | false | validation / 400 | err.offers.amount_invalid | field path, rule |
| OFFERS.CURRENCY_MISMATCH | false | unprocessable_state / 422 | err.offers.currency | rule |
| OFFERS.QUOTE_MISSING | false | unprocessable_state / 422 | err.offers.quote_missing | field path |
| COM.QUOTE_EXPIRED | false | unprocessable_state / 422 | err.com.quote_expired | owned by CTR-COM-001 |
| OFFERS.SELF_OFFER | false | validation / 400 | err.offers.self_offer | none |
| OFFERS.NO_CHANGE | false | validation / 400 | err.offers.no_change | none |
| OFFERS.STATE_FORBIDS | false | conflict / 409 | err.offers.state | state name |
| OFFERS.EXPIRY_RANGE | false | validation / 400 | err.offers.expiry | field path |
| OFFERS.DEPTH_EXCEEDED | false | unprocessable_state / 422 | err.offers.depth | none |
| SYS.NOT_FOUND | false | not_found / 404 | err.sys.not_found | none |

## Authorization
Validation of target participation uses [PS-063-05](authorization_capabilities.md); body party IDs ignored (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Server re-validates all money fields at commit even when the client pre-validated offline.

## Privacy, retention, abuse
Diagnostics never echo amounts or currency codes.

## Observability & budgets
`offers_validation_reject_total{code}`.

## Tests
- TEST-PS-063-02-01 (unit): each code reachable; amount `"0250000"` rejected.
- TEST-PS-063-02-02 (negative): float amount `2500.00` rejected with `OFFERS.AMOUNT_INVALID`.
- TEST-PS-063-02-03 (time): counter with expired cross-currency quote → `COM.QUOTE_EXPIRED`.
- TEST-PS-063-02-04 (boundary): `expires_at` at now + 14 d + 1 ms rejected.

## Acceptance criteria
1. No float or leading-zero money value accepted (TEST-PS-063-02-01, -02).
2. Quote expiry enforced at offer creation (TEST-PS-063-02-03).

## Assumptions & open decisions
- ASSUMPTION: 14-day maximum expiry; 20 counter depth.
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved).
